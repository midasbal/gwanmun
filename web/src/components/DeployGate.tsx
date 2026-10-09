import { useEffect, useRef, useState } from "react";
import {
  decodeEventLog,
  encodeAbiParameters,
  encodeFunctionData,
  isAddress,
  parseAbiParameters,
} from "viem";
import { usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { LOGIC_CONTRACT_ADDRESS, MAROO_CHAIN_ID, PCL_ADDRESS, explorerTx } from "../chain";
import { iPclAbi } from "../abi/iPcl";
import { describeError } from "../lib/errors";

const initializeAbi = [
  {
    type: "function",
    name: "initialize",
    stateMutability: "nonpayable",
    inputs: [{ name: "owner_", type: "address" }],
    outputs: [],
  },
] as const;

type Verify = { status: "idle" | "checking" | "error"; message?: string };

export function DeployGate({
  account,
  onGate,
  existingOnly = false,
}: {
  account: `0x${string}`;
  onGate: (proxy: `0x${string}`) => void;
  /** When unfunded, only the paste-an-existing-gate path is offered. */
  existingOnly?: boolean;
}) {
  const client = usePublicClient({ chainId: MAROO_CHAIN_ID });
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data, chainId: MAROO_CHAIN_ID });
  const [verify, setVerify] = useState<Verify>({ status: "idle" });
  const handled = useRef<string | null>(null);

  const [existing, setExisting] = useState("");
  const [existingError, setExistingError] = useState<string | null>(null);
  const [existingBusy, setExistingBusy] = useState(false);

  function deploy() {
    setVerify({ status: "idle" });
    handled.current = null;
    const initializer = encodeFunctionData({ abi: initializeAbi, functionName: "initialize", args: [account] });
    const initData = encodeAbiParameters(parseAbiParameters("address, address, bytes"), [
      LOGIC_CONTRACT_ADDRESS,
      account,
      initializer,
    ]);
    write.reset();
    write.writeContract({
      address: PCL_ADDRESS,
      abi: iPclAbi,
      functionName: "deployPclProxy",
      args: [1, 0n, initData],
      chainId: MAROO_CHAIN_ID,
    });
  }

  // On confirmation: read PclProxyDeployed, verify registration, hand the gate up.
  useEffect(() => {
    const r = receipt.data;
    if (!r || r.status !== "success" || !client) return;
    if (handled.current === r.transactionHash) return;
    handled.current = r.transactionHash;
    setVerify({ status: "checking" });
    (async () => {
      let proxy: `0x${string}` | undefined;
      for (const log of r.logs) {
        if (log.address.toLowerCase() !== PCL_ADDRESS.toLowerCase()) continue;
        try {
          const ev = decodeEventLog({ abi: iPclAbi, data: log.data, topics: log.topics });
          if (ev.eventName === "PclProxyDeployed") proxy = ev.args.proxy;
        } catch {
          /* not a decodable PCL event */
        }
      }
      if (!proxy) throw new Error("The PclProxyDeployed event was not found in the receipt.");
      const entry = await client.readContract({
        address: PCL_ADDRESS,
        abi: iPclAbi,
        functionName: "pclProxy",
        args: [proxy],
      });
      if (entry.kind !== 1) throw new Error(`Expected a Transparent proxy (kind 1), got kind ${entry.kind}.`);
      if (entry.admin.toLowerCase() !== account.toLowerCase()) throw new Error("The proxy admin is not your account.");
      onGate(proxy);
    })().catch((e) => setVerify({ status: "error", message: describeError(e).message }));
  }, [receipt.data, client, account, onGate]);

  async function useExisting() {
    setExistingError(null);
    if (!isAddress(existing)) {
      setExistingError("Enter a valid proxy address.");
      return;
    }
    if (!client) return;
    setExistingBusy(true);
    try {
      const entry = await client.readContract({
        address: PCL_ADDRESS,
        abi: iPclAbi,
        functionName: "pclProxy",
        args: [existing],
      });
      if (entry.kind === 0) {
        setExistingError("That address is not a registered PCL proxy.");
        return;
      }
      onGate(existing);
    } catch (e) {
      setExistingError(describeError(e).message);
    } finally {
      setExistingBusy(false);
    }
  }

  const sendErr = write.error ? describeError(write.error) : null;
  const rcptErr = receipt.error ? describeError(receipt.error) : null;
  const reverted = receipt.data?.status === "reverted";
  const awaiting = write.isPending;
  const pending = !!write.data && receipt.isLoading;
  const busy = awaiting || pending || verify.status === "checking";

  return (
    <>
      {existingOnly ? null : (
      <section className="panel">
        <p className="eyebrow">Step 1</p>
        <h1>Deploy your compliance gate</h1>
        <p className="lede">
          This deploys a PCL proxy that you own and will curate. Calls routed through it are checked by the chain against
          the policies you bind to it.
        </p>
        <div className="row">
          <button type="button" className="btn btn-primary" onClick={deploy} disabled={busy}>
            {awaiting ? "Confirm in wallet" : pending ? "Deploying" : verify.status === "checking" ? "Verifying" : "Deploy gate"}
          </button>
        </div>

        {write.data ? (
          <p className="note">
            Transaction{" "}
            <a className="link mono" href={explorerTx(write.data)} target="_blank" rel="noopener noreferrer">
              {write.data.slice(0, 10)}...{write.data.slice(-8)}
            </a>
            {pending ? ", waiting for confirmation." : receipt.data?.status === "success" ? ", confirmed." : ""}
          </p>
        ) : null}
        {sendErr ? (
          <p className={`note ${sendErr.rejected ? "" : "note-blocked"}`}>{sendErr.message}</p>
        ) : null}
        {rcptErr ? <p className="note note-blocked">{rcptErr.message}</p> : null}
        {reverted ? <p className="note note-blocked">The deploy transaction reverted on-chain.</p> : null}
        {verify.status === "error" ? <p className="note note-blocked">{verify.message}</p> : null}
      </section>
      )}

      <section className="panel panel-secondary">
        <h2>Use an existing gate</h2>
        <p className="note">Paste a PCL proxy address you already deployed.</p>
        <div className="row">
          <input
            className="input mono"
            placeholder="0x..."
            value={existing}
            onChange={(e) => setExisting(e.target.value.trim())}
            spellCheck={false}
            aria-label="Existing gate proxy address"
          />
          <button type="button" className="btn btn-quiet" onClick={useExisting} disabled={existingBusy || !existing}>
            {existingBusy ? "Checking" : "Use gate"}
          </button>
        </div>
        {existingError ? <p className="note note-blocked">{existingError}</p> : null}
      </section>
    </>
  );
}
