export interface SitemapPage {
  name: string;
  url: string;
  logo: string;
  logoUrl?: string;
  soon?: boolean;
  description?: string;
  keywords?: string[];
}

export interface SitemapSection {
  title: string;
  icon: string;
  pages: SitemapPage[];
}

export interface SitemapCategory {
  category: string;
  icon: string;
  sections: SitemapSection[];
}

export interface MinecraftHosting {
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
}

export interface VpsHosting {
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
}

export interface WebsiteHosting {
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
}

export interface DatabaseHosting {
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
}

export interface SearchItem {
  category: string;
  icon: string;
  title: string;
  sectionIcon: string;
  name: string;
  url: string;
  logo: string;
  logoUrl?: string;
  description?: string;
  keywords?: string[];
  soon?: boolean;
}

export type SocialPlatformName = "youtube" | "discord" | "instagram";

export interface SocialStat {
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
}

export interface SocialStats {
  updatedAt: string;
  platforms: Record<SocialPlatformName, SocialStat>;
}

export interface AppRecord {
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
}

export interface D1Result<T = unknown> {
  success: boolean;
  results?: T[];
  meta?: unknown;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

export interface SocialEnv {
  YOUTUBE_API_KEY?: string;
  YOUTUBE_HANDLE?: string;
  DISCORD_INVITE_CODE?: string;
  INSTAGRAM_ACCESS_TOKEN?: string;
  INSTAGRAM_USER_ID?: string;
  INSTAGRAM_USERNAME?: string;
  DB?: D1Database;
}
