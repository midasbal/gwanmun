import { getAbiItem, pad, toEventSelector, type PublicClient } from "viem";
import { iPclAbi } from "../abi/iPcl";
import { PCL_ADDRESS, marooTestnet } from "../chain";

const deployedEvent = getAbiItem({ abi: iPclAbi, name: "PclProxyDeployed" });

export type RecoverResult = {
  gates: `0x${string}`[];
  /** Which paths contributed at least one gate, for diagnostics. */
  sources: ("getLogs" | "blockscout")[];
  errors: string[];
};

/**
 * The Maroo RPC rejects getLogs ranges above roughly 10,000 blocks (5,000 and 10,000 work,
 * 20,000 fails), so getLogs only covers a recent window. Full history comes from Blockscout.
 */
const RECENT_WINDOW = 9_000n;

const dedupe = (list: string[]) => {
  const seen = new Set<string>();
  const out: `0x${string}`[] = [];
  for (const a of list) {
    const k = a.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(a as `0x${string}`);
    }
  }
  return out;
};

async function viaGetLogs(client: PublicClient, account: `0x${string}`) {
  const head = await client.getBlockNumber();
  const logs = await client.getLogs({
    address: PCL_ADDRESS,
    event: deployedEvent,
    args: { deployer: account },
    fromBlock: head > RECENT_WINDOW ? head - RECENT_WINDOW : 0n,
    toBlock: head,
  });
  return logs.map((l) => l.args.proxy).filter((p): p is `0x${string}` => !!p);
}

async function viaBlockscout(account: `0x${string}`, signal?: AbortSignal) {
  const base = marooTestnet.blockExplorers.default.url;
  const params = new URLSearchParams({
    module: "logs",
    action: "getLogs",
    address: PCL_ADDRESS,
    topic0: toEventSelector(deployedEvent),
    topic2: pad(account, { size: 32 }),
    topic0_2_opr: "and",
    fromBlock: "0",
    toBlock: "latest",
  });
  const res = await fetch(`${base}/blockscout/api?${params}`, { signal });
  if (!res.ok) throw new Error(`Blockscout HTTP ${res.status}`);
  const json = (await res.json()) as { status?: string; message?: string; result?: unknown };
  if (!Array.isArray(json.result)) {
    // The Etherscan-style API reports "No logs found" as status 0 with an empty result.
    if (json.status === "0" && /no logs/i.test(json.message ?? "")) return [];
    throw new Error(`Blockscout: ${json.message ?? "unexpected response"}`);
  }
  const out: `0x${string}`[] = [];
  for (const row of json.result as { topics?: (string | null)[] }[]) {
    const t1 = row.topics?.[1];
    if (t1 && /^0x[0-9a-fA-F]{64}$/.test(t1)) out.push(`0x${t1.slice(-40)}` as `0x${string}`);
  }
  return out;
}

/**
 * Best-effort: find the PCL proxies an account deployed, from PclProxyDeployed events.
 * Runs Blockscout (full history) and a recent-window getLogs (covers gates Blockscout has not
 * indexed yet) in parallel and merges them. Never throws.
 */
export async function recoverGates(
  client: PublicClient,
  account: `0x${string}`,
  signal?: AbortSignal,
): Promise<RecoverResult> {
  const [recent, history] = await Promise.allSettled([viaGetLogs(client, account), viaBlockscout(account, signal)]);
  const errors: string[] = [];
  const sources: RecoverResult["sources"] = [];
  const found: `0x${string}`[] = [];
  const take = (r: PromiseSettledResult<`0x${string}`[]>, name: "getLogs" | "blockscout") => {
    if (r.status === "fulfilled") {
      if (r.value.length) sources.push(name);
      found.push(...r.value);
    } else {
      errors.push(`${name}: ${(r.reason as Error)?.message?.split("\n")[0] ?? "failed"}`);
    }
  };
  take(history, "blockscout");
  take(recent, "getLogs");
  return { gates: dedupe(found), sources, errors };
}
