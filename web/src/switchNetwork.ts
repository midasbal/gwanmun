import { marooAddChainParams, MAROO_CHAIN_ID_HEX } from "./chain";

export type Eip1193 = { request(args: { method: string; params?: unknown[] }): Promise<unknown> };

/** 4902 is the standard "unrecognized chain" code. Some wallets wrap it in -32603. */
function isUnknownChain(err: unknown): boolean {
  const e = err as { code?: number; data?: { originalError?: { code?: number } } };
  return e?.code === 4902 || e?.data?.originalError?.code === 4902 || e?.code === -32603;
}

export async function switchToMaroo(provider: Eip1193): Promise<void> {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: MAROO_CHAIN_ID_HEX }],
    });
  } catch (err) {
    if (!isUnknownChain(err)) throw err;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [marooAddChainParams],
    });
  }
}
