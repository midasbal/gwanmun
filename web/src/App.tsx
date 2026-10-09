import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount, useBalance, useConnect, useDisconnect, usePublicClient } from "wagmi";
import { FAUCET_URL, MAROO_CHAIN_ID, MIN_FUNDED_BALANCE, marooTestnet } from "./chain";
import { switchToMaroo, type Eip1193 } from "./switchNetwork";
import { addDismissed, addGates, loadDismissed, loadGates, removeDismissed, removeGate } from "./lib/gateStorage";
import { recoverGates } from "./lib/recoverGates";
import { AccountStrip } from "./components/AccountStrip";
import { FundingGate } from "./components/FundingGate";
import { DeployGate } from "./components/DeployGate";
import { GateStatus } from "./components/GateStatus";
import { GatesList } from "./components/GatesList";
import { Docs } from "./components/Docs";
import { Footer } from "./components/Footer";

function Mark() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M5 8h22M9 8v17M23 8v17" stroke="currentColor" strokeWidth="3.2" strokeLinecap="square" />
    </svg>
  );
}

function Header({ nav }: { nav?: { onHome: () => void; onDocs: () => void } }) {
  const { disconnect } = useDisconnect();
  const { isConnected } = useAccount();
  const brand = (
    <>
      <Mark />
      <span>Gwanmun</span>
    </>
  );
  return (
    <header className="header">
      {nav ? (
        <button type="button" className="wordmark wordmark-button" onClick={nav.onHome} aria-label="Gwanmun home">
          {brand}
        </button>
      ) : (
        <div className="wordmark">{brand}</div>
      )}
      <div className="header-actions">
        {nav ? (
          <button type="button" className="link header-link" onClick={nav.onDocs}>
            Docs
          </button>
        ) : null}
        {isConnected ? (
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => disconnect()}>
            Disconnect
          </button>
        ) : null}
      </div>
    </header>
  );
}

function Disconnected() {
  const { connectors, connect, isPending, error } = useConnect();
  const hasWallet = typeof window !== "undefined" && "ethereum" in window;
  const connector = connectors[0];
  return (
    <section className="panel">
      <h1>Gwanmun</h1>
      <p className="lede">Set a compliance rule on Maroo, and prove the chain enforces it.</p>
      <p>
        Deploy a gate you control on the Maroo testnet, then add an address to its denylist. From that point, Maroo itself, not
        this app, rejects that address's transactions through your gate. Connect a wallet to deploy your gate. You will need a
        small amount of testnet tOKRW for gas, which the faucet gives out for free.
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
        <a className="btn btn-quiet" href={FAUCET_URL} target="_blank" rel="noopener noreferrer">
          Get testnet tOKRW
        </a>
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
  const client = usePublicClient({ chainId: MAROO_CHAIN_ID });
  const { data: balance } = useBalance({
    address,
    chainId: MAROO_CHAIN_ID,
    query: { refetchInterval: 4000 },
  });
  const [cached, setCached] = useState<`0x${string}`[]>(() => loadGates(address));
  const [dismissed, setDismissed] = useState<string[]>(() => loadDismissed(address));
  const [selected, setSelected] = useState<`0x${string}` | null>(null);
  const [view, setView] = useState<"home" | "docs">("home");
  const goHome = useCallback(() => {
    setSelected(null);
    setView("home");
  }, []);
  const goDocs = useCallback(() => {
    setSelected(null);
    setView("docs");
  }, []);

  // Best-effort on-chain recovery. Additive: never blocks deploy, paste, or cached gates.
  const recovery = useQuery({
    queryKey: ["recoverGates", address],
    queryFn: ({ signal }) => recoverGates(client!, address, signal),
    enabled: !!client,
    staleTime: 60_000,
    retry: false,
  });
  const recovered = recovery.data?.gates;

  // Persist anything recovered so it survives if the explorer is unreachable next time.
  useEffect(() => {
    const visible = (recovered ?? []).filter((g) => !dismissed.includes(g.toLowerCase()));
    if (visible.length) addGates(address, visible);
  }, [address, recovered, dismissed]);

  // Displayed gates: cached merged with recovered, minus anything the user dismissed.
  const gates: `0x${string}`[] = [];
  for (const g of [...cached, ...(recovered ?? [])]) {
    const k = g.toLowerCase();
    if (!dismissed.includes(k) && !gates.some((x) => x.toLowerCase() === k)) gates.push(g);
  }

  const onGate = useCallback(
    (proxy: `0x${string}`) => {
      // Re-adding a previously removed gate un-hides it.
      setDismissed(removeDismissed(address, proxy));
      setCached(addGates(address, [proxy]));
      setSelected(proxy);
    },
    [address],
  );
  const onRemove = useCallback(() => {
    if (!selected) return;
    setCached(removeGate(address, selected));
    setDismissed(addDismissed(address, selected));
    setSelected(null);
  }, [address, selected]);

  const searching = recovery.isFetching;
  const searchFailed = !!recovery.data && recovery.data.errors.length > 0 && recovery.data.gates.length === 0;
  const funded = balance ? balance.value >= MIN_FUNDED_BALANCE : null;

  let body;
  if (selected) {
    body = <GateStatus proxy={selected} account={address} onHome={goHome} onRemove={onRemove} />;
  } else if (view === "docs") {
    body = <Docs onHome={goHome} />;
  } else {
    body = (
      <>
        {gates.length > 0 || searching ? (
          <GatesList gates={gates} searching={searching} searchFailed={searchFailed} onOpen={setSelected} />
        ) : null}
        {funded === false && balance ? <FundingGate balance={balance} /> : null}
        {funded === null ? (
          <section className="panel">
            <p className="note">Reading balance</p>
          </section>
        ) : (
          <DeployGate account={address} onGate={onGate} existingOnly={!funded} hasGates={gates.length > 0} />
        )}
      </>
    );
  }

  return (
    <>
      <Header nav={{ onHome: goHome, onDocs: goDocs }} />
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
      <>
        <Header />
        <main className="main">
          <WrongNetwork chainId={chainId} />
        </main>
      </>
    );
  } else {
    // keyed so switching accounts remounts and reloads that account's saved gate
    content = <Connected key={address} address={address} />;
  }
  return (
    <div className="shell">
      {content}
      <Footer />
    </div>
  );
}
