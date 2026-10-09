import "dotenv/config";
import { readFileSync } from "node:fs";
import {
  createWalletClient, decodeAbiParameters, decodeErrorResult, decodeEventLog, encodeAbiParameters,
  encodeFunctionData, http, type Address, type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { iPclAbi } from "@maroo-chain/contracts/abi/precompiles/pcl/IPcl";
import { PCL_ADDRESS, RPC_URL, marooTestnet, publicClient } from "../src/chain";

const proxy = JSON.parse(readFileSync(".probe-state.json", "utf8")).proxy as Address;
const pk = process.env.PRIVATE_KEY!;
const account = privateKeyToAccount((pk.startsWith("0x") ? pk : `0x${pk}`) as Hex);
const me = account.address;
const wallet = createWalletClient({ account, chain: marooTestnet, transport: http(RPC_URL) });
const TARGET: Address = "0x000000000000000000000000000000000000bEEF";
const GAS = 2_000_000n;
const j = (v: unknown) => JSON.stringify(v, (_, x) => (typeof x === "bigint" ? x.toString() : x));
const denyParam = [{ type: "tuple", components: [{ name: "addresses", type: "address[]" }] }] as const;
const forwardAbi = [
  { type: "function", name: "forward", stateMutability: "payable", inputs: [{ name: "to", type: "address" }], outputs: [] },
] as const;
const fwdData = encodeFunctionData({ abi: forwardAbi, functionName: "forward", args: [TARGET] });

function revertData(e: any): string | undefined {
  for (let y = e; y; y = y.cause) {
    if (typeof y.data === "string" && y.data.startsWith("0x")) return y.data;
    if (typeof y.data?.data === "string") return y.data.data;
  }
}
const decodeRevert = (raw: string) => {
  try { const d = decodeErrorResult({ abi: iPclAbi, data: raw as Hex }); return `${d.errorName} ${j(d.args)}`; }
  catch { return "not decodable against IPcl"; }
};
async function wait(label: string, hash: Hex) {
  console.log(`${label} tx: ${hash}\n  ${marooTestnet.blockExplorers.default.url}/tx/${hash}`);
  const r = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`  status: ${r.status}, block ${r.blockNumber}, gasUsed ${r.gasUsed}, logs ${r.logs.length}`);
  for (const l of r.logs) {
    let note = "undecoded";
    try { const d = decodeEventLog({ abi: iPclAbi, data: l.data, topics: l.topics }); note = `IPcl.${d.eventName} ${j(d.args)}`; } catch {}
    console.log(`   log@${l.address} -> ${note.slice(0, 200)}`);
  }
  return r;
}
async function readback() {
  return publicClient.readContract({ address: PCL_ADDRESS, abi: iPclAbi, functionName: "contractPolicies", args: [proxy] });
}

// 1. Denylist me
const blob = encodeAbiParameters(denyParam, [{ addresses: [me] }]);
const r1 = await wait("1) rebind DENYLIST [me]", await wallet.writeContract({
  address: PCL_ADDRESS, abi: iPclAbi, functionName: "changeContractPolicies",
  args: [{ _contract: proxy, admin: me, policies: [{ templateId: "DENYLIST_POLICY", policy: blob, selector: "0x" }] }],
}));
if (r1.status !== "success") throw new Error("rebind reverted");
const rb1 = await readback();
console.log(`readback: admin=${rb1.admin} count=${rb1.policies.length}`);
for (const p of rb1.policies) {
  const [dp] = decodeAbiParameters(denyParam, p.policy);
  console.log(`  ${p.templateId} selector=${p.selector} addresses=${j(dp.addresses)}`);
}

// 2. Free sim
try {
  const out = await publicClient.request({ method: "eth_call", params: [{ from: me, to: proxy, data: fwdData }, "latest"] });
  console.log(`\n2) sim forward(bEEF): SUCCEEDED (return ${JSON.stringify(out)})`);
} catch (e: any) {
  const raw = revertData(e);
  console.log(`\n2) sim forward(bEEF): REVERTED raw=${raw ?? "(none)"} ${raw ? decodeRevert(raw) : ""}`);
}

// 3. Real forward while denylisted
console.log("\n=== 3) REAL forward(bEEF) while sender denylisted ===");
const r3 = await wait("3) forward", await wallet.sendTransaction({ to: proxy, data: fwdData, gas: GAS }));
let reason = "n/a";
if (r3.status !== "reverted") {
  console.log("\nStep 3 did NOT revert. Stopping per guardrail. Policy is STILL bound with addresses=[me]; nothing restored.");
  process.exit(1);
}
try {
  await publicClient.call({ account: me, to: proxy, data: fwdData, gas: GAS, blockNumber: r3.blockNumber - 1n });
  console.log("replay at block-1: succeeded (revert not reproduced)");
} catch (e: any) {
  const raw = revertData(e);
  reason = raw ? decodeRevert(raw) : "no data";
  console.log(`replay revert data: ${raw ?? "(none)"} -> ${reason}`);
}
const t: any = await (await fetch(`${marooTestnet.blockExplorers.default.apiUrl}/transactions/${r3.transactionHash}`)).json();
console.log(`blockscout result=${t.result} status=${t.status} revert_reason=${j(t.revert_reason)} gas_used=${t.gas_used}`);

// 4. Restore
const r4 = await wait("4) restore (policies: [])", await wallet.writeContract({
  address: PCL_ADDRESS, abi: iPclAbi, functionName: "changeContractPolicies",
  args: [{ _contract: proxy, admin: me, policies: [] }],
}));
if (r4.status !== "success") throw new Error("restore reverted");
const rb4 = await readback();
console.log(`readback: admin=${rb4.admin} policies=${rb4.policies.length}`);

// 5. Control
console.log("\n=== 5) control forward(bEEF) after removal ===");
const r5 = await wait("5) forward", await wallet.sendTransaction({ to: proxy, data: fwdData, gas: GAS }));

console.log("\n===== VERDICT =====");
console.log(`3) denylisted sender ${r3.transactionHash}: ${r3.status} (${reason})`);
console.log(`5) after removal ${r5.transactionHash}: ${r5.status}`);
console.log(r3.status === "reverted" && r5.status === "success"
  ? "YES: same forward reverted when sender was denylisted and succeeded after removal."
  : "NO or inconclusive, see above.");
