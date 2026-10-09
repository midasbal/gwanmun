import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { marooTestnet } from "./chain";

export const config = createConfig({
  chains: [marooTestnet],
  connectors: [injected()],
  transports: { [marooTestnet.id]: http(marooTestnet.rpcUrls.default.http[0]) },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
