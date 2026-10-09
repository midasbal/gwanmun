import { useCallback, useState } from "react";
import { useAccount, useBalance, useConnect, useDisconnect } from "wagmi";
import { MAROO_CHAIN_ID, MIN_FUNDED_BALANCE, marooTestnet } from "./chain";
import { switchToMaroo, type Eip1193 } from "./switchNetwork";
import { clearGate, loadGate, saveGate } from "./lib/gateStorage";
import { AccountStrip } from "./components/AccountStrip";
import { FundingGate } from "./components/FundingGate";
import { DeployGate } from "./components/DeployGate";
import { GateStatus } from "./components/GateStatus";

function Mark() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M5 8h22M9 8v17M23 8v17" stroke="currentColor" strokeWidth="3.2" strokeLinecap="square" />
    </svg>
  );
}

function Header() {
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  return (
    <header className="header">
      <div className="wordmark">
        <Mark />
        <span>Gwanmun</span>
      </div>
      {isConnected ? (
        <button type="button" className="btn btn-quiet btn-sm" onClick={() => disconnect()}>
          Disconnect
        </button>
      ) : null}
    </header>
  );
}

function Disconnected() {
  const { connectors, connect, isPending, error } = useConnect();
  const hasWallet = typeof window !== "undefined" && "ethereum" in window;
  const connector = connectors[0];
  return (
    <section className="panel">
      <h1>Compliance gateway for Maroo</h1>
      <p className="lede">
        Deploy your own PCL proxy, manage its denylist, and watch the chain reject calls from denylisted senders.
      </p>
      <div className="row">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!connector || !hasWallet || isPending}
          onClick={() => connector && connect({ connector })}
        >
          {isPending ? "Waiting for wallet" : "Connect wallet"}
        </button>
      </div>
      {!hasWallet ? <p className="note">No browser wallet detected. Install MetaMask or a compatible wallet.</p> : null}
      {error ? <p className="note note-blocked">{error.message}</p> : null}
    </section>
  );
}

function WrongNetwork({ chainId }: { chainId: number | undefined }) {
  const { connector } = useAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSwitch() {
    if (!connector) return;
    setBusy(true);
    setError(null);
    try {
      await switchToMaroo((await connector.getProvider()) as Eip1193);
    } catch (e) {
      setError((e as Error).message ?? "Network switch failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <p className="eyebrow eyebrow-blocked">Wrong network</p>
      <h1>Switch to {marooTestnet.name}</h1>
      <p className="lede">
        Your wallet is on chain <span className="mono">{chainId ?? "unknown"}</span>. Gwanmun runs on {marooTestnet.name}, chain{" "}
        <span className="mono">{MAROO_CHAIN_ID}</span>.
      </p>
      <div className="row">
        <button type="button" className="btn btn-primary" onClick={onSwitch} disabled={busy}>
          {busy ? "Waiting for wallet" : "Switch to Maroo Testnet"}
        </button>
      </div>
      {error ? <p className="note note-blocked">{error}</p> : null}
    </section>
  );
}

function Connected({ address }: { address: `0x${string}` }) {
  const { data: balance, isLoading } = useBalance({
    address,
    chainId: MAROO_CHAIN_ID,
    query: { refetchInterval: 4000 },
  });
  const [gate, setGate] = useState<`0x${string}` | null>(() => loadGate(address));

  const onGate = useCallback(
    (proxy: `0x${string}`) => {
      saveGate(address, proxy);
      setGate(proxy);
    },
    [address],
  );
  const onForget = useCallback(() => {
    clearGate(address);
    setGate(null);
  }, [address]);

  let body;
  if (gate) {
    body = <GateStatus proxy={gate} account={address} onForget={onForget} />;
  } else if (isLoading || !balance) {
    body = (
      <section className="panel">
        <p className="lede">Reading balance</p>
      </section>
    );
  } else if (balance.value < MIN_FUNDED_BALANCE) {
    body = (
      <>
        <FundingGate balance={balance} />
        <DeployGate account={address} onGate={onGate} existingOnly />
      </>
    );
  } else {
    body = <DeployGate account={address} onGate={onGate} />;
  }

  return (
    <>
      <AccountStrip address={address} balance={balance} />
      <main className="main">{body}</main>
    </>
  );
}

export default function App() {
  const { address, isConnected, chainId, status } = useAccount();
  let content;
  if (status === "connecting" || status === "reconnecting") {
    content = (
      <main className="main">
        <section className="panel">
          <p className="lede">Connecting</p>
        </section>
      </main>
    );
  } else if (!isConnected || !address) {
    content = (
      <main className="main">
        <Disconnected />
      </main>
    );
  } else if (chainId !== MAROO_CHAIN_ID) {
    content = (
      <main className="main">
        <WrongNetwork chainId={chainId} />
      </main>
    );
  } else {
    // keyed so switching accounts remounts and reloads that account's saved gate
    content = <Connected key={address} address={address} />;
  }
  return (
    <div className="shell">
      <Header />
      {content}
    </div>
  );
}
