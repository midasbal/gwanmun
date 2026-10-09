import { formatBalance } from "../lib/format";
import { MAROO_CHAIN_ID, marooTestnet } from "../chain";
import { CopyButton } from "./CopyButton";

export function AccountStrip({
  address,
  balance,
}: {
  address: `0x${string}`;
  balance: { value: bigint; decimals: number; symbol: string } | undefined;
}) {
  return (
    <div className="strip">
      <div className="strip-inner">
        <span className="strip-item">
          <span className="muted">Account</span>
          <span className="mono" title={address}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <CopyButton text={address} />
        </span>
        <span className="strip-item">
          <span className="muted">Balance</span>
          <span className="mono">{balance ? `${formatBalance(balance.value, balance.decimals)} ${balance.symbol}` : "Loading"}</span>
        </span>
        <span className="strip-item">
          <span className="muted">Network</span>
          <span>
            {marooTestnet.name} <span className="mono muted">{MAROO_CHAIN_ID}</span>
          </span>
        </span>
      </div>
    </div>
  );
}
