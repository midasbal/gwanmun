import { createPublicClient, defineChain, http } from "viem";

export const RPC_URL = process.env.RPC_URL ?? "https://rpc-testnet.maroo.io";

export const marooTestnet = defineChain({
  id: 450815,
  name: "Maroo Testnet",
  nativeCurrency: { name: "tOKRW", symbol: "tOKRW", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc-testnet.maroo.io"],
      webSocket: ["wss://ws-testnet.maroo.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Maroo Explorer",
      url: "https://explorer-testnet.maroo.io",
      apiUrl: "https://explorer-testnet.maroo.io/blockscout/api/v2",
    },
  },
  testnet: true,
});

export const publicClient = createPublicClient({
  chain: marooTestnet,
  transport: http(RPC_URL),
});

export const PCL_ADDRESS = "0x1000000000000000000000000000000000000005" as const;
export const OKRW_PRECOMPILE = "0x1000000000000000000000000000000000000001" as const;
export const OKRW_ERC20 = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as const;
