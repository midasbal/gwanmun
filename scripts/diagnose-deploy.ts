import "dotenv/config";
import { readFileSync } from "node:fs";
import {
  decodeErrorResult,
  encodeAbiParameters,
  encodeFunctionData,
  parseAbiParameters,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { iPclAbi } from "@maroo-chain/contracts/abi/precompiles/pcl/IPcl";
import { PCL_ADDRESS, publicClient } from "../src/chain";

const pk = process.env.PRIVATE_KEY!;
const me = privateKeyToAccount((pk.startsWith("0x") ? pk : `0x${pk}`) as Hex).address;
const st = JSON.parse(readFileSync(".probe-state.json", "utf8"));

const TABLE: Record<string, string> = {
  "0x82b42900": "Unauthorized()",
  "0xfe835e35": "InternalError()",
  "0xae962d4e": "InvalidCall()",
  "0x30a6b73b": "AbiDecodeFailed(string)",
  "0xb5e11531": "CannotEmpty(string)",
  "0xaa33ade0": "InvalidParameter(string)",
  "0x08c379a0": "Error(string)",
  "0x4e487b71": "Panic(uint256)",
};

// Returns the proxy address on success, or the raw revert data on failure.
async function simulateDeploy(label: string, logic: Address, initializer: Hex) {
  const initData = encodeAbiParameters(parseAbiParameters("address, address, bytes"), [logic, me, initializer]);
  const data = encodeFunctionData({ abi: iPclAbi, functionName: "deployPclProxy", args: [1, 0n, initData] });
  console.log(`\n--- ${label} ---\nselector: ${data.slice(0, 10)}\nlogic: ${logic}\ninitializer: ${initializer}`);
  try {
    const out = await publicClient.request({
      method: "eth_call",
      params: [{ from: me, to: PCL_ADDRESS, data }, "latest"],
    });
    console.log(`eth_call SUCCEEDED, return: ${out}`);
    console.log(`predicted proxy: 0x${(out as string).slice(-40)}`);
    return { ok: true as const };
  } catch (e: any) {
    let x = e;
    while (x.cause && x.cause.data === undefined && x.data === undefined) x = x.cause;
    let raw: string | undefined;
    for (let y = e; y; y = y.cause) {
      if (typeof y.data === "string") { raw = y.data; break; }
      if (typeof y.data?.data === "string") { raw = y.data.data; break; }
    }
    console.log(`eth_call REVERTED\nraw revert data: ${raw ?? "(none)"}`);
    if (raw) {
      const sel = raw.slice(0, 10);
      console.log(`selector table: ${TABLE[sel] ?? "not in table"}`);
      try {
        const d = decodeErrorResult({ abi: iPclAbi, data: raw as Hex });
        console.log(`decoded: ${d.errorName} args=${JSON.stringify(d.args)}`);
      } catch (z: any) {
        console.log(`decodeErrorResult failed: ${z.shortMessage ?? z.message}`);
      }
    } else {
      console.log(`no data. message: ${e.shortMessage ?? e.message}`);
    }
    return { ok: false as const, raw };
  }
}

const which = process.argv[2];
if (which === "1") {
  await simulateDeploy("STEP 1: NativeForwarder, empty initializer", st.forwarder, "0x");
} else {
  const init = encodeFunctionData({
    abi: [{ type: "function", name: "initialize", stateMutability: "nonpayable", inputs: [{ name: "owner_", type: "address" }], outputs: [] }],
    functionName: "initialize",
    args: [me],
  });
  console.log(`initialize selector: ${init.slice(0, 10)}`);
  await simulateDeploy("STEP 2: GwanmunForwarder, initialize(me)", st.gwanmunForwarder, init);
}
