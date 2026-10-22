export function readSession<T>(key: string): T | null {
  if (!key) return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeSession<T>(key: string, value: T): void {
  if (!key) return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage may be full or unavailable
  }
}
