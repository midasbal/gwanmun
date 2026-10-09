import { useState } from "react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <button type="button" className="btn btn-quiet btn-sm" onClick={copy} aria-label={`${label} to clipboard`}>
      {copied ? "Copied" : label}
    </button>
  );
}
