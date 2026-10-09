import "dotenv/config";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import {
  createWalletClient, decodeAbiParameters, decodeErrorResult, decodeEventLog, encodeAbiParameters,
  encodeFunctionData, erc20Abi, formatEther, http, parseAbiParameters, parseEther, type Address, type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { iPclAbi } from "@maroo-chain/contracts/abi/precompiles/pcl/IPcl";
import { OKRW_ERC20, PCL_ADDRESS, RPC_URL, marooTestnet, publicClient } from "../src/chain";

const STATE_FILE = ".probe-state.json";
const state: Record<string, string> = JSON.parse(readFileSync(STATE_FILE, "utf8"));
const save = () => writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
const pk = process.env.PRIVATE_KEY!;
const account = privateKeyToAccount((pk.startsWith("0x") ? pk : `0x${pk}`) as Hex);
const me = account.address;
const wallet = createWalletClient({ account, chain: marooTestnet, transport: http(RPC_URL) });
const R: Address = "0x000000000000000000000000000000000000dEaD";
const GAS = 2_000_000n;
const MAX = parseEther("100");
const j = (v: unknown) => JSON.stringify(v, (_, x) => (typeof x === "bigint" ? x.toString() : x));
const url = (h: string) => `${marooTestnet.blockExplorers.default.url}/tx/${h}`;

const gateAbi = [
  { type: "function", name: "initialize", stateMutability: "nonpayable", inputs: [{ name: "o", type: "address" }], outputs: [] },
  { type: "function", name: "send", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [] },
] as const;
const vpParam = [{
  type: "tuple",
  components: [
    { name: "tokens", type: "string[]" },
    { name: "limits", type: "tuple[]", components: [{ name: "minLimit", type: "uint256" }, { name: "maxLimit", type: "uint256" }] },
  ],
}] as const;

function revertData(e: any): string | undefined {
  for (let y = e; y; y = y.cause) {
    if (typeof y.data === "string" && y.data.startsWith("0x")) return y.data;
    if (typeof y.data?.data === "string") return y.data.data;
  }
}
async function wait(label: string, hash: Hex) {
  console.log(`${label} tx: ${hash}\n  ${url(hash)}`);
  const r = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`  status: ${r.status}, block ${r.blockNumber}, gasUsed ${r.gasUsed}`);
  return r;
}
function printLogs(r: Awaited<ReturnType<typeof wait>>) {
  console.log(`  logs: ${r.logs.length}`);
  for (const l of r.logs) {
    let note = "undecoded";
    try { const d = decodeEventLog({ abi: iPclAbi, data: l.data, topics: l.topics }); note = `IPcl.${d.eventName} ${j(d.args)}`; }
    catch { try { const d = decodeEventLog({ abi: erc20Abi, data: l.data, topics: l.topics }); note = `ERC20.${d.eventName} ${j(d.args)}`; } catch {} }
    console.log(`   log@${l.address} topic0=${l.topics[0]} -> ${note}`);
  }
}

// 1. Deploy GwanmunGate logic
if (!state.gateLogic) {
  const art = JSON.parse(readFileSync("out/GwanmunGate.sol/GwanmunGate.json", "utf8"));
  const r = await wait("Deploy GwanmunGate", await wallet.deployContract({ abi: art.abi, bytecode: art.bytecode.object as Hex }));
  if (r.status !== "success") throw new Error("gate deploy reverted");
  state.gateLogic = r.contractAddress!;
  save();
}
console.log(`GwanmunGate (logic): ${state.gateLogic}`);

// 2. PCL proxy (simulate first, then send)
if (!state.gateProxy) {
  const initData = encodeAbiParameters(parseAbiParameters("address, address, bytes"), [
    state.gateLogic as Address, me, encodeFunctionData({ abi: gateAbi, functionName: "initialize", args: [me] }),
  ]);
  const data = encodeFunctionData({ abi: iPclAbi, functionName: "deployPclProxy", args: [1, 0n, initData] });
  const sim = await publicClient.request({ method: "eth_call", params: [{ from: me, to: PCL_ADDRESS, data }, "latest"] });
  console.log(`deployPclProxy simulation OK, predicted proxy: 0x${sim.slice(-40)}`);
  const r = await wait("deployPclProxy(Transparent)", await wallet.writeContract({
    address: PCL_ADDRESS, abi: iPclAbi, functionName: "deployPclProxy", args: [1, 0n, initData],
  }));
  if (r.status !== "success") throw new Error("proxy deploy reverted");
  let proxy: Address | undefined;
  for (const l of r.logs) {
    if (l.address.toLowerCase() !== PCL_ADDRESS.toLowerCase()) continue;
    try { const ev = decodeEventLog({ abi: iPclAbi, data: l.data, topics: l.topics }); if (ev.eventName === "PclProxyDeployed") proxy = ev.args.proxy; } catch {}
  }
  if (!proxy) throw new Error("PclProxyDeployed event not found");
  state.gateProxy = proxy;
  save();
}
const gate = state.gateProxy as Address;
console.log(`Gate proxy: ${gate}`);
const entry = await publicClient.readContract({ address: PCL_ADDRESS, abi: iPclAbi, functionName: "pclProxy", args: [gate] });
console.log(`pclProxy(gate): kind=${entry.kind} admin=${entry.admin}`);
if (entry.kind !== 1) throw new Error(`expected kind 1, got ${entry.kind}`);

