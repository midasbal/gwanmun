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

// Gates the user hid with "Remove from my list". Kept separately so on-chain recovery
// cannot bring them back. Addresses are stored lowercased.
const dismissedKey = (address: string) => `gwanmun.dismissed.${address.toLowerCase()}`;

function writeDismissed(address: string, list: string[]) {
  try {
    localStorage.setItem(dismissedKey(address), JSON.stringify(list));
  } catch {
    /* storage unavailable; the gate is hidden for this session only */
  }
}

export function loadDismissed(address: string): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(dismissedKey(address)) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((a): a is string => typeof a === "string" && isAddr(a)).map((a) => a.toLowerCase()) : [];
  } catch {
    return [];
  }
}

export function addDismissed(address: string, proxy: string): string[] {
  const next = Array.from(new Set([...loadDismissed(address), proxy.toLowerCase()]));
  writeDismissed(address, next);
  return next;
}

export function removeDismissed(address: string, proxy: string): string[] {
  const next = loadDismissed(address).filter((a) => a !== proxy.toLowerCase());
  writeDismissed(address, next);
  return next;
}
