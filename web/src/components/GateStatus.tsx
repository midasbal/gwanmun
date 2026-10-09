import { useReadContract } from "wagmi";
import { MAROO_CHAIN_ID, PCL_ADDRESS, PROXY_KIND_NAMES, explorerAddress } from "../chain";
import { iPclAbi } from "../abi/iPcl";
import { CopyButton } from "./CopyButton";

export function GateStatus({
  proxy,
  account,
  onForget,
}: {
  proxy: `0x${string}`;
  account: `0x${string}`;
  onForget: () => void;
}) {
  const { data, isLoading, isError, refetch } = useReadContract({
    address: PCL_ADDRESS,
    abi: iPclAbi,
    functionName: "pclProxy",
    args: [proxy],
    chainId: MAROO_CHAIN_ID,
  });

  const registered = !!data && data.kind !== 0;
  const isAdmin = !!data && data.admin.toLowerCase() === account.toLowerCase();

  return (
    <section className="panel">
      <p className={`eyebrow ${registered ? "eyebrow-allowed" : "eyebrow-blocked"}`}>
        {isLoading ? "Reading gate" : registered ? "Gate registered" : "Gate not found"}
      </p>
      <h1>Your compliance gate</h1>

      {isError ? (
        <p className="note note-blocked">
          Could not read the gate from the PCL precompile.{" "}
          <button type="button" className="link" onClick={() => refetch()}>
            Retry
          </button>
        </p>
      ) : null}

      {data && !registered ? (
        <p className="note note-blocked">
          This address is not a registered PCL proxy, so it cannot enforce policies.
        </p>
      ) : null}

      <dl className="facts">
        <div>
          <dt>Proxy</dt>
          <dd className="mono wrap">
            {proxy} <CopyButton text={proxy} />{" "}
            <a className="link" href={explorerAddress(proxy)} target="_blank" rel="noopener noreferrer">
              Explorer
            </a>
          </dd>
        </div>
        <div>
          <dt>Kind</dt>
          <dd>{data ? `${PROXY_KIND_NAMES[data.kind] ?? "Unknown"} (${data.kind})` : "Loading"}</dd>
        </div>
        <div>
          <dt>Admin</dt>
          <dd className="mono wrap">
            {data ? data.admin : "Loading"}
            {data && isAdmin ? <span className="tag tag-allowed">You</span> : null}
          </dd>
        </div>
      </dl>

      {data && registered && !isAdmin ? (
        <p className="note note-blocked">Only the admin can manage this gate. Connect the admin account to change its policies.</p>
      ) : null}

      <div className="row">
        <button type="button" className="btn btn-quiet btn-sm" onClick={onForget}>
          Use a different gate
        </button>
      </div>
    </section>
  );
}
