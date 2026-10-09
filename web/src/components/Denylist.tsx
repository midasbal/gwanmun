import { useEffect, useRef, useState } from "react";
import { decodeAbiParameters, encodeAbiParameters, isAddress } from "viem";
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { MAROO_CHAIN_ID, PCL_ADDRESS, explorerTx } from "../chain";
import { iPclAbi } from "../abi/iPcl";
import { describeError } from "../lib/errors";
import { CopyButton } from "./CopyButton";

const TEMPLATE_ID = "DENYLIST_POLICY";
const SAMPLE_ADDRESS = "0x000000000000000000000000000000000000dEaD";
const denyParam = [{ type: "tuple", components: [{ name: "addresses", type: "address[]" }] }] as const;

type Action = { kind: "block" | "unblock"; address: `0x${string}` };

export function Denylist({
  proxy,
  account,
  isAdmin,
}: {
  proxy: `0x${string}`;
  account: `0x${string}`;
  isAdmin: boolean;
}) {
  const read = useReadContract({
    address: PCL_ADDRESS,
    abi: iPclAbi,
    functionName: "contractPolicies",
    args: [proxy],
    chainId: MAROO_CHAIN_ID,
  });
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data, chainId: MAROO_CHAIN_ID });

  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [action, setAction] = useState<Action | null>(null);

  const policies = read.data?.policies ?? [];
  const denySet = policies.find((p) => p.templateId === TEMPLATE_ID);
  let addresses: `0x${string}`[] = [];
  let decodeFailed = false;
  if (denySet) {
    try {
      addresses = [...decodeAbiParameters(denyParam, denySet.policy)[0].addresses];
    } catch {
      decodeFailed = true;
    }
  }

  // Refetch the list once per confirmed transaction.
  const refetched = useRef<string | null>(null);
  const { refetch } = read;
  useEffect(() => {
    const r = receipt.data;
    if (!r || r.status !== "success" || refetched.current === r.transactionHash) return;
    refetched.current = r.transactionHash;
    refetch();
  }, [receipt.data, refetch]);

  const awaiting = write.isPending;
  const pending = !!write.data && receipt.isLoading;
  const busy = awaiting || pending;

  function send(kind: Action["kind"], address: `0x${string}`, next: `0x${string}`[]) {
    // changeContractPolicies replaces the whole array: swap in the new DENYLIST set, keep any others.
    const blob = encodeAbiParameters(denyParam, [{ addresses: next }]);
    const updated = { templateId: TEMPLATE_ID, policy: blob, selector: "0x" as const };
    const others = policies.filter((p) => p.templateId !== TEMPLATE_ID);
    const merged = denySet ? policies.map((p) => (p.templateId === TEMPLATE_ID ? updated : p)) : [...others, updated];
    setAction({ kind, address });
    write.reset();
    write.writeContract({
      address: PCL_ADDRESS,
      abi: iPclAbi,
      functionName: "changeContractPolicies",
      args: [{ _contract: proxy, admin: account, policies: merged }],
      chainId: MAROO_CHAIN_ID,
    });
  }

  function block() {
    setInputError(null);
    if (!isAddress(input)) {
      setInputError("Enter a valid address.");
      return;
    }
    if (addresses.some((a) => a.toLowerCase() === input.toLowerCase())) {
      setInputError("That address is already blocked.");
      return;
    }
    send("block", input, [...addresses, input]);
    setInput("");
  }

  function unblock(address: `0x${string}`) {
    send(
      "unblock",
      address,
      addresses.filter((a) => a.toLowerCase() !== address.toLowerCase()),
    );
  }

  const sendErr = write.error ? describeError(write.error) : null;
  const rcptErr = receipt.error ? describeError(receipt.error) : null;
  const reverted = receipt.data?.status === "reverted";
  const confirmed = receipt.data?.status === "success";
  const blockingSelf = isAddress(input) && input.toLowerCase() === account.toLowerCase();

  return (
    <div className="denylist">
      <h2>Denylist</h2>
      <p className="note">Calls from a blocked address are rejected by the chain when routed through this gate.</p>

      {read.isError ? (
        <p className="note note-blocked">
          Could not read the denylist.{" "}
          <button type="button" className="link" onClick={() => read.refetch()}>
            Retry
          </button>
        </p>
      ) : null}
      {decodeFailed ? <p className="note note-blocked">The stored denylist could not be decoded.</p> : null}

      {read.isLoading ? (
        <p className="note">Reading denylist</p>
      ) : addresses.length === 0 ? (
        <p className="note">No addresses blocked yet.</p>
      ) : (
        <ul className="list">
          {addresses.map((a) => (
            <li key={a} className="list-row">
              <span className="mono wrap">
                {a} <CopyButton text={a} />
              </span>
              {isAdmin ? (
                <button type="button" className="btn btn-quiet btn-sm" onClick={() => unblock(a)} disabled={busy}>
                  Remove
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {isAdmin ? (
        <div className="add-block">
          <div className="row">
            <input
              className="input mono"
              placeholder="0x..."
              value={input}
              onChange={(e) => {
                setInput(e.target.value.trim());
                setInputError(null);
              }}
              spellCheck={false}
              aria-label="Address to block"
            />
            <button type="button" className="btn btn-quiet" onClick={() => setInput(SAMPLE_ADDRESS)} disabled={busy}>
              Use sample address
            </button>
            <button type="button" className="btn btn-primary" onClick={block} disabled={busy || !input}>
              {awaiting ? "Confirm in wallet" : pending ? "Updating" : "Block address"}
            </button>
          </div>
          {inputError ? <p className="note note-blocked">{inputError}</p> : null}
          {blockingSelf ? (
            <p className="note">This is your own address. Your calls through this gate will then be rejected, which is how you test enforcement on yourself.</p>
          ) : null}
        </div>
      ) : null}

      {write.data ? (
        <p className="note">
          {action ? (action.kind === "block" ? "Blocking" : "Removing") : "Update"}{" "}
          {action ? <span className="mono">{action.address.slice(0, 6)}...{action.address.slice(-4)}</span> : null}
          {": "}
          <a className="link mono" href={explorerTx(write.data)} target="_blank" rel="noopener noreferrer">
            {write.data.slice(0, 10)}...{write.data.slice(-8)}
          </a>
          {pending ? ", waiting for confirmation." : confirmed ? ", confirmed." : ""}
        </p>
      ) : null}
      {sendErr ? <p className={`note ${sendErr.rejected ? "" : "note-blocked"}`}>{sendErr.message}</p> : null}
      {rcptErr ? <p className="note note-blocked">{rcptErr.message}</p> : null}
      {reverted ? <p className="note note-blocked">The update transaction reverted on-chain.</p> : null}
    </div>
  );
}
