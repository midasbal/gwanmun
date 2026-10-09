import "dotenv/config";
import { readFileSync } from "node:fs";
import {
  createWalletClient, decodeErrorResult, decodeEventLog, encodeFunctionData, formatEther,
  http, parseEther, type Address, type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { iPclAbi } from "@maroo-chain/contracts/abi/precompiles/pcl/IPcl";
import { RPC_URL, marooTestnet, publicClient } from "../src/chain";

const pk = process.env.PRIVATE_KEY!;
const account = privateKeyToAccount((pk.startsWith("0x") ? pk : `0x${pk}`) as Hex);
const me = account.address;
const wallet = createWalletClient({ account, chain: marooTestnet, transport: http(RPC_URL) });
const proxy = JSON.parse(readFileSync(".probe-state.json", "utf8")).proxy as Address;
const R: Address = "0x000000000000000000000000000000000000dEaD";
const GAS = 2_000_000n;
const forwardAbi = [
  { type: "function", name: "forward", stateMutability: "payable", inputs: [{ name: "to", type: "address" }], outputs: [] },
  { type: "event", name: "Forwarded", inputs: [{ name: "to", type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false }] },
] as const;
const j = (v: unknown) => JSON.stringify(v, (_, x) => (typeof x === "bigint" ? x.toString() : x));

async function send(label: string, okrw: string) {
  const value = parseEther(okrw);
  console.log(`\n=== ${label}: forward(${R}) value=${okrw} OKRW, gas=${GAS} ===`);
  const hash = await wallet.sendTransaction({
    to: proxy, value, gas: GAS,
    data: encodeFunctionData({ abi: forwardAbi, functionName: "forward", args: [R] }),
  });
  console.log(`tx: ${hash}\n  ${marooTestnet.blockExplorers.default.url}/tx/${hash}`);
  const r = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`status: ${r.status}, block ${r.blockNumber}, gasUsed ${r.gasUsed} of ${GAS}`);
  console.log(`logs: ${r.logs.length}`);
  for (const l of r.logs) {
    let note = "undecoded";
    try { const d = decodeEventLog({ abi: iPclAbi, data: l.data, topics: l.topics }); note = `IPcl.${d.eventName} ${j(d.args)}`; }
    catch { try { const d = decodeEventLog({ abi: forwardAbi, data: l.data, topics: l.topics }); note = `${d.eventName} ${j(d.args)}`; } catch {} }
    console.log(`  log@${l.address} topic0=${l.topics[0]} -> ${note}`);
  }
  return { hash, r };
}

const balBefore = await publicClient.getBalance({ address: R });
const a = await send("1) compliant", "10");
const b = await send("2) violating", "1000");
const balAfter = await publicClient.getBalance({ address: R });
console.log(`\nRecipient balance delta: ${formatEther(balAfter - balBefore)} OKRW (expect 10 if only (a) landed)`);

if (b.r.status === "reverted") {
  console.log("\n--- revert investigation ---");
  let raw: string | undefined;
  try {
    const tx = await publicClient.getTransaction({ hash: b.hash });
    await publicClient.call({ account: me, to: proxy, data: tx.input, value: tx.value, gas: GAS, blockNumber: b.r.blockNumber - 1n });
    console.log("replay at block-1: succeeded (no revert reproduced)");
  } catch (e: any) {
    for (let y = e; y; y = y.cause) {
      if (typeof y.data === "string") { raw = y.data; break; }
      if (typeof y.data?.data === "string") { raw = y.data.data; break; }
    }
    console.log(`replay at block-1 revert data: ${raw ?? "(none)"} | ${e.shortMessage ?? e.message}`);
    if (raw) { try { const d = decodeErrorResult({ abi: iPclAbi, data: raw as Hex }); console.log(`decoded: ${d.errorName} ${j(d.args)}`); } catch { console.log("not decodable against IPcl"); } }
  }
  const res = await fetch(`${marooTestnet.blockExplorers.default.apiUrl}/transactions/${b.hash}`);
  const t: any = await res.json();
  console.log(`blockscout status=${res.status} result=${t.result} status=${t.status} revert_reason=${j(t.revert_reason)} decoded_input=${j(t.decoded_input)}`);
  console.log(`blockscout raw_input/error fields: ${j({ exception: t.exception, has_error_in_internal_transactions: t.has_error_in_internal_transactions })}`);
  const ir = await fetch(`${marooTestnet.blockExplorers.default.apiUrl}/transactions/${b.hash}/internal-transactions`);
  console.log(`internal-transactions: ${(await ir.text()).slice(0, 1500)}`);
}

console.log("\n===== VERDICT =====");
console.log(`compliant tx ${a.hash}: ${a.r.status}`);
console.log(`violating tx ${b.hash}: ${b.r.status}`);
console.log(b.r.status === "reverted" ? "Real violating transfer REJECTED on-chain (see decoded reason above)." : "Real violating transfer SUCCEEDED: native value route is NOT measured by VOLUME_POLICY.");
