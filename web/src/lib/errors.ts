import { decodeErrorResult, type Hex } from "viem";
import { iPclAbi } from "../abi/iPcl";

export type DescribedError = { rejected: boolean; message: string };

/** Turns a wagmi/viem error into a readable message, decoding PCL reverts when possible. */
export function describeError(err: unknown): DescribedError {
  let raw: string | undefined;
  for (let e = err as any, i = 0; e && i < 12; e = e.cause, i++) {
    if (e.code === 4001 || e.name === "UserRejectedRequestError") {
      return { rejected: true, message: "You rejected the request in your wallet." };
    }
    if (!raw && typeof e.data === "string" && e.data.startsWith("0x")) raw = e.data;
    if (!raw && typeof e.data?.data === "string" && e.data.data.startsWith("0x")) raw = e.data.data;
  }
  if (raw) {
    try {
      const d = decodeErrorResult({ abi: iPclAbi, data: raw as Hex });
      const args = d.args?.length ? ` (${d.args.map(String).join(", ")})` : "";
      return { rejected: false, message: `PCL rejected the call: ${d.errorName}${args}` };
    } catch {
      /* fall through to the generic message */
    }
  }
  const e = err as { shortMessage?: string; message?: string };
  return { rejected: false, message: e?.shortMessage ?? e?.message?.split("\n")[0] ?? "Unknown error" };
}

export type Revert = { isRevert: boolean; raw?: string; pcl?: { name: string; args: readonly unknown[] } };

/** Finds revert data in a viem error and decodes it against the PCL ABI when possible. */
export function inspectRevert(err: unknown): Revert {
  let raw: string | undefined;
  let isRevert = false;
  for (let e = err as any, i = 0; e && i < 12; e = e.cause, i++) {
    if (e.name === "ExecutionRevertedError" || e.name === "ContractFunctionRevertedError") isRevert = true;
    if (!raw && typeof e.data === "string" && e.data.startsWith("0x") && e.data.length > 2) raw = e.data;
    if (!raw && typeof e.data?.data === "string" && e.data.data.startsWith("0x") && e.data.data.length > 2) raw = e.data.data;
  }
  if (!raw) return { isRevert };
  try {
    const d = decodeErrorResult({ abi: iPclAbi, data: raw as Hex });
    return { isRevert: true, raw, pcl: { name: d.errorName, args: d.args ?? [] } };
  } catch {
    return { isRevert: true, raw };
  }
}
