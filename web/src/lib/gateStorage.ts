const key = (address: string) => `gwanmun.gate.${address.toLowerCase()}`;

export function loadGate(address: string): `0x${string}` | null {
  try {
    const v = localStorage.getItem(key(address));
    return v && /^0x[0-9a-fA-F]{40}$/.test(v) ? (v as `0x${string}`) : null;
  } catch {
    return null;
  }
}

export function saveGate(address: string, proxy: string) {
  try {
    localStorage.setItem(key(address), proxy);
  } catch {
    /* storage unavailable; the gate is still shown for this session */
  }
}

export function clearGate(address: string) {
  try {
    localStorage.removeItem(key(address));
  } catch {
    /* ignore */
  }
}
