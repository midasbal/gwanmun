export function Docs({ onHome }: { onHome: () => void }) {
  return (
    <section className="panel docs">
      <div className="row">
        <button type="button" className="btn btn-quiet btn-sm" onClick={onHome}>
          Back to home
        </button>
      </div>

      <article className="doc-section">
        <h2>What is this?</h2>
        <p>Gwanmun is a tool for setting and proving compliance rules on the Maroo testnet. You deploy a gate you control, bind a rule to it, and anyone can verify on-chain that Maroo enforces that rule. The name is the Korean word for a gateway or checkpoint (관문): a gate that controls what passes through.</p>
      </article>

      <article className="doc-section">
        <h2>What is a gate?</h2>
        <p>A gate is a small contract you deploy and own. Technically it is a Programmable Compliance Layer (PCL) proxy. Transactions routed through it are checked by the Maroo protocol before they execute. You are the gate's admin, so only you can change its rules. Deploying a gate is a real transaction on the Maroo testnet.</p>
      </article>

      <article className="doc-section">
        <h2>What is a denylist?</h2>
        <p>A denylist is the rule you bind to your gate: a set of addresses that are not allowed to transact through it. The Maroo protocol enforces it on both sides of a transfer. A denylisted address cannot initiate a transaction through your gate, and cannot receive value through it. When a transaction would involve a denylisted address, the chain rejects it with an InDenylist error. You can add or remove addresses at any time, and each change is a real transaction.</p>
      </article>

      <article className="doc-section">
        <h2>How the denylist is enforced</h2>
        <p>Every transaction routed through the gate is evaluated by the Programmable Compliance Layer before it executes. For a gate whose denylist contains an address D, the outcome is:</p>
        <table className="doc-table">
          <thead>
            <tr>
              <th>Sender on denylist</th>
              <th>Sends value to a denylisted address</th>
              <th>Outcome</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>No</td><td>No</td><td>Allowed</td></tr>
            <tr><td>No</td><td>Yes</td><td>Rejected, InDenylist</td></tr>
            <tr><td>Yes</td><td>No</td><td>Rejected, InDenylist</td></tr>
            <tr><td>Yes</td><td>Yes</td><td>Rejected, InDenylist</td></tr>
          </tbody>
        </table>
        <p className="doc-note">A transaction is allowed only when neither side involves a denylisted address. A zero-value call that merely names a denylisted address as its target, without sending value to it, is allowed. The revert is InDenylist(address), and the address it names is the denylisted party involved, which may be the sender or the recipient.</p>
      </article>

      <article className="doc-section">
        <h2>Why this matters, and why Maroo</h2>
        <p>On most chains, compliance is enforced by the application. You have to trust an app's front end or server to apply the rule, and the chain itself knows nothing about it. Maroo builds programmable compliance into the L1 through the PCL. The rule you set is enforced by the protocol, at the moment of execution, for any transaction routed through your gate, no matter which interface sends it. Gwanmun is a way to set such a rule and to show, on-chain, that it holds.</p>
      </article>

      <article className="doc-section">
        <h2>Is this real? How to verify</h2>
        <p>Everything Gwanmun shows is read directly from the Maroo chain. Your gate, its admin, and its denylist all live on-chain and are visible in the block explorer. Each claim can be checked independently:</p>
        <table className="doc-table">
          <thead>
            <tr><th>Claim</th><th>How to verify</th></tr>
          </thead>
          <tbody>
            <tr><td>Your gate exists and you are its admin</td><td>Open the gate in the block explorer</td></tr>
            <tr><td>An address is on the denylist</td><td>Expand On-chain details and read the decoded denylist</td></tr>
            <tr><td>The chain blocks a denylisted address</td><td>Use the address checker, which runs a free, gasless eth_call, or send a transaction and read the InDenylist revert</td></tr>
          </tbody>
        </table>
      </article>
    </section>
  );
}
