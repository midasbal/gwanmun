import { decodeAbiParameters } from "viem";
import { useReadContract } from "wagmi";
import { LOGIC_CONTRACT_ADDRESS, MAROO_CHAIN_ID, PCL_ADDRESS, explorerAddress } from "../chain";
import { iPclAbi } from "../abi/iPcl";
import { CopyButton } from "./CopyButton";

const denyParam = [{ type: "tuple", components: [{ name: "addresses", type: "address[]" }] }] as const;

function AddressRow({ label, address }: { label: string; address: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className="mono wrap">
        {address} <CopyButton text={address} />{" "}
        <a className="link" href={explorerAddress(address)} target="_blank" rel="noopener noreferrer">
          Explorer
        </a>
      </dd>
    </div>
  );
}

export function OnChainDetails({ proxy }: { proxy: `0x${string}` }) {
  const { data, isLoading, isError } = useReadContract({
    address: PCL_ADDRESS,
    abi: iPclAbi,
    functionName: "contractPolicies",
    args: [proxy],
    chainId: MAROO_CHAIN_ID,
  });

  return (
    <details className="disclosure disclosure-section">
      <summary>On-chain details</summary>

      <div className="disclosure-body">
        <h3>Stored policy</h3>
        <p className="note">This is the exact policy data stored on Maroo for your gate, read from the PCL precompile.</p>
        {isLoading ? <p className="note">Reading policies</p> : null}
        {isError ? <p className="note note-blocked">Could not read the policies.</p> : null}
        {data && data.policies.length === 0 ? <p className="note">No policy is bound to this gate.</p> : null}
        {data?.policies.map((p, i) => {
          let decoded: readonly string[] | null = null;
          if (p.templateId === "DENYLIST_POLICY") {
            try {
              decoded = decodeAbiParameters(denyParam, p.policy)[0].addresses;
            } catch {
              decoded = null;
            }
          }
          return (
            <dl className="facts" key={`${p.templateId}-${i}`}>
              <div>
                <dt>Template</dt>
                <dd className="mono">{p.templateId}</dd>
              </div>
              <div>
                <dt>Selector</dt>
                <dd>
                  <span className="mono">{p.selector}</span>
                  {p.selector === "0x" ? <span className="muted"> (all functions)</span> : null}
                </dd>
              </div>
              <div>
                <dt>Policy bytes</dt>
                <dd className="mono wrap bytes">
                  {p.policy} <CopyButton text={p.policy} />
                </dd>
              </div>
              {decoded ? (
                <div>
                  <dt>Decoded</dt>
                  <dd className="mono wrap">
                    {decoded.length === 0 ? <span className="muted">addresses: (empty)</span> : decoded.map((a) => <div key={a}>{a}</div>)}
                  </dd>
                </div>
              ) : null}
            </dl>
          );
        })}

        <h3>How enforcement works</h3>
        <p className="note note-body">
          Calls to this Transparent PCL proxy trigger the PCL preCall and postCall hooks, which evaluate the bound policy before
          the call executes. For the denylist, a transaction is rejected if the sender is on the denylist, or if it sends value to
          a denylisted address. The revert is InDenylist(address), error selector <span className="mono">0x0201b218</span>, and
          the address it names is the denylisted party involved, which may be the sender or the recipient. A zero-value call that
          only names a denylisted address as its target is allowed. The address checker reproduces the sender side of this rule
          with eth_call, at zero gas.
        </p>

        <h3>Addresses</h3>
        <dl className="facts">
          <AddressRow label="Gate proxy" address={proxy} />
          <AddressRow label="PCL precompile" address={PCL_ADDRESS} />
          <AddressRow label="Logic contract" address={LOGIC_CONTRACT_ADDRESS} />
        </dl>
      </div>
    </details>
  );
}
