import { useReadContract } from "wagmi";
import { MAROO_CHAIN_ID, PCL_ADDRESS, PROXY_KIND_NAMES, explorerAddress } from "../chain";
import { iPclAbi } from "../abi/iPcl";
import { CopyButton } from "./CopyButton";

/** One table row. The type is the real proxy kind read from the PCL precompile, not a constant. */
function GateRow({ proxy, onOpen }: { proxy: `0x${string}`; onOpen: () => void }) {
  const { data, isLoading, isError } = useReadContract({
    address: PCL_ADDRESS,
    abi: iPclAbi,
    functionName: "pclProxy",
    args: [proxy],
    chainId: MAROO_CHAIN_ID,
  });

  let tag;
  if (isLoading) tag = <span className="tag tag-neutral">Reading</span>;
  else if (isError || !data) tag = <span className="tag tag-neutral">Unavailable</span>;
  else if (data.kind === 0) tag = <span className="tag tag-blocked">Not registered</span>;
  else tag = <span className="tag tag-neutral">{PROXY_KIND_NAMES[data.kind] ?? "Unknown"}</span>;

  return (
    <tr>
      <td className="mono gates-addr wrap">{proxy}</td>
      <td>{tag}</td>
      <td className="gates-actions">
        <CopyButton text={proxy} />
        <a className="link" href={explorerAddress(proxy)} target="_blank" rel="noopener noreferrer">
          Explorer
        </a>
        <button type="button" className="btn btn-primary btn-sm" onClick={onOpen}>
          Open
        </button>
      </td>
    </tr>
  );
}

export function GatesList({
  gates,
  searching,
  searchFailed,
  onOpen,
}: {
  gates: readonly `0x${string}`[];
  searching: boolean;
  searchFailed: boolean;
  onOpen: (proxy: `0x${string}`) => void;
}) {
  return (
    <section className="panel gates">
      <div className="gates-head">
        <h1>Your gates</h1>
        <span className="gates-count">
          {gates.length} {gates.length === 1 ? "gate" : "gates"}
        </span>
      </div>
      {gates.length === 0 ? (
        <p className="note">{searching ? "Checking the chain for gates you deployed." : "No gates yet."}</p>
      ) : (
        <table className="gates-table">
          <thead>
            <tr>
              <th>Gate</th>
              <th>Type</th>
              <th aria-label="Actions"></th>
            </tr>
          </thead>
          <tbody>
            {gates.map((g) => (
              <GateRow key={g} proxy={g} onOpen={() => onOpen(g)} />
            ))}
          </tbody>
        </table>
      )}
      {searchFailed ? <p className="note">Could not reach the chain to look for more gates.</p> : null}
      {searching && gates.length > 0 ? <p className="note">Checking the chain for more gates.</p> : null}
    </section>
  );
}
