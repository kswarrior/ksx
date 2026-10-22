import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }, [key, value]);

  return [value, setValue] as const;
}

export type RecentItem = { name: string; url: string; time: number; logo?: string; category?: string; title?: string };
export type PinItem = { name: string; url: string; time: number; logo?: string; category?: string; title?: string };

export const RECENT_KEY = "ks-web-recent";
export const PIN_KEY = "ks-web-pin";
export const LEGACY_FAV_KEY = "ks-web-fav";
export const LAST_PAGE_KEY = "ks-web-last-page";
export const MAX_RECENT = 3;

export function readPins(): PinItem[] {
  try {
    const raw = localStorage.getItem(PIN_KEY);
    if (raw) return JSON.parse(raw);
    const legacy = localStorage.getItem(LEGACY_FAV_KEY);
    if (legacy) {
      localStorage.setItem(PIN_KEY, legacy);
      return JSON.parse(legacy);
    }
  } catch {}
  return [];
}
