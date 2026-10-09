import { useEffect, useState } from "react";
import { encodeFunctionData, isAddress } from "viem";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient, useReadContract } from "wagmi";
import { MAROO_CHAIN_ID, PCL_ADDRESS } from "../chain";
import { iPclAbi } from "../abi/iPcl";
import { forwardAbi } from "../abi/forward";
import { describeError, inspectRevert } from "../lib/errors";
import { CopyButton } from "./CopyButton";

const SAMPLE_ADDRESS = "0x000000000000000000000000000000000000dEaD";
const RECIPIENT = "0x00000000000000000000000000000000000000e1" as const;

type Verdict =
  | { kind: "allowed" }
  | { kind: "blocked"; raw: string; sender: string }
  | { kind: "indeterminate"; message: string };

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function AddressChecker({ proxy, account }: { proxy: `0x${string}`; account: `0x${string}` }) {
  const client = usePublicClient({ chainId: MAROO_CHAIN_ID });
  const [input, setInput] = useState<string>(account);
  const debounced = useDebounced(input, 400);
  const valid = isAddress(debounced);

  // Re-run the check when the gate's policies are re-read (for example after a denylist update).
  const { dataUpdatedAt } = useReadContract({
    address: PCL_ADDRESS,
    abi: iPclAbi,
    functionName: "contractPolicies",
    args: [proxy],
    chainId: MAROO_CHAIN_ID,
  });

  const check = useQuery<Verdict>({
    queryKey: ["addressCheck", proxy, debounced.toLowerCase(), dataUpdatedAt],
    enabled: valid && !!client,
    retry: false,
    staleTime: 0,
    queryFn: async () => {
      try {
        await client!.call({
          account: debounced as `0x${string}`,
          to: proxy,
          value: 0n,
          data: encodeFunctionData({ abi: forwardAbi, functionName: "forward", args: [RECIPIENT] }),
        });
        return { kind: "allowed" };
      } catch (e) {
        const r = inspectRevert(e);
        if (r.pcl?.name === "InDenylist") return { kind: "blocked", raw: r.raw ?? "", sender: String(r.pcl.args[0] ?? debounced) };
        // A revert for any other reason is reported as such, never as allowed or blocked.
        if (r.isRevert) return { kind: "indeterminate", message: describeError(e).message };
        throw e; // network or RPC failure: surfaced as the error state
      }
    },
  });

  const typing = input !== debounced;
  const showInvalid = !typing && debounced.length > 0 && !valid;
  const verdict = check.data;
  const short = valid ? `${debounced.slice(0, 6)}...${debounced.slice(-4)}` : "";

  return (
    <div className="denylist">
      <h2>Check an address</h2>
      <p className="note">Checks whether an address is on this gate's denylist. Free on-chain simulation: no gas, no signature.</p>

      <div className="row">
        <input
          className="input mono"
          placeholder="0x..."
          value={input}
          onChange={(e) => setInput(e.target.value.trim())}
          spellCheck={false}
          aria-label="Address to check"
        />
        <button type="button" className="btn btn-quiet" onClick={() => setInput(account)}>
          Check my address
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => setInput(SAMPLE_ADDRESS)}>
          Check the sample address
        </button>
      </div>

      <div className="verdict" aria-live="polite">
        {showInvalid ? <p className="note">Enter a full 42 character address.</p> : null}
        {valid && !typing && check.isFetching && !verdict ? <p className="note">Checking</p> : null}
        {valid && !typing && check.isError ? (
          <p className="note note-blocked">Could not run the check. {describeError(check.error).message}</p>
        ) : null}
        {valid && !typing && verdict && !check.isError ? (
          <p className="verdict-line">
            {verdict.kind === "allowed" ? <span className="tag tag-allowed">Allowed</span> : null}
            {verdict.kind === "blocked" ? <span className="tag tag-blocked">Blocked</span> : null}
            {verdict.kind === "indeterminate" ? <span className="tag tag-neutral">Indeterminate</span> : null}
            <span className="mono">{short}</span>
            <span>
              {verdict.kind === "allowed"
                ? "is not on this gate's denylist."
                : verdict.kind === "blocked"
                  ? "is on this gate's denylist. The gate blocks it from sending, and from receiving value."
                  : verdict.message}
            </span>
            {check.isFetching ? <span className="note">Updating</span> : null}
          </p>
        ) : null}
        {valid && !typing && verdict?.kind === "blocked" && !check.isError ? (
          <details className="disclosure">
            <summary>Show raw result</summary>
            <dl className="raw">
              <div>
                <dt>Call</dt>
                <dd className="mono wrap">eth_call from {debounced} to {proxy}, forward({RECIPIENT}), value 0</dd>
              </div>
              <div>
                <dt>Revert data</dt>
                <dd className="mono wrap bytes">
                  {verdict.raw} <CopyButton text={verdict.raw} />
                </dd>
              </div>
              <div>
                <dt>Decoded</dt>
                <dd className="mono wrap">InDenylist({verdict.sender})</dd>
              </div>
            </dl>
          </details>
        ) : null}
      </div>
    </div>
  );
}
