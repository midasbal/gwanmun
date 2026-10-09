import { useReadContract } from "wagmi";
import { MAROO_CHAIN_ID, PCL_ADDRESS, PROXY_KIND_NAMES, explorerAddress } from "../chain";
import { iPclAbi } from "../abi/iPcl";
import { CopyButton } from "./CopyButton";

function GateRow({ proxy, onOpen }: { proxy: `0x${string}`; onOpen: () => void }) {
  const { data, isLoading, isError } = useReadContract({
    address: PCL_ADDRESS,
    abi: iPclAbi,
    functionName: "pclProxy",
    args: [proxy],
    chainId: MAROO_CHAIN_ID,
  });
  const unregistered = !!data && data.kind === 0;
  return (
    <li className="list-row">
      <span className="gate-row-main">
        <span className="mono wrap">{proxy}</span>
        <span className="note">
          {isLoading ? "Reading kind" : isError ? "Kind unavailable" : unregistered ? "Not a registered PCL proxy" : `${PROXY_KIND_NAMES[data!.kind] ?? "Unknown"} proxy`}
          {" "}
          <CopyButton text={proxy} />{" "}
          <a className="link" href={explorerAddress(proxy)} target="_blank" rel="noopener noreferrer">
            Explorer
          </a>
        </span>
      </span>
      <button type="button" className="btn btn-primary btn-sm" onClick={onOpen}>
        Open
      </button>
    </li>
  );
}

export function GatesList({
  gates,
  searching,
  searchFailed,
  onOpen,
}: {
  gates: `0x${string}`[];
  searching: boolean;
  searchFailed: boolean;
  onOpen: (proxy: `0x${string}`) => void;
}) {
  return (
    <section className="panel">
      <h1>Your gates</h1>
      {searching ? <p className="note">Looking for your gates on-chain</p> : null}
      {gates.length > 0 ? (
        <ul className="list">
          {gates.map((g) => (
            <GateRow key={g} proxy={g} onOpen={() => onOpen(g)} />
          ))}
        </ul>
      ) : searching ? null : (
        <p className="note">No gates found for this account.</p>
      )}
      {searchFailed && gates.length === 0 && !searching ? (
        <p className="note">Could not search the chain for your gates. You can still deploy a new one or paste an existing address.</p>
      ) : null}
    </section>
  );
}
