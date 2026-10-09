import "dotenv/config";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import {
  createWalletClient,
  decodeErrorResult,
  decodeEventLog,
  encodeAbiParameters,
  encodeFunctionData,
  formatEther,
  http,
  maxUint256,
  parseAbiParameters,
  parseEther,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { iPclAbi } from "@maroo-chain/contracts/abi/precompiles/pcl/IPcl";
import { PCL_ADDRESS, RPC_URL, marooTestnet, publicClient } from "../src/chain";

const STATE_FILE = ".probe-state.json";
const MAX_OKRW = parseEther("100");
const TOKENS = ["aokrw"];

const forwarderAbi = [
  {
    type: "function",
    name: "forward",
    stateMutability: "payable",
    inputs: [{ name: "to", type: "address" }],
    outputs: [],
  },
] as const;

const initializeAbi = [
  {
    type: "function",
    name: "initialize",
    stateMutability: "nonpayable",
    inputs: [{ name: "owner_", type: "address" }],
    outputs: [],
  },
] as const;

type State = { forwarder?: Address; gwanmunForwarder?: Address; proxy?: Address };
const state: State = existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, "utf8")) : {};
const save = () => writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

const pk = process.env.PRIVATE_KEY;
if (!pk) throw new Error("PRIVATE_KEY missing in .env");
const account = privateKeyToAccount((pk.startsWith("0x") ? pk : `0x${pk}`) as Hex);
const wallet = createWalletClient({ account, chain: marooTestnet, transport: http(RPC_URL) });
const me = account.address;
const explorer = (h: string) => `${marooTestnet.blockExplorers.default.url}/tx/${h}`;

// Walk an error's cause chain for revert data.
function revertData(err: unknown): Hex | undefined {
  let e: any = err;
  for (let i = 0; e && i < 12; i++, e = e.cause) {
    if (typeof e.data === "string" && e.data.startsWith("0x")) return e.data;
    if (e.data && typeof e.data.data === "string") return e.data.data;
  }
  return undefined;
}

