export type SitemapCategory = {
  category: string;
  icon: string;
  sections: {
    title: string;
    icon: string;
    pages: { name: string; url: string; logo: string }[];
  }[];
};

export type SearchItem = {
  category: string;
  icon: string;
  title: string;
  name: string;
  url: string;
};

export type MinecraftHosting = {
  name: string;
  ram: number | string;
  cpu: string;
  disk: string;
  location: string;
  uptime: string;
  link: string;
};

export type VpsHosting = {
  name: string;
  ram: number | string;
  cpu: string;
  disk: string;
  renew: boolean;
  sudo: boolean;
  alwaysOn: boolean;
  location: string;
  link: string;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json() as Promise<T>;
}

export const api = {
  getSitemap: () => fetchJson<SitemapCategory[]>("/api/sitemap"),
  search: (q: string) =>
    fetchJson<SearchItem[]>(`/api/sitemap/search?q=${encodeURIComponent(q)}`),
  getMinecraftHosting: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return fetchJson<{ count: number; data: MinecraftHosting[] }>(
      `/api/hosting/minecraft${qs}`
    );
  },
  getVpsHosting: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return fetchJson<{ count: number; data: VpsHosting[] }>(
      `/api/hosting/vps${qs}`
    );
  },
};
