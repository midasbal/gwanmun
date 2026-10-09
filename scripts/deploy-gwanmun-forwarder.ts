import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import { createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { RPC_URL, marooTestnet, publicClient } from "../src/chain";

const pk = process.env.PRIVATE_KEY!;
const account = privateKeyToAccount((pk.startsWith("0x") ? pk : `0x${pk}`) as Hex);
const wallet = createWalletClient({ account, chain: marooTestnet, transport: http(RPC_URL) });
const art = JSON.parse(readFileSync("out/GwanmunForwarder.sol/GwanmunForwarder.json", "utf8"));
const hash = await wallet.deployContract({ abi: art.abi, bytecode: art.bytecode.object as Hex });
console.log(`deploy tx: ${hash}`);
const r = await publicClient.waitForTransactionReceipt({ hash });
console.log(`status: ${r.status}, contract: ${r.contractAddress}`);
if (r.status !== "success") process.exit(1);
const st = JSON.parse(readFileSync(".probe-state.json", "utf8"));
st.gwanmunForwarder = r.contractAddress;
writeFileSync(".probe-state.json", JSON.stringify(st, null, 2));
