const listKey = (address: string) => `gwanmun.gates.${address.toLowerCase()}`;
const legacyKey = (address: string) => `gwanmun.gate.${address.toLowerCase()}`;
const isAddr = (v: unknown): v is `0x${string}` => typeof v === "string" && /^0x[0-9a-fA-F]{40}$/.test(v);

function dedupe(list: `0x${string}`[]) {
  const seen = new Set<string>();
  return list.filter((a) => {
    const k = a.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function write(address: string, list: `0x${string}`[]) {
  try {
    localStorage.setItem(listKey(address), JSON.stringify(list));
  } catch {
    /* storage unavailable; gates stay in memory for this session */
  }
}

/** Cached gates for an account. Migrates the old single-value key on first read. */
export function loadGates(address: string): `0x${string}`[] {
  let list: `0x${string}`[] = [];
  try {
    const raw = localStorage.getItem(listKey(address));
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) list = parsed.filter(isAddr);
    const legacy = localStorage.getItem(legacyKey(address));
    if (legacy) {
      if (isAddr(legacy)) list = [...list, legacy];
      localStorage.removeItem(legacyKey(address));
      write(address, dedupe(list));
    }
  } catch {
    /* ignore */
  }
  return dedupe(list);
}

export function addGates(address: string, proxies: `0x${string}`[]): `0x${string}`[] {
  const next = dedupe([...loadGates(address), ...proxies]);
  write(address, next);
  return next;
}

export function removeGate(address: string, proxy: string): `0x${string}`[] {
  const next = loadGates(address).filter((a) => a.toLowerCase() !== proxy.toLowerCase());
  write(address, next);
  return next;
}
