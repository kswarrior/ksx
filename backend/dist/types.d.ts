export interface SitemapPage {
    name: string;
    url: string;
    logo: string;
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
    ram: number | string;
    cpu: string;
    disk: string;
    location: string;
    uptime: string;
    link: string;
}
export interface VpsHosting {
    name: string;
    ram: number | string;
    cpu: string;
    disk: string;
    renew: boolean;
    sudo: boolean;
    alwaysOn: boolean;
    location: string;
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
    source: "youtube-api" | "youtube-page" | "discord-invite" | "instagram-graph" | "instagram-public" | "unavailable";
    online?: number | null;
    name?: string;
    error?: string;
    fetchedAt: string;
}
export interface SocialStats {
    updatedAt: string;
    platforms: Record<SocialPlatformName, SocialStat>;
}
export interface SocialEnv {
    YOUTUBE_API_KEY?: string;
    YOUTUBE_HANDLE?: string;
    DISCORD_INVITE_CODE?: string;
    INSTAGRAM_ACCESS_TOKEN?: string;
    INSTAGRAM_USER_ID?: string;
    INSTAGRAM_USERNAME?: string;
}
