import { decodeAbiParameters } from "viem";
import { useReadContract } from "wagmi";
import { GWANMUN_URL, MAROO_CHAIN_ID, MAROO_HANDLE, PCL_ADDRESS, explorerAddress } from "../chain";
import { iPclAbi } from "../abi/iPcl";
import { shortAddr } from "../lib/format";
import { CopyButton } from "./CopyButton";

const denyParam = [{ type: "tuple", components: [{ name: "addresses", type: "address[]" }] }] as const;

export function ShareProof({ proxy }: { proxy: `0x${string}` }) {
  const { data, isLoading, isError } = useReadContract({
    address: PCL_ADDRESS,
    abi: iPclAbi,
    functionName: "contractPolicies",
    args: [proxy],
    chainId: MAROO_CHAIN_ID,
  });

  let blocked: readonly `0x${string}`[] = [];
  const set = data?.policies.find((p) => p.templateId === "DENYLIST_POLICY");
  if (set) {
    try {
      blocked = decodeAbiParameters(denyParam, set.policy)[0].addresses;
    } catch {
      blocked = [];
    }
  }

  const first = blocked[0];
  const more = blocked.length - 1;
  const verifyUrl = explorerAddress(proxy);

  const summary = first
    ? [
        "Enforced on Maroo Testnet",
        `Gate ${shortAddr(proxy)} blocks ${shortAddr(first)}${more > 0 ? ` and ${more} more` : ""}.`,
        "Maroo rejects any transaction through this gate sent by a blocked address, or sending value to one, with InDenylist.",
        `Gate: ${proxy}`,
        `Blocked: ${first}`,
        `Verify on-chain: ${verifyUrl}`,
      ].join("\n")
    : "";

  const tweet = first
    ? `I set a compliance rule on Maroo (${MAROO_HANDLE}): ${shortAddr(first)} is blocked on my gate, and the chain itself rejects any transfer sent by it or to it with InDenylist. Verify on-chain.`
    : "";
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(GWANMUN_URL)}`;

  return (
    <div className="denylist">
      <h2>Share proof</h2>
      {isLoading ? <p className="note">Reading denylist</p> : null}
      {isError ? <p className="note note-blocked">Could not read the denylist.</p> : null}
      {!isLoading && !isError && !first ? (
        <p className="note">Block an address first to generate a shareable proof.</p>
      ) : null}

      {first ? (
        <>
          <div className="proof-card">
            <div className="proof-head">
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path d="M5 8h22M9 8v17M23 8v17" stroke="currentColor" strokeWidth="3.2" strokeLinecap="square" />
              </svg>
              <span className="proof-brand">Gwanmun</span>
              <span className="proof-net">Enforced on Maroo Testnet</span>
            </div>
            <p className="proof-statement">
              This gate <span className="mono">{shortAddr(proxy)}</span> blocks{" "}
              <span className="mono">{shortAddr(first)}</span>
              {more > 0 ? ` and ${more} more` : ""}. Maroo rejects any transaction through this gate that is sent by a blocked address, or that sends value to one, reverting with{" "}
              <span className="mono">InDenylist</span>.
            </p>
            <dl className="proof-facts">
              <div>
                <dt>Gate</dt>
                <dd className="mono wrap">{proxy}</dd>
              </div>
              <div>
                <dt>Blocked</dt>
                <dd className="mono wrap">{first}</dd>
              </div>
            </dl>
            <a className="link proof-verify" href={verifyUrl} target="_blank" rel="noopener noreferrer">
              Verify on-chain
            </a>
          </div>

          <div className="row">
            <CopyButton text={summary} label="Copy summary" />
            <a className="btn btn-quiet btn-sm share-x" href={shareUrl} target="_blank" rel="noopener noreferrer">
              Share on X
            </a>
          </div>
        </>
      ) : null}
    </div>
  );
}
