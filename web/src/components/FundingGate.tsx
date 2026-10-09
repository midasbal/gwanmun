import { FAUCET_URL, MIN_FUNDED_BALANCE } from "../chain";
import { formatBalance } from "../lib/format";

export function FundingGate({ balance }: { balance: { value: bigint; decimals: number; symbol: string } }) {
  return (
    <section className="panel">
      <p className="eyebrow">Funding required</p>
      <h1>Get testnet tOKRW</h1>
      <p className="lede">
        Deploying a gate and binding its policies costs gas. You hold{" "}
        <span className="mono">
          {formatBalance(balance.value, balance.decimals)} {balance.symbol}
        </span>
        ; at least <span className="mono">{formatBalance(MIN_FUNDED_BALANCE, 18)}</span> is needed.
      </p>
      <div className="row">
        <a className="btn btn-primary" href={FAUCET_URL} target="_blank" rel="noopener noreferrer">
          Get testnet tOKRW
        </a>
      </div>
      <p className="note">This page checks your balance every few seconds and continues once you are funded.</p>
    </section>
  );
}
