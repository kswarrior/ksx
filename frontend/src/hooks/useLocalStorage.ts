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

export type RecentItem = { name: string; url: string; time: number };
export type FavItem = { name: string; url: string; time: number };

export const RECENT_KEY = "ks-web-recent";
export const FAV_KEY = "ks-web-fav";
export const LAST_PAGE_KEY = "ks-web-last-page";
export const MAX_RECENT = 5;
