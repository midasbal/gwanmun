import "dotenv/config";
import { readFileSync } from "node:fs";
import { decodeErrorResult, encodeFunctionData, formatEther, parseEther, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { iPclAbi } from "@maroo-chain/contracts/abi/precompiles/pcl/IPcl";
import { publicClient } from "../src/chain";

const pk = process.env.PRIVATE_KEY!;
const me = privateKeyToAccount((pk.startsWith("0x") ? pk : `0x${pk}`) as Hex).address;
const proxy = JSON.parse(readFileSync(".probe-state.json", "utf8")).proxy as Address;
const R = (process.argv[2] ?? "0x000000000000000000000000000000000000dEaD") as Address;

const forwardAbi = [
  { type: "function", name: "forward", stateMutability: "payable", inputs: [{ name: "to", type: "address" }], outputs: [] },
] as const;

async function sim(label: string, value: bigint) {
  const data = encodeFunctionData({ abi: forwardAbi, functionName: "forward", args: [R] });
  console.log(`\n${label}: eth_call from=${me} to=proxy(${proxy}) forward(${R}) value=${value} aokrw`);
  try {
    const out = await publicClient.request({
      method: "eth_call",
      params: [{ from: me, to: proxy, data, value: `0x${value.toString(16)}` }, "latest"],
    });
    console.log(`  SUCCEEDED, raw return: ${JSON.stringify(out)}`);
    return { ok: true as const };
  } catch (e: any) {
    let raw: string | undefined;
    for (let y = e; y; y = y.cause) {
      if (typeof y.data === "string") { raw = y.data; break; }
      if (typeof y.data?.data === "string") { raw = y.data.data; break; }
    }
    console.log(`  REVERTED, raw revert data: ${raw ?? "(none)"}`);
    let d: ReturnType<typeof decodeErrorResult> | undefined;
    if (raw) {
      try {
        d = decodeErrorResult({ abi: iPclAbi, data: raw as Hex });
        console.log(`  decoded: ${d.errorName} args=${JSON.stringify(d.args, (_, v) => (typeof v === "bigint" ? v.toString() : v))}`);
        if (d.errorName === "VolumeAboveMaxLimit") {
          const [maxLimit, v] = d.args as readonly [bigint, bigint];
          console.log(`  maxLimit=${maxLimit} (${formatEther(maxLimit)} OKRW), value=${v} (${formatEther(v)} OKRW)`);
        }
      } catch (z: any) {
        console.log(`  decode failed: ${z.shortMessage ?? z.message}`);
      }
    } else {
      console.log(`  message: ${e.shortMessage ?? e.message}`);
    }
    return { ok: false as const, name: d?.errorName };
  }
}

const a = await sim("a) 10 OKRW", parseEther("10"));
const b = await sim("b) 1000 OKRW", parseEther("1000"));
console.log("\n===== RESULT =====");
if (!b.ok && b.name === "VolumeAboveMaxLimit" && a.ok) console.log("PASS: violating call reverted with VolumeAboveMaxLimit; compliant call succeeded.");
else if (b.ok) console.log("(b) STILL SIMULATES CLEAN with a distinct recipient. eth_call does not appear to model the value scan.");
else console.log("INCONCLUSIVE: see output above.");
