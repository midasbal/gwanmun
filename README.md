# Gwanmun

Gwanmun is a tool for Maroo's Programmable Compliance Layer (PCL). You deploy your own
PCL proxy, manage a denylist on it, and watch Maroo reject transactions from denylisted senders.

## What is proven

On Maroo Testnet (chainId 450815), a Transparent PCL proxy bound with `DENYLIST_POLICY`
rejects a real call from a denylisted sender with `InDenylist(sender)`, and accepts the same
call once the sender is removed. `eth_call` reproduces the rejection, so it can be checked at
zero gas before sending. Details, addresses and transaction hashes are in
[docs/FINDINGS.md](docs/FINDINGS.md).

Out of scope for v1: `VOLUME_POLICY` (the aokrw token address is undocumented) and
`EAS_POLICY` (needs Kakao and SMS KYC).

## Setup

    npm install
    cp .env.example .env   # set PRIVATE_KEY to a throwaway TESTNET key
    forge build            # compiles contracts/ (Foundry required)

Never use a key that holds real funds. `.env` is gitignored.

## Scripts

Run with `npx tsx scripts/<name>.ts`. Most send real testnet transactions.

- `sender-denylist-probe.ts`: denylist the sender, show the `InDenylist` revert, restore, and run a control call
- `denylist-probe.ts`: shows a denylisted target address is not blocked
- `simulate-forward.ts`: `eth_call` simulation only
- `gate-probe.ts`, `probe-enforcement.ts`, `real-forward.ts`: VOLUME_POLICY experiments, not expected to pass

Layout: `src/chain.ts` (viem chain config and client), `contracts/` (logic contracts),
`docs/FINDINGS.md`.
