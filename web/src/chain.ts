import { defineChain } from "viem";

export const MAROO_CHAIN_ID = 450815;
export const MAROO_CHAIN_ID_HEX = "0x6E0FF" as const;

export const marooTestnet = defineChain({
  id: MAROO_CHAIN_ID,
  name: "Maroo Testnet",
  nativeCurrency: { name: "tOKRW", symbol: "tOKRW", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc-testnet.maroo.io"],
      webSocket: ["wss://ws-testnet.maroo.io"],
    },
  },
  blockExplorers: {
    default: { name: "Maroo Explorer", url: "https://explorer-testnet.maroo.io" },
  },
  testnet: true,
});

/** Params for wallet_addEthereumChain. */
export const marooAddChainParams = {
  chainId: MAROO_CHAIN_ID_HEX,
  chainName: marooTestnet.name,
  nativeCurrency: marooTestnet.nativeCurrency,
  rpcUrls: [...marooTestnet.rpcUrls.default.http],
  blockExplorerUrls: [marooTestnet.blockExplorers.default.url],
} as const;

/** PCL precompile. */
export const PCL_ADDRESS = "0x1000000000000000000000000000000000000005" as const;

/**
 * Canonical logic contract behind every Gwanmun gate: GwanmunForwarder, an
 * initializable contract with forward(address) payable and initialize(address)
 * (selector 0xc4d66de8).
 */
export const LOGIC_CONTRACT_ADDRESS = "0x7ff637c15ae8685e1fde8c0c2612cd17d8cb3ff8" as const;

export const FAUCET_URL = "https://faucet.maroo.io";

/** Below this balance the deploy step is hidden behind the faucet prompt. */
export const MIN_FUNDED_BALANCE = 20n * 10n ** 18n;

export const PROXY_KIND_NAMES: Record<number, string> = {
  0: "Unregistered",
  1: "Transparent",
  2: "UUPS",
  3: "Beacon",
};

export const explorerTx = (hash: string) => `${marooTestnet.blockExplorers.default.url}/tx/${hash}`;
export const explorerAddress = (addr: string) => `${marooTestnet.blockExplorers.default.url}/address/${addr}`;
