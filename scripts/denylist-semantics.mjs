// Read-only probe of DENYLIST_POLICY semantics. Uses eth_call only; nothing is signed or broadcast.
import { createPublicClient, decodeErrorResult, encodeFunctionData, getAddress, http } from "viem";

const RPC = "https://rpc-testnet.maroo.io";
const D_GATE = "0xf0e943903460a16d0ecc37d0fdb593dd36a4d862";
const DENY = "0x000000000000000000000000000000000000dEaD";
const USER = "0x73AbD80F4a683224E22b8D5408AdFa6c36517719";
const NEUTRAL = "0x00000000000000000000000000000000000000e1"; // lowercase: the mixed-case form fails viem checksum validation
const ETH = 10n ** 18n;

const forwardAbi = [{ type: "function", name: "forward", stateMutability: "payable", inputs: [{ name: "to", type: "address" }], outputs: [] }];
const errAbi = [{ type: "error", name: "InDenylist", inputs: [{ name: "sender", type: "address" }] }];
const client = createPublicClient({ transport: http(RPC) });

const cases = [
  [1, USER, DENY, 0n],
  [2, USER, DENY, ETH],
  [3, USER, NEUTRAL, ETH],
  [4, USER, NEUTRAL, 0n],
  [5, DENY, NEUTRAL, 0n],
  [6, DENY, NEUTRAL, ETH],
  [7, NEUTRAL, DENY, ETH],
  [8, NEUTRAL, NEUTRAL, ETH],
];

function revertData(e) {
  for (let y = e; y; y = y.cause) {
    if (typeof y.data === "string" && y.data.startsWith("0x")) return y.data;
    if (typeof y.data?.data === "string" && y.data.data.startsWith("0x")) return y.data.data;
  }
}

async function run(from, to, value, override) {
  try {
    await client.call({
      account: from,
      to: D_GATE,
      value,
      data: encodeFunctionData({ abi: forwardAbi, functionName: "forward", args: [to] }),
      ...(override ? { stateOverride: [{ address: from, balance: 100n * ETH }] } : {}),
    });
    return { outcome: "allowed" };
  } catch (e) {
    const raw = revertData(e);
    if (raw) {
      try {
        const d = decodeErrorResult({ abi: errAbi, data: raw });
        return { outcome: `InDenylist(${getAddress(d.args[0])})` };
      } catch {
        return { outcome: `other: ${raw.slice(0, 74)}` };
      }
    }
    return { outcome: `other (no revert data): ${(e.shortMessage ?? e.message).split("\n")[0].slice(0, 90)}`, noData: true };
  }
}

console.log("Balances (wei): ");
for (const [n, a] of [["USER", USER], ["DENY", DENY], ["NEUTRAL", NEUTRAL]]) console.log(`  ${n} ${a} ${await client.getBalance({ address: a })}`);

const rows = [];
let overrideUsable = true;
for (const [n, from, to, value] of cases) {
  let r = await run(from, to, value, true);
  let mode = "override";
  if (r.noData) {
    // The RPC may not support state overrides; retry plainly and record that.
    r = await run(from, to, value, false);
    mode = "plain";
    overrideUsable = false;
  }
  rows.push({ n, from, to, value, outcome: r.outcome, mode });
}

const short = (a) => `${a.slice(0, 6)}..${a.slice(-4)}`;
const name = (a) => (a === USER ? "USER" : a === DENY ? "DENY" : "NEUTRAL");
console.log("\ncase | from | to | value | outcome | balance mode");
for (const r of rows) {
  console.log(`${r.n} | ${name(r.from)} ${short(r.from)} | ${name(r.to)} ${short(r.to)} | ${r.value} | ${r.outcome} | ${r.mode}`);
}
console.log(`\nState override usable on this RPC for every case: ${overrideUsable}`);
