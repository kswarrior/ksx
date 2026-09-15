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
    name: string;
    url: string;
}
