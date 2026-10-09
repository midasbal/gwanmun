import { useState } from "react";
import { encodeFunctionData, isAddress, parseEther } from "viem";
import { useQuery } from "@tanstack/react-query";
import { useBalance, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { FAUCET_URL, MAROO_CHAIN_ID, explorerTx } from "../chain";
import { forwardAbi } from "../abi/forward";
import { describeError } from "../lib/errors";

/**
 * Explicit gas so the transaction is always broadcast. Gas estimation fails on a call the
 * protocol will reject, which would otherwise stop a denylisted send before it reaches the chain.
 * Proxy-wrapped calls report a flat ~1,000,000 gas, so 2,000,000 leaves headroom.
 */
const GAS = 2_000_000n;

function parseAmount(v: string): bigint | null {
  try {
    return v.trim() === "" ? null : parseEther(v.trim());
  } catch {
    return null;
  }
}

export function SendThroughGate({ proxy, account }: { proxy: `0x${string}`; account: `0x${string}` }) {
  const client = usePublicClient({ chainId: MAROO_CHAIN_ID });
  const { data: balance } = useBalance({ address: account, chainId: MAROO_CHAIN_ID });
  const [recipient, setRecipient] = useState<string>(account);
  const [amount, setAmount] = useState("1");
  const [sent, setSent] = useState<{ recipient: `0x${string}`; value: bigint } | null>(null);

  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data, chainId: MAROO_CHAIN_ID });

  const value = parseAmount(amount);
  const recipientOk = isAddress(recipient);
  const amountOk = value !== null && value > 0n;
  const empty = !!balance && balance.value === 0n;

  const awaiting = write.isPending;
  const pending = !!write.data && receipt.isLoading;
  const success = receipt.data?.status === "success";
  const reverted = receipt.data?.status === "reverted";
  const busy = awaiting || pending;

  function send() {
    if (!isAddress(recipient) || value === null || value <= 0n) return;
    setSent({ recipient, value });
    write.reset();
    write.writeContract({
      address: proxy,
      abi: forwardAbi,
      functionName: "forward",
      args: [recipient],
      value,
      gas: GAS,
      chainId: MAROO_CHAIN_ID,
    });
  }

  // A reverted transaction carries no reason in its receipt. Replay it one block earlier
  // to recover the revert data, so a denylisted sender surfaces as InDenylist.
  const reason = useQuery({
    queryKey: ["sendRevertReason", receipt.data?.transactionHash],
    enabled: reverted && !!client && !!sent,
    retry: false,
    staleTime: Infinity,
    queryFn: async () => {
      try {
        await client!.call({
          account,
          to: proxy,
          value: sent!.value,
          gas: GAS,
          data: encodeFunctionData({ abi: forwardAbi, functionName: "forward", args: [sent!.recipient] }),
          blockNumber: receipt.data!.blockNumber - 1n,
        });
        return "The transaction reverted on-chain, but the reason could not be reproduced.";
      } catch (e) {
        return describeError(e).message;
      }
    },
  });

  const sendErr = write.error ? describeError(write.error) : null;
  const rcptErr = receipt.error ? describeError(receipt.error) : null;

  return (
    <div className="denylist">
      <h2>Send a transaction through your gate</h2>
      <p className="note">
        This broadcasts a real transaction on the Maroo testnet, routed through your gate. If the sender or the recipient of the value is on the denylist, the chain rejects it.
      </p>

      {empty ? (
        <>
          <p className="note">Your balance is 0 tOKRW, so there is nothing to send and no gas to pay with.</p>
          <div className="row">
            <a className="btn btn-primary" href={FAUCET_URL} target="_blank" rel="noopener noreferrer">
              Get testnet tOKRW
            </a>
          </div>
        </>
      ) : (
        <>
          <div className="row">
            <input
              className="input mono"
              placeholder="Recipient 0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value.trim())}
              spellCheck={false}
              aria-label="Recipient address"
            />
            <input
              className="input input-amount mono"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.trim())}
              spellCheck={false}
              aria-label="Amount in tOKRW"
            />
            <button type="button" className="btn btn-primary" onClick={send} disabled={busy || !recipientOk || !amountOk}>
              {awaiting ? "Confirm in wallet" : pending ? "Sending" : "Send"}
            </button>
          </div>
          {recipient && !recipientOk ? <p className="note">Enter a full 42 character recipient address.</p> : null}
          {amount && !amountOk ? <p className="note">Enter an amount greater than 0, in tOKRW.</p> : null}
        </>
      )}

      {write.data ? (
        <p className="note">
          Transaction{" "}
          <a className="link mono" href={explorerTx(write.data)} target="_blank" rel="noopener noreferrer">
            {write.data.slice(0, 10)}...{write.data.slice(-8)}
          </a>
          {pending ? ", waiting for confirmation." : ""}
        </p>
      ) : null}
      {success && write.data ? (
        <p className="note note-allowed">
          Success. The transaction went through your gate.{" "}
          <a className="link" href={explorerTx(write.data)} target="_blank" rel="noopener noreferrer">
            View on explorer
          </a>
        </p>
      ) : null}
      {reverted ? (
        <p className="note note-blocked">
          Rejected on-chain. {reason.isLoading ? "Reading the reason" : (reason.data ?? "The reason could not be read.")}
        </p>
      ) : null}
      {sendErr ? <p className={`note ${sendErr.rejected ? "" : "note-blocked"}`}>{sendErr.message}</p> : null}
      {rcptErr ? <p className="note note-blocked">{rcptErr.message}</p> : null}
    </div>
  );
}
