# Gwanmun web

Frontend for Gwanmun. This step covers the theme, injected-wallet connect, and the Maroo Testnet network switch. It sends no transactions; it only reads a tOKRW balance.

## Run

    cd web
    npm install
    npm run dev

Open the printed local URL (default http://localhost:5173) in a browser with MetaMask or a compatible wallet.

Other scripts: `npm run build` (typecheck and production build), `npm run lint`.

## Layout

- `src/chain.ts`: Maroo Testnet config, PCL precompile address, and a placeholder for the canonical logic contract (set in the next step)
- `src/wagmi.ts`: wagmi config with the injected connector only
- `src/switchNetwork.ts`: `wallet_switchEthereumChain` with `wallet_addEthereumChain` fallback
- `src/index.css`: theme tokens (light and dark) and base styles