async function sendAndWait(label: string, send: () => Promise<Hex>) {
  const hash = await send();
  console.log(`${label} tx: ${hash}\n  ${explorer(hash)}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`  status: ${receipt.status}, block ${receipt.blockNumber}, gas ${receipt.gasUsed}`);
  if (receipt.status !== "success") throw new Error(`${label} reverted`);
  return receipt;
}

type SimResult =
  | { ok: true }
  | { ok: false; raw?: Hex; name?: string; args?: readonly unknown[]; message: string };

async function simulateForward(proxy: Address, to: Address, value: bigint): Promise<SimResult> {
  try {
    await publicClient.simulateContract({
      address: proxy,
      abi: forwarderAbi,
      functionName: "forward",
      args: [to],
      account: me,
      value,
    });
    return { ok: true };
  } catch (err: any) {
    const raw = revertData(err);
    const message = err?.shortMessage ?? err?.message ?? String(err);
    if (!raw) return { ok: false, message };
    try {
      const d = decodeErrorResult({ abi: iPclAbi, data: raw });
      return { ok: false, raw, name: d.errorName, args: d.args, message };
    } catch {
      return { ok: false, raw, message };
    }
  }
}

async function main() {
  // 0. Account
  const bal = await publicClient.getBalance({ address: me });
  console.log(`Account: ${me}\nBalance: ${formatEther(bal)} tOKRW`);
  if (bal === 0n) throw new Error("Account has no tOKRW");

  // 1. Logic contract: GwanmunForwarder, deployed earlier (see .probe-state.json)
  if (!state.gwanmunForwarder) throw new Error("gwanmunForwarder missing in .probe-state.json");
  console.log(`GwanmunForwarder (logic): ${state.gwanmunForwarder}`);

  // 2. Deploy PCL proxy. IPcl.deployPclProxy(kind, value, initData); value = 0.
  if (!state.proxy) {
    const initData = encodeAbiParameters(parseAbiParameters("address, address, bytes"), [
      state.gwanmunForwarder!,
      me,
      encodeFunctionData({ abi: initializeAbi, functionName: "initialize", args: [me] }),
    ]);
    const receipt = await sendAndWait("deployPclProxy(Transparent)", () =>
      wallet.writeContract({
        address: PCL_ADDRESS,
        abi: iPclAbi,
        functionName: "deployPclProxy",
        args: [1, 0n, initData],
      }),
    );
    let proxy: Address | undefined;
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== PCL_ADDRESS.toLowerCase()) continue;
      try {
        const ev = decodeEventLog({ abi: iPclAbi, data: log.data, topics: log.topics });
        if (ev.eventName === "PclProxyDeployed") proxy = ev.args.proxy;
      } catch {}
    }
    if (!proxy) throw new Error("PclProxyDeployed event not found; cannot determine proxy address");
    state.proxy = proxy;
    save();
  }
  const proxy = state.proxy!;
  console.log(`PCL proxy: ${proxy}`);

  const entry = await publicClient.readContract({
    address: PCL_ADDRESS,
    abi: iPclAbi,
    functionName: "pclProxy",
    args: [proxy],
  });
  console.log(`pclProxy(proxy): kind=${entry.kind} admin=${entry.admin} proxy=${entry.proxy}`);
  if (entry.kind !== 1) throw new Error(`Expected kind 1 (Transparent), got ${entry.kind}`);

  // 3. Bind VOLUME_POLICY
  const policyBlob = encodeAbiParameters(
    [
      {
        type: "tuple",
        components: [
          { name: "tokens", type: "string[]" },
          {
            name: "limits",
            type: "tuple[]",
            components: [
              { name: "minLimit", type: "uint256" },
              { name: "maxLimit", type: "uint256" },
            ],
          },
        ],
      },
    ],
    [{ tokens: TOKENS, limits: [{ minLimit: 0n, maxLimit: MAX_OKRW }] }],
  );
  const current = await publicClient.readContract({
    address: PCL_ADDRESS,
    abi: iPclAbi,
    functionName: "contractPolicies",
    args: [proxy],
  });
  if (current.policies.length === 0) {
    await sendAndWait("changeContractPolicies(VOLUME_POLICY)", () =>
      wallet.writeContract({
        address: PCL_ADDRESS,
        abi: iPclAbi,
        functionName: "changeContractPolicies",
        args: [
          {
            _contract: proxy,
            admin: me,
            policies: [{ templateId: "VOLUME_POLICY", policy: policyBlob, selector: "0x" }],
          },
        ],
      }),
    );
  } else {
    console.log("Policy already bound, skipping bind tx");
  }

  // 3b. Read back and decode
  const bound = await publicClient.readContract({
    address: PCL_ADDRESS,
    abi: iPclAbi,
    functionName: "contractPolicies",
    args: [proxy],
  });
  console.log("contractPolicies(proxy) readback:");
  console.log(`  _contract: ${bound._contract}\n  admin: ${bound.admin}`);
  let bindingOk = bound.policies.length === 1;
  for (const p of bound.policies) {
    console.log(`  templateId: ${p.templateId}\n  selector: ${p.selector}\n  policy (raw): ${p.policy}`);
    try {
      const [vp] = (await import("viem")).decodeAbiParameters(
        [
          {
            type: "tuple",
            components: [
              { name: "tokens", type: "string[]" },
              {
                name: "limits",
                type: "tuple[]",
                components: [
                  { name: "minLimit", type: "uint256" },
                  { name: "maxLimit", type: "uint256" },
                ],
              },
            ],
          },
        ],
        p.policy,
      );
      console.log(`  decoded tokens: ${JSON.stringify(vp.tokens)}`);
      for (const l of vp.limits) {
        const max = l.maxLimit === maxUint256 ? "uint256.max" : `${formatEther(l.maxLimit)} OKRW`;
        console.log(`  decoded limit: min=${l.minLimit} max=${max} (${l.maxLimit} aokrw)`);
      }
      bindingOk =
        bindingOk &&
        p.templateId === "VOLUME_POLICY" &&
        vp.tokens.length === 1 &&
        vp.tokens[0] === "aokrw" &&
        vp.limits.length === 1 &&
        vp.limits[0].minLimit === 0n &&
        vp.limits[0].maxLimit === MAX_OKRW;
    } catch (e: any) {
      console.log(`  could not decode policy blob as VolumePolicy: ${e.shortMessage ?? e.message}`);
      bindingOk = false;
    }
  }
  console.log(`Binding matches what we set: ${bindingOk}`);

  // 4. Simulations only (no gas, no state change)
  const recipient = me;
  console.log(`\nSimulating proxy.forward(${recipient}) from ${me} (eth_call only)`);

  const a = await simulateForward(proxy, recipient, parseEther("10"));
  console.log("a) 10 OKRW:", a.ok ? "simulation SUCCEEDED" : "simulation REVERTED");
  if (!a.ok) console.log(`   ${a.name ?? "undecoded"} ${a.args ? JSON.stringify(a.args, (_, v) => (typeof v === "bigint" ? v.toString() : v)) : ""}\n   raw: ${a.raw}\n   ${a.message}`);

  const b = await simulateForward(proxy, recipient, parseEther("1000"));
  console.log("b) 1000 OKRW:", b.ok ? "simulation SUCCEEDED" : "simulation REVERTED");
  let bCorrect = false;
  if (!b.ok) {
    console.log(`   raw: ${b.raw}\n   decoded: ${b.name ?? "undecoded"}`);
    if (b.name === "VolumeAboveMaxLimit" && b.args) {
      const [maxLimit, value] = b.args as readonly [bigint, bigint];
      console.log(`   maxLimit=${maxLimit} aokrw (${formatEther(maxLimit)} OKRW)\n   value=${value} aokrw (${formatEther(value)} OKRW)`);
      bCorrect = maxLimit === MAX_OKRW && value === parseEther("1000");
    } else {
      console.log(`   ${b.message}`);
    }
  }

  // 5. Summary
  const passA = a.ok;
  const passB = !b.ok && bCorrect;
  console.log("\n===== SUMMARY =====");
  console.log(`Binding readback matches: ${bindingOk ? "PASS" : "FAIL"}`);
  console.log(`Compliant (10 OKRW) simulated clean: ${passA ? "PASS" : "FAIL"}`);
  console.log(
    `Violating (1000 OKRW) simulate-reverted with VolumeAboveMaxLimit(100e18, 1000e18): ${passB ? "PASS" : "FAIL"}`,
  );
  if (b.ok) {
    console.log("WARNING: the violating call did NOT revert. The policy did not engage on the native route. Stop and investigate.");
  }
  console.log(`OVERALL: ${bindingOk && passA && passB ? "PASS" : "FAIL"}`);
  process.exitCode = bindingOk && passA && passB ? 0 : 1;
}

main().catch((e) => {
  console.error("Probe error:", e?.shortMessage ?? e?.message ?? e);
  process.exitCode = 1;
});
