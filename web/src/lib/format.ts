import { formatUnits } from "viem";

export function formatBalance(value: bigint, decimals: number) {
  const [whole, frac = ""] = formatUnits(value, decimals).split(".");
  const trimmed = frac.slice(0, 4).replace(/0+$/, "");
  return `${Number(whole).toLocaleString("en-US")}${trimmed ? "." + trimmed : ""}`;
}

export const shortAddr = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;