// 3. Bind VOLUME_POLICY
const cur = await publicClient.readContract({ address: PCL_ADDRESS, abi: iPclAbi, functionName: "contractPolicies", args: [gate] });
if (cur.policies.length === 0) {
  const blob = encodeAbiParameters(vpParam, [{ tokens: ["aokrw"], limits: [{ minLimit: 0n, maxLimit: MAX }] }]);
  const r = await wait("changeContractPolicies(VOLUME_POLICY)", await wallet.writeContract({
    address: PCL_ADDRESS, abi: iPclAbi, functionName: "changeContractPolicies",
    args: [{ _contract: gate, admin: me, policies: [{ templateId: "VOLUME_POLICY", policy: blob, selector: "0x" }] }],
  }));
  if (r.status !== "success") throw new Error("bind reverted");
}
const bound = await publicClient.readContract({ address: PCL_ADDRESS, abi: iPclAbi, functionName: "contractPolicies", args: [gate] });
console.log(`contractPolicies(gate): _contract=${bound._contract} admin=${bound.admin}`);
for (const p of bound.policies) {
  const [vp] = decodeAbiParameters(vpParam, p.policy);
  console.log(`  templateId=${p.templateId} selector=${p.selector} tokens=${j(vp.tokens)} limits=${j(vp.limits)}`);
  console.log(`  max = ${formatEther(vp.limits[0].maxLimit)} OKRW`);
}

// 4. Approve
const allowance = await publicClient.readContract({ address: OKRW_ERC20, abi: erc20Abi, functionName: "allowance", args: [me, gate] });
if (allowance < parseEther("2000")) {
  const r = await wait("approve(gate, 2000 OKRW)", await wallet.writeContract({
    address: OKRW_ERC20, abi: erc20Abi, functionName: "approve", args: [gate, parseEther("2000")], gas: GAS,
  }));
  if (r.status !== "success") throw new Error("approve reverted");
}
console.log(`allowance(me -> gate): ${formatEther(await publicClient.readContract({ address: OKRW_ERC20, abi: erc20Abi, functionName: "allowance", args: [me, gate] }))} OKRW`);

// 5. Sends
const bal = async (a: Address) => formatEther(await publicClient.getBalance({ address: a }));
const rBefore = await bal(R), meBefore = await bal(me);
console.log(`\nBalances before: me=${meBefore} R=${rBefore}`);

async function send(label: string, okrw: string) {
  const data = encodeFunctionData({ abi: gateAbi, functionName: "send", args: [R, parseEther(okrw)] });
  console.log(`\n=== ${label}: gate.send(R, ${okrw} OKRW), gas ${GAS} ===`);
  const hash = await wallet.sendTransaction({ to: gate, data, gas: GAS });
  const r = await wait(label, hash);
  printLogs(r);
  return { hash, r, data };
}
const a = await send("a) compliant", "10");
const b = await send("b) violating", "1000");
console.log(`\nBalances after: me=${await bal(me)} R=${await bal(R)}`);

let reason = "n/a";
if (b.r.status === "reverted") {
  console.log("\n--- revert investigation (b) ---");
  try {
    await publicClient.call({ account: me, to: gate, data: b.data, gas: GAS, blockNumber: b.r.blockNumber - 1n });
    console.log("replay at block-1: succeeded (revert not reproduced)");
  } catch (e: any) {
    const raw = revertData(e);
    console.log(`replay revert data: ${raw ?? "(none)"} | ${e.shortMessage ?? e.message}`);
    if (raw) { try { const d = decodeErrorResult({ abi: iPclAbi, data: raw as Hex }); reason = `${d.errorName} ${j(d.args)}`; console.log(`decoded: ${reason}`); } catch { console.log("not decodable against IPcl"); } }
  }
  const res = await fetch(`${marooTestnet.blockExplorers.default.apiUrl}/transactions/${b.hash}`);
  const t: any = await res.json();
  console.log(`blockscout http=${res.status} result=${t.result} status=${t.status} revert_reason=${j(t.revert_reason)} decoded_input=${j(t.decoded_input)}`);
}

console.log("\n===== VERDICT =====");
console.log(`a) ${a.hash}: ${a.r.status}\nb) ${b.hash}: ${b.r.status}`);
console.log(b.r.status === "reverted"
  ? `1000 OKRW ERC20 transfer REJECTED on-chain. Decoded reason: ${reason}`
  : "1000 OKRW ERC20 transfer SUCCEEDED. Not rejected. Stop and reason about attribution.");
