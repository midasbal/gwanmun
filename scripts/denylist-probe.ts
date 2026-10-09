import "dotenv/config";
import { readFileSync } from "node:fs";
import {
  createWalletClient, decodeAbiParameters, decodeErrorResult, decodeEventLog, encodeAbiParameters,
  encodeFunctionData, http, toFunctionSelector, type Address, type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { iPclAbi } from "@maroo-chain/contracts/abi/precompiles/pcl/IPcl";
import { PCL_ADDRESS, RPC_URL, marooTestnet, publicClient } from "../src/chain";

const state = JSON.parse(readFileSync(".probe-state.json", "utf8"));
const proxy = state.proxy as Address;
const pk = process.env.PRIVATE_KEY!;
const account = privateKeyToAccount((pk.startsWith("0x") ? pk : `0x${pk}`) as Hex);
const me = account.address;
const wallet = createWalletClient({ account, chain: marooTestnet, transport: http(RPC_URL) });
const BLOCKED: Address = "0x000000000000000000000000000000000000dEaD";
const ALLOWED: Address = "0x000000000000000000000000000000000000bEEF";
const GAS = 2_000_000n;
const j = (v: unknown) => JSON.stringify(v, (_, x) => (typeof x === "bigint" ? x.toString() : x));
const url = (h: string) => `${marooTestnet.blockExplorers.default.url}/tx/${h}`;
const forwardAbi = [
  { type: "function", name: "forward", stateMutability: "payable", inputs: [{ name: "to", type: "address" }], outputs: [] },
] as const;
const denyParam = [{ type: "tuple", components: [{ name: "addresses", type: "address[]" }] }] as const;

function revertData(e: any): string | undefined {
  for (let y = e; y; y = y.cause) {
    if (typeof y.data === "string" && y.data.startsWith("0x")) return y.data;
    if (typeof y.data?.data === "string") return y.data.data;
  }
}
function decodeRevert(raw: string) {
  try { const d = decodeErrorResult({ abi: iPclAbi, data: raw as Hex }); return `${d.errorName} ${j(d.args)}`; }
  catch { return "not decodable against IPcl"; }
}
async function wait(label: string, hash: Hex) {
  console.log(`${label} tx: ${hash}\n  ${url(hash)}`);
  const r = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`  status: ${r.status}, block ${r.blockNumber}, gasUsed ${r.gasUsed}, logs ${r.logs.length}`);
  for (const l of r.logs) {
    let note = "undecoded";
    try { const d = decodeEventLog({ abi: iPclAbi, data: l.data, topics: l.topics }); note = `IPcl.${d.eventName} ${j(d.args)}`; } catch {}
    console.log(`   log@${l.address} topic0=${l.topics[0]} -> ${note}`);
  }
  return r;
}

// 1. Struct and selector check
console.log("DenylistPolicy struct (IPcl.sol): struct DenylistPolicy { address[] addresses; }");
console.log(`InDenylist(address) selector computed: ${toFunctionSelector("InDenylist(address)")} (brief says 0x0201b218)`);
const blob = encodeAbiParameters(denyParam, [{ addresses: [BLOCKED] }]);
console.log(`policy blob: ${blob}`);
console.log(`proxy (state.proxy): ${proxy}`);

// 2. Replace policies
const before = await publicClient.readContract({ address: PCL_ADDRESS, abi: iPclAbi, functionName: "contractPolicies", args: [proxy] });
console.log(`policies before: ${before.policies.map((p) => p.templateId).join(",") || "(none)"}`);
const bind = await wait("changeContractPolicies(DENYLIST_POLICY)", await wallet.writeContract({
  address: PCL_ADDRESS, abi: iPclAbi, functionName: "changeContractPolicies",
  args: [{ _contract: proxy, admin: me, policies: [{ templateId: "DENYLIST_POLICY", policy: blob, selector: "0x" }] }],
}));
if (bind.status !== "success") throw new Error("bind reverted");
const after = await publicClient.readContract({ address: PCL_ADDRESS, abi: iPclAbi, functionName: "contractPolicies", args: [proxy] });
console.log(`contractPolicies: _contract=${after._contract} admin=${after.admin} count=${after.policies.length}`);
for (const p of after.policies) {
  const [dp] = decodeAbiParameters(denyParam, p.policy);
  console.log(`  templateId=${p.templateId} selector=${p.selector} addresses=${j(dp.addresses)}`);
}

// 3. Free simulation
console.log(`\nSimulation (eth_call) forward(BLOCKED), value 0:`);
const dataB = encodeFunctionData({ abi: forwardAbi, functionName: "forward", args: [BLOCKED] });
try {
  const out = await publicClient.request({ method: "eth_call", params: [{ from: me, to: proxy, data: dataB }, "latest"] });
  console.log(`  SUCCEEDED (return ${JSON.stringify(out)})`);
} catch (e: any) {
  const raw = revertData(e);
  console.log(`  REVERTED raw=${raw ?? "(none)"} ${raw ? decodeRevert(raw) : ""}`);
}

// 4. Real blocked
console.log(`\n=== REAL forward(BLOCKED) ===`);
const blocked = await wait("forward(BLOCKED)", await wallet.sendTransaction({ to: proxy, data: dataB, gas: GAS }));
let reason = "n/a";
if (blocked.status === "reverted") {
  try {
    await publicClient.call({ account: me, to: proxy, data: dataB, gas: GAS, blockNumber: blocked.blockNumber - 1n });
    console.log("replay at block-1: succeeded (revert not reproduced)");
  } catch (e: any) {
    const raw = revertData(e);
    reason = raw ? decodeRevert(raw) : "no data";
    console.log(`replay revert data: ${raw ?? "(none)"} -> ${reason}`);
  }
  const t: any = await (await fetch(`${marooTestnet.blockExplorers.default.apiUrl}/transactions/${blocked.transactionHash}`)).json();
  console.log(`blockscout result=${t.result} status=${t.status} revert_reason=${j(t.revert_reason)}`);
}

// 5. Real allowed
console.log(`\n=== REAL forward(ALLOWED) ===`);
const dataA = encodeFunctionData({ abi: forwardAbi, functionName: "forward", args: [ALLOWED] });
const allowed = await wait("forward(ALLOWED)", await wallet.sendTransaction({ to: proxy, data: dataA, gas: GAS }));

// 6. Verdict
console.log("\n===== VERDICT =====");
console.log(`forward(BLOCKED) ${blocked.transactionHash}: ${blocked.status}`);
console.log(`forward(ALLOWED) ${allowed.transactionHash}: ${allowed.status}`);
console.log(blocked.status === "reverted"
  ? `Denylisted touch REJECTED on-chain: ${reason}`
  : "Denylisted touch NOT rejected. Stop; test sender/principal denylisting next.");
