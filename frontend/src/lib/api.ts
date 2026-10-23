export type SitemapCategory = {
  category: string;
  icon: string;
  sections: {
    title: string;
    icon: string;
    pages: { name: string; url: string; logo: string; logoUrl?: string; soon?: boolean }[];
  }[];
};

export type SearchItem = {
  category: string;
  icon: string;
  title: string;
  sectionIcon: string;
  name: string;
  url: string;
  logo: string;
  logoUrl?: string;
};

export type MinecraftHosting = {
  name: string;
  logo: string;
  ram: number | string;
  cpu: string;
  disk: string;
  players: string;
  location: string;
  uptime: string;
  alwaysOn: boolean;
  verification: string;
  limits: string;
  notes: string;
  link: string;
};

export type VpsHosting = {
  name: string;
  logo: string;
  type: string;
  ram: number | string;
  cpu: string;
  disk: string;
  renew: boolean;
  sudo: boolean;
  alwaysOn: boolean;
  location: string;
  verification: string;
  limits: string;
  notes: string;
  link: string;
};

export type WebsiteHosting = {
  name: string;
  logo: string;
  type: string;
  storage: string;
  bandwidth: string;
  sites: string;
  database: string;
  customDomain: boolean;
  ssl: boolean;
  ads: boolean;
  alwaysFree: boolean;
  verification: string;
  limits: string;
  notes: string;
  link: string;
};

export type DatabaseHosting = {
  name: string;
  logo: string;
  type: string;
  storage: string;
  transfer: string;
  databases: string;
  region: string;
  backups: string;
  ssl: boolean;
  cardRequired: boolean;
  alwaysFree: boolean;
  verification: string;
  limits: string;
  notes: string;
  link: string;
};

export type StoreApp = {
  slug: string;
  name: string;
  owner: string;
  platform: string;
  version: string;
  downloadUrl: string;
  pageUrl?: string;
  category?: string;
  tagline?: string;
  description?: string;
  tags?: string[];
  icon?: string;
  screenshot?: string;
  requires?: string;
  price?: string;
  featured?: boolean;
};

export type AppVersionStats = {
  version: string;
  downloads: number;
  current: boolean;
  lastDownloadAt: string | null;
};

export type AppStats = {
  slug: string;
  name?: string;
  version?: string;
  platform?: string;
  downloads: number | null;
  currentDownloads?: number | null;
  versions?: AppVersionStats[];
  available: boolean;
  reason?: string;
  error?: string;
};

export type SocialPlatformName = "youtube" | "discord" | "instagram";

export type SocialStat = {
  platform: SocialPlatformName;
  url: string;
  handle: string;
  label: "subscribers" | "members" | "followers";
  count: number | null;
  display: string | null;
  available: boolean;
  source:
    | "youtube-api"
    | "youtube-page"
    | "discord-invite"
    | "instagram-graph"
    | "instagram-public"
    | "unavailable";
  online?: number | null;
  name?: string;
  error?: string;
  fetchedAt: string;
};

export type SocialStats = {
  updatedAt: string;
  platforms: Record<SocialPlatformName, SocialStat>;
};

export const API_BASE = import.meta.env.VITE_API_BASE ?? "";

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
  getWebsiteHosting: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return fetchJson<{ count: number; data: WebsiteHosting[] }>(
      `/api/hosting/website${qs}`
    );
  },
  getDatabaseHosting: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return fetchJson<{ count: number; data: DatabaseHosting[] }>(
      `/api/hosting/database${qs}`
    );
  },
  getApps: () =>
    fetchJson<{ count: number; data: StoreApp[] }>("/api/apps"),
  getAppStats: (slug: string) =>
    fetchJson<AppStats>(`/api/apps/${encodeURIComponent(slug)}/stats`),
  getSocialStats: (refresh = false) =>
    fetchJson<SocialStats>(`/api/social${refresh ? "?refresh=1" : ""}`),
};
