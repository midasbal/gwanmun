# Findings: PCL on Maroo Testnet

What we verified on-chain while building Gwanmun. "Verified" means observed in a
transaction or call we made. Items marked "reported" came from outside this
session and were not tested by us.

## Network

- Maroo Testnet, chainId 450815
- RPC https://rpc-testnet.maroo.io, WS wss://ws-testnet.maroo.io
- Explorer https://explorer-testnet.maroo.io (Blockscout API under /blockscout/api/v2)
- Native token tOKRW, 18 decimals, base unit aokrw
- Chain config lives in `src/chain.ts`

## Key artifacts

| Item | Value |
|---|---|
| PCL precompile | `0x1000000000000000000000000000000000000005` |
| GwanmunForwarder (logic) | `0x7ff637c15ae8685e1fde8c0c2612cd17d8cb3ff8` |
| PCL proxy (Transparent) | `0xf0E943903460a16D0eCc37D0FdB593dd36A4D862` |
| Deployer / proxy admin | `0x73AbD80F4a683224E22b8D5408AdFa6c36517719` (throwaway testnet key) |

The proxy fronts `GwanmunForwarder`, whose `forward(address to)` is payable and
forwards `msg.value` to `to`. Addresses are also in `.probe-state.json` (gitignored).

## deployPclProxy (verified)

- Signature: `deployPclProxy(uint8 kind, uint256 value, bytes initData)`, selector `0x7a409ccd`.
  The second argument is `value`, not a salt.
- Used `kind=1` (Transparent), `value=0`, `initData = abi.encode(logic, initialOwner, initializer)`.
- The logic contract must be initializable and the initializer must be non-empty:
  `initialize(address)`, selector `0xc4d66de8`. With an empty `"0x"` initializer on a
  non-initializable logic contract the call reverts with a bare `Error("execution reverted")`
  (no IPcl custom error). The same bare revert occurred for several other input variants,
  so treat the non-empty initializer as the working recipe, not a fully isolated cause.
- Deployment is not gated to special accounts: an ordinary funded EOA succeeded.
- Cost is about 1.29M gas (1,294,276 observed).
- `eth_call` simulation of the deploy returns the predicted proxy address.
  The address is also in the `PclProxyDeployed` event of the receipt.
- `pclProxy(proxy)` returns `kind=1` and the admin for a registered proxy.

## Policy binding (verified)

- `changeContractPolicies({ _contract, admin, policies })` upserts. The first caller for a
  proxy becomes its admin.
- `contractPolicies(proxy)` reads the binding back; the policy blob decodes with the
  matching struct.
- Binding `policies: []` clears the proxy's contract-scope policy; readback shows zero policies.
- Admin calls go to the PCL precompile directly, not through the proxy, so they bypass the
  proxy's policies. Denylisting the admin did not lock it out of rebinding.
- `policyTemplate("VOLUME_POLICY" | "PERIODIC_VOLUME_POLICY" | "DENYLIST_POLICY")` are all
  registered on-chain.

## DENYLIST_POLICY (verified, used by Gwanmun v1)

- Struct: `DenylistPolicy { address[] addresses; }`. Policy blob is `abi.encode` of that struct;
  `templateId` is `"DENYLIST_POLICY"`, `selector` is `"0x"`.
- It is sender/principal based, not touched-address based:
  - A call whose target (`forward(0x...dEaD)`) was on the list was NOT blocked.
  - A call FROM a denylisted sender WAS blocked.
- A real call from a denylisted sender reverts with `InDenylist(address sender)`,
  selector `0x0201b218`, with the sender as the argument.
- `eth_call` reproduces this revert, so simulation works as a zero-gas pre-check.
- A passing real call emits `IPcl.PolicyCheckPassed(sender, contractAddress)` from the precompile.

### Proving transactions

| Step | Tx | Result |
|---|---|---|
| Deploy GwanmunForwarder | `0xb92086c3091b481223bac9e91378fbee75983d1adf54cf28c5c71e5cb0300b3f` | success |
| Deploy PCL proxy | `0x3f62a90ade27a8bb5a95fbec3cd4c657c778cb7d9f797b8a5a6b8882218e6355` | success |
| Bind DENYLIST [0x...dEaD] (touched-address test) | `0x77c343f94264c5e85578bc573b0fd573b7b21db2463509f5d8c7c668beeb6fa3` | success |
| forward(0x...dEaD), target on list | `0xfdbceb0a21351e022291949754d2b0acc3d6b777514b7cb0ecfe92aafddbd4bc` | success (not blocked) |
| Rebind DENYLIST [sender] | `0x1e67686eda2936ad7a7d4838b8a6413e3b3664fde02f5d4ec587e695f34f4769` | success |
| forward(0x...bEEF), sender denylisted | `0xca0f1faf7ebe0f71493eb91557fb1dfde7bd64c945ed30fe1ae4e60a08a7d443` | reverted, InDenylist(sender) |
| Restore, `policies: []` | `0x9258a840e43223d82478687737597ecbcae66f31ac9d2b1829947ef2d1a37328` | success |
| forward(0x...bEEF), after removal (control) | `0x5fa0a664b858c342889b6f1bae22c00bcc8078382b1dfe7058e1e821fb6431d2` | success |

The revert reason for the blocked call was decoded from an `eth_call` replay at the previous
block, not from the explorer.

## VOLUME_POLICY (deferred)

- Template is registered and the binding stores and reads back correctly
  (`tokens=["aokrw"]`, max 100 OKRW), but it did not enforce on native value:
  - `eth_call` simulation of a 1000 OKRW `forward` succeeded.
  - Real 1000 OKRW `forward` succeeded and emitted `PolicyCheckPassed`
    (`0x6a920448a5b7a2f6402c47baf6f57e73436c99a37632d45b6f78b1480fccac29`;
    compliant 10 OKRW control `0x7954c27412734326e6a9f37f0d7d8c7fab96d942c9646385840f560375702572`).
- Reported, not verified by us: the policy is measured by a post-execution sweep over ERC20
  `Transfer` logs, not native `call{value}`.
- The docs' OKRW ERC20 address `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE` has no code and
  returns empty data to `eth_call` (`name`, `symbol`, `balanceOf`, `allowance` all empty). The
  OKRW precompile `0x...0001` also does not answer ERC20 calls. Treat the documented address as
  a placeholder.
- The real aokrw token-pair ERC20 address is undocumented. A lead (unverified): WOKRW
  `0xb48eC2BD90c6F6Bbd7339037CB604560C73da915`. Revisit once the address is known. A transfer
  gate contract (`contracts/GwanmunGate.sol`) and proxy exist for that test but were not exercised.

## EAS_POLICY (excluded)

Reported, not verified by us: it requires a KYC attestation via kyc-testnet, which needs a Kakao
account and SMS verification, unavailable to a non-Korean audience. Excluded from v1.

## Quirks

- Proxy-wrapped calls report a flat 1,000,000 gas used regardless of the work done, for both
  successful and reverted calls.
- Blockscout returned `revert_reason=null` (`result=awaiting_internal_transactions`) for the
  reverted call. Decode reverts via `eth_call` or a replay with `publicClient.call`, not Blockscout.
- Supply an explicit `gas` on sends that may revert; gas estimation fails on a revert and the
  transaction would otherwise never be broadcast.
- VOLUME_POLICY simulation does not predict real behavior; DENYLIST simulation does.
