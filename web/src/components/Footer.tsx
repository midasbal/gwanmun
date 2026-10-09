import { useState } from "react";
import { FAUCET_URL, marooAddChainParams, marooTestnet } from "../chain";
import type { Eip1193 } from "../switchNetwork";

const LINKS = {
  github: "https://github.com/midasbal/gwanmun",
  x: "https://x.com/wjmdiary",
  maroo: "https://maroo.io",
  marooX: "https://x.com/maroo_io",
};

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a className="link" href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export function Footer() {
  const provider = typeof window !== "undefined" ? (window as unknown as { ethereum?: Eip1193 }).ethereum : undefined;
  const [note, setNote] = useState<string | null>(null);

  async function addNetwork() {
    if (!provider) return;
    setNote(null);
    try {
      await provider.request({ method: "wallet_addEthereumChain", params: [marooAddChainParams] });
      setNote("Network request sent to your wallet.");
    } catch (e) {
      setNote((e as { message?: string }).message ?? "Your wallet did not add the network.");
    }
  }

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-col">
          <p className="footer-brand">Gwanmun</p>
          <p className="note">An independent project on the Maroo testnet. Not affiliated with Maroo or Hashed.</p>
          <p className="footer-links">
            <Ext href={LINKS.github}>GitHub</Ext>
            <Ext href={LINKS.x}>X</Ext>
          </p>
        </div>

        <div className="footer-col">
          <p className="footer-heading">Maroo testnet</p>
          <div className="row">
            <button type="button" className="btn btn-quiet btn-sm" onClick={addNetwork} disabled={!provider}>
              Add Maroo Testnet to wallet
            </button>
            <a className="btn btn-quiet btn-sm" href={FAUCET_URL} target="_blank" rel="noopener noreferrer">
              Get testnet tOKRW
            </a>
          </div>
          {!provider ? <p className="note">No browser wallet detected.</p> : null}
          {note ? <p className="note">{note}</p> : null}
          <p className="footer-links">
            <Ext href={marooTestnet.blockExplorers.default.url}>Explorer</Ext>
            <Ext href={LINKS.maroo}>Maroo</Ext>
            <Ext href={LINKS.marooX}>Maroo on X</Ext>
          </p>
          <p className="mono muted footer-facts">
            Network: {marooTestnet.name} · Chain ID {marooTestnet.id} · Currency {marooTestnet.nativeCurrency.symbol}
          </p>
        </div>
      </div>
    </footer>
  );
}
