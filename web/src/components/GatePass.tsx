export function GatePass({ state }: { state: "idle" | "pending" | "pass" | "block" }) {
  return (
    <div className="gate-pass" data-state={state} aria-hidden="true">
      <svg viewBox="0 0 240 40" preserveAspectRatio="xMidYMid meet">
        <line className="gp-track" x1="18" y1="20" x2="222" y2="20" />
        <path className="gp-gate" d="M108 30 V20 a12 12 0 0 1 24 0 V30" fill="none" />
        <circle className="gp-node" cx="18" cy="20" r="5" />
      </svg>
    </div>
  );
}
