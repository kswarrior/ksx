import { Hono } from "hono";
import { cors } from "hono/cors";
import { getSocialStats } from "./social.js";
// Vite/Workers JSON import — with nodejs_compat we can use import assertions
// For wrangler, use `import ... with {type:"json"}` or `import ... from "...json"` with bundler.
// We inline import via `import * as` fallback for compatibility.
import sitemapData from "./data/sitemap.json" with { type: "json" };
import mcData from "./data/minecraft-hosting.json" with { type: "json" };
import vpsData from "./data/vps-hosting.json" with { type: "json" };
import websiteData from "./data/website-hosting.json" with { type: "json" };
import databaseData from "./data/database-hosting.json" with { type: "json" };
import appsData from "./data/apps.json" with { type: "json" };
const sitemap = sitemapData;
const mcHosting = mcData;
const vpsHosting = vpsData;
const websiteHosting = websiteData;
const databaseHosting = databaseData;
const apps = appsData;
const CREATE_APPS_TABLE = `
  CREATE TABLE IF NOT EXISTS apps (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner TEXT NOT NULL,
    platform TEXT NOT NULL,
    version TEXT NOT NULL,
    download_url TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`;
const CREATE_DOWNLOADS_TABLE = `
  CREATE TABLE IF NOT EXISTS app_downloads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_slug TEXT NOT NULL,
    version TEXT NOT NULL,
    platform TEXT NOT NULL,
    download_url TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    country TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (app_slug) REFERENCES apps(slug)
  )
`;
const CREATE_DOWNLOADS_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_app_downloads_app_created
  ON app_downloads (app_slug, created_at DESC)
`;
let appDbReady = null;
async function ensureAppDb(db) {
    if (!appDbReady) {
        appDbReady = (async () => {
            await db.batch([
                db.prepare(CREATE_APPS_TABLE),
                db.prepare(CREATE_DOWNLOADS_TABLE),
                db.prepare(CREATE_DOWNLOADS_INDEX),
            ]);
            for (const app of apps) {
                await db
                    .prepare(`INSERT INTO apps (slug, name, owner, platform, version, download_url, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
             ON CONFLICT(slug) DO UPDATE SET
               name = excluded.name,
               owner = excluded.owner,
               platform = excluded.platform,
               version = excluded.version,
               download_url = excluded.download_url,
               updated_at = datetime('now')`)
                    .bind(app.slug, app.name, app.owner, app.platform, app.version, app.downloadUrl)
                    .run();
            }
        })().catch((error) => {
            appDbReady = null;
            throw error;
        });
    }
    return appDbReady;
}
const app = new Hono();
// Global middleware
app.use("*", cors({ origin: "*", allowMethods: ["GET", "POST", "OPTIONS"], allowHeaders: ["Content-Type"] }));
// Health
app.get("/api/health", (c) => {
    return c.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.get("/api/stats", (c) => {
    return c.json({
        name: "KSX API",
        version: "1.0.0",
        description: "KS Warrior Backend (Cloudflare Worker)",
        endpoints: [
            "GET /api/health",
            "GET /api/sitemap",
            "GET /api/sitemap/search?q=",
            "GET /api/hosting/minecraft?q=&uptime=&alwaysOn=&location=&ram=",
            "GET /api/hosting/vps?q=&type=&renew=&sudo=&alwaysOn=",
            "GET /api/hosting/website?q=&type=&customDomain=&ssl=&ads=&alwaysFree=",
            "GET /api/hosting/database?q=&type=&cardRequired=&backups=&alwaysFree=&ssl=",
            "GET /api/apps/:slug/stats",
            "POST /api/apps/:slug/download",
            "GET /api/social",
        ],
    });
});
app.get("/api/social", async (c) => {
    const force = c.req.query("refresh") === "1";
    const stats = await getSocialStats(c.env, { force });
    c.header("Cache-Control", force
        ? "no-store"
        : "public, max-age=300, s-maxage=300, stale-while-revalidate=600");
    return c.json(stats);
});
// Server jar metadata proxy (keeps browser requests same-origin)
const SERVER_JAR_PROXY_HOSTS = {
    "fill.papermc.io": ["/v3/"],
    "api.purpurmc.org": ["/v2/purpur"],
    "launchermeta.mojang.com": ["/mc/"],
    "piston-meta.mojang.com": ["/v1/packages/"],
    "meta.fabricmc.net": ["/v2/"],
    "meta.quiltmc.org": ["/v3/"],
    "maven.minecraftforge.net": ["/net/minecraftforge/forge/"],
    "maven.neoforged.net": ["/api/maven/versions/", "/releases/net/neoforged/neoforge/"],
    "maven.quiltmc.org": ["/repository/release/"],
    "getbukkit.org": ["/api/jars/"],
    "download.getbukkit.org": ["/spigot/"],
    "fill-data.papermc.io": ["/v1/objects/"],
    "piston-data.mojang.com": ["/v1/objects/"],
};
function isAllowedServerJarProxy(target, method) {
    const prefixes = SERVER_JAR_PROXY_HOSTS[target.hostname];
    if (!prefixes || !prefixes.some((prefix) => target.pathname.startsWith(prefix)))
        return false;
    return method === "HEAD" || !/\.(jar|zip|gz|tar)$/i.test(target.pathname);
}
app.on(["GET", "HEAD"], "/api/server-jars/proxy", async (c) => {
    let target;
    try {
        target = new URL(c.req.query("url") ?? "");
    }
    catch {
        return c.json({ error: "Invalid URL" }, 400);
    }
    if (target.protocol !== "https:" || !isAllowedServerJarProxy(target, c.req.method)) {
        return c.json({ error: "URL not allowed" }, 400);
    }
    try {
        const upstream = await fetch(target, {
            method: c.req.method,
            headers: {
                "User-Agent": "ksx-backend/1.0 (+https://github.com/anomalyco/ksx)",
                Accept: c.req.header("accept") ?? "*/*",
            },
        });
        const headers = new Headers();
        for (const name of ["content-type", "content-length", "last-modified", "etag"]) {
            const value = upstream.headers.get(name);
            if (value)
                headers.set(name, value);
        }
        headers.set("Cache-Control", "public, max-age=300, s-maxage=900");
        if (c.req.method === "HEAD")
            return new Response(null, { status: upstream.status, headers });
        return new Response(upstream.body, { status: upstream.status, headers });
    }
    catch {
        return c.json({ error: "Server jar request failed" }, 502);
    }
});
// Modrinth API proxy (avoids browser CORS/network restrictions)
const MODRINTH_API = "https://api.modrinth.com/v2";
app.get("/api/modrinth/*", async (c) => {
    const upstreamPath = c.req.path.slice("/api/modrinth".length);
    const search = new URL(c.req.url).search;
    try {
        const res = await fetch(`${MODRINTH_API}${upstreamPath}${search}`, {
            headers: {
                "User-Agent": "ksx-backend/1.0 (+https://github.com/anomalyco/ksx)",
                Accept: "application/json",
            },
        });
        return new Response(res.body, {
            status: res.status,
            headers: {
                "Content-Type": res.headers.get("content-type") ?? "application/json",
                "Cache-Control": "public, max-age=60, s-maxage=120",
            },
        });
    }
    catch {
        return c.json({ error: "Modrinth request failed" }, 502);
    }
});
// MCPEDL API proxy (PE / Bedrock content)
const MCPEDL_API = "https://api.mcpedl.com/api";
const MCPEDL_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const MCPEDL_HEADERS = {
    "User-Agent": MCPEDL_UA,
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: "https://mcpedl.com/",
    Origin: "https://mcpedl.com",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
};
function translateProxyUrl(url) {
    const target = new URL(url);
    const proxy = new URL(`https://${target.hostname.replace(/\./g, "-")}.translate.goog${target.pathname}`);
    target.searchParams.forEach((value, key) => proxy.searchParams.set(key, value));
    proxy.searchParams.set("_x_tr_sl", "auto");
    proxy.searchParams.set("_x_tr_tl", "en");
    proxy.searchParams.set("_x_tr_hl", "en");
    return proxy.toString();
}
async function fetchMcpedl(url) {
    const direct = await fetch(url, {
        headers: MCPEDL_HEADERS,
        cf: { scrapeShield: false },
    });
    if (direct.status !== 403 && direct.status !== 429)
        return direct;
    try {
        const fallback = await fetch(translateProxyUrl(url), {
            headers: { "User-Agent": MCPEDL_UA, Accept: "application/json" },
        });
        if (fallback.ok)
            return fallback;
    }
    catch {
        // keep the upstream response
    }
    return direct;
}
app.get("/api/mcpedl/*", async (c) => {
    const upstreamPath = c.req.path.slice("/api/mcpedl".length);
    const search = new URL(c.req.url).search;
    try {
        const res = await fetchMcpedl(`${MCPEDL_API}${upstreamPath}${search}`);
        const headers = new Headers();
        headers.set("Content-Type", res.headers.get("content-type") ?? "application/json");
        headers.set("Cache-Control", res.ok ? "public, max-age=60, s-maxage=120" : "no-store");
        return new Response(res.body, { status: res.status, headers });
    }
    catch {
        return c.json({ error: "MCPEDL request failed" }, 502);
    }
});
// Sitemap
app.get("/api/sitemap", (c) => c.json(sitemap));
app.get("/api/sitemap/search", (c) => {
    const q = (c.req.query("q") ?? "").trim().toLowerCase();
    if (!q)
        return c.json([]);
    const flat = [];
    for (const cat of sitemap) {
        for (const sec of cat.sections) {
            for (const page of sec.pages) {
                flat.push({ category: cat.category, icon: cat.icon, title: sec.title, sectionIcon: sec.icon, name: page.name, url: page.url, logo: page.logo, logoUrl: page.logoUrl });
            }
        }
    }
    const matched = flat.filter((i) => i.name.toLowerCase().includes(q) || i.title.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    return c.json(matched);
});
// App download tracking (Cloudflare D1)
app.post("/api/apps/:slug/download", async (c) => {
    const slug = c.req.param("slug");
    const app = apps.find((item) => item.slug === slug);
    if (!app)
        return c.json({ error: "Unknown app" }, 404);
    const db = c.env.DB;
    if (!db) {
        return c.json({
            ok: true,
            recorded: false,
            reason: "D1 binding DB is not configured",
        });
    }
    let body = {};
    try {
        body = await c.req.json();
    }
    catch {
        /* body is optional */
    }
    const version = String(body.version ?? app.version).slice(0, 40);
    const platform = String(body.platform ?? app.platform).slice(0, 40);
    const referrer = c.req.header("referer")?.slice(0, 512) ?? null;
    const userAgent = c.req.header("user-agent")?.slice(0, 512) ?? null;
    const country = c.req.header("cf-ipcountry")?.slice(0, 8) ?? null;
    try {
        await ensureAppDb(db);
        await db
            .prepare(`INSERT INTO app_downloads
          (app_slug, version, platform, download_url, referrer, user_agent, country)
         VALUES (?, ?, ?, ?, ?, ?, ?)`)
            .bind(app.slug, version, platform, app.downloadUrl, referrer, userAgent, country)
            .run();
        return c.json({ ok: true, recorded: true });
    }
    catch (error) {
        return c.json({
            ok: false,
            recorded: false,
            error: error instanceof Error ? error.message : "D1 insert failed",
        }, 500);
    }
});
app.get("/api/apps/:slug/stats", async (c) => {
    const slug = c.req.param("slug");
    const app = apps.find((item) => item.slug === slug);
    if (!app)
        return c.json({ error: "Unknown app" }, 404);
    c.header("Cache-Control", "no-store");
    const db = c.env.DB;
    if (!db) {
        return c.json({
            slug: app.slug,
            name: app.name,
            version: app.version,
            platform: app.platform,
            downloads: null,
            available: false,
            reason: "D1 binding DB is not configured",
        });
    }
    try {
        await ensureAppDb(db);
        const row = await db
            .prepare("SELECT COUNT(*) AS downloads FROM app_downloads WHERE app_slug = ?")
            .bind(app.slug)
            .first();
        return c.json({
            slug: app.slug,
            name: app.name,
            version: app.version,
            platform: app.platform,
            downloads: Number(row?.downloads ?? 0),
            available: true,
        });
    }
    catch (error) {
        return c.json({
            slug: app.slug,
            name: app.name,
            version: app.version,
            platform: app.platform,
            downloads: null,
            available: false,
            error: error instanceof Error ? error.message : "D1 query failed",
        }, 500);
    }
});
// Minecraft hosting
app.get("/api/hosting/minecraft", (c) => {
    const q = (c.req.query("q") ?? "").toLowerCase();
    const uptime = c.req.query("uptime") ?? "";
    const alwaysOn = c.req.query("alwaysOn");
    const location = (c.req.query("location") ?? "").toLowerCase();
    const ramStr = c.req.query("ram");
    const ram = ramStr ? Number(ramStr) : 0;
    const filtered = mcHosting.filter((h) => {
        if (q && !String(h.name).toLowerCase().includes(q))
            return false;
        if (uptime && h.uptime !== uptime)
            return false;
        if (alwaysOn !== undefined && alwaysOn !== "" && h.alwaysOn !== (alwaysOn === "true"))
            return false;
        if (location && !String(h.location).toLowerCase().includes(location))
            return false;
        if (ram) {
            const hRam = Number(h.ram);
            if (isNaN(hRam) || hRam < ram)
                return false;
        }
        return true;
    });
    return c.json({ count: filtered.length, data: filtered });
});
app.get("/api/hosting/vps", (c) => {
    const q = (c.req.query("q") ?? "").toLowerCase();
    const type = (c.req.query("type") ?? "").toLowerCase();
    const renew = c.req.query("renew");
    const sudo = c.req.query("sudo");
    const alwaysOn = c.req.query("alwaysOn");
    let result = vpsHosting;
    if (q)
        result = result.filter((v) => v.name.toLowerCase().includes(q));
    if (type)
        result = result.filter((v) => v.type.toLowerCase().includes(type));
    if (renew !== undefined && renew !== "")
        result = result.filter((v) => v.renew === (renew === "true"));
    if (sudo !== undefined && sudo !== "")
        result = result.filter((v) => v.sudo === (sudo === "true"));
    if (alwaysOn !== undefined && alwaysOn !== "")
        result = result.filter((v) => v.alwaysOn === (alwaysOn === "true"));
    return c.json({ count: result.length, data: result });
});
app.get("/api/hosting/website", (c) => {
    const q = (c.req.query("q") ?? "").toLowerCase();
    const type = (c.req.query("type") ?? "").toLowerCase();
    const customDomain = c.req.query("customDomain");
    const ssl = c.req.query("ssl");
    const ads = c.req.query("ads");
    const alwaysFree = c.req.query("alwaysFree");
    let result = websiteHosting;
    if (q)
        result = result.filter((h) => h.name.toLowerCase().includes(q));
    if (type)
        result = result.filter((h) => h.type.toLowerCase().includes(type));
    if (customDomain !== undefined && customDomain !== "")
        result = result.filter((h) => h.customDomain === (customDomain === "true"));
    if (ssl !== undefined && ssl !== "")
        result = result.filter((h) => h.ssl === (ssl === "true"));
    if (ads !== undefined && ads !== "")
        result = result.filter((h) => h.ads === (ads === "true"));
    if (alwaysFree !== undefined && alwaysFree !== "")
        result = result.filter((h) => h.alwaysFree === (alwaysFree === "true"));
    return c.json({ count: result.length, data: result });
});
app.get("/api/hosting/database", (c) => {
    const q = (c.req.query("q") ?? "").toLowerCase();
    const type = (c.req.query("type") ?? "").toLowerCase();
    const cardRequired = c.req.query("cardRequired");
    const backups = c.req.query("backups");
    const alwaysFree = c.req.query("alwaysFree");
    const ssl = c.req.query("ssl");
    let result = databaseHosting;
    if (q)
        result = result.filter((h) => h.name.toLowerCase().includes(q));
    if (type)
        result = result.filter((h) => h.type.toLowerCase().includes(type));
    if (cardRequired !== undefined && cardRequired !== "")
        result = result.filter((h) => h.cardRequired === (cardRequired === "true"));
    if (backups !== undefined && backups !== "") {
        const hasBackups = backups === "true";
        result = result.filter((h) => (h.backups !== "None") === hasBackups);
    }
    if (alwaysFree !== undefined && alwaysFree !== "")
        result = result.filter((h) => h.alwaysFree === (alwaysFree === "true"));
    if (ssl !== undefined && ssl !== "")
        result = result.filter((h) => h.ssl === (ssl === "true"));
    return c.json({ count: result.length, data: result });
});
// Legacy JSON paths for backward compat (old static fetch("free.json"))
app.get("/minecraft/hosting/free.json", (c) => c.json(mcHosting));
app.get("/vps/hosting/list/free.json", (c) => c.json(vpsHosting));
app.get("/website/hosting/list/free.json", (c) => c.json(websiteHosting));
app.get("/database/hosting/list/free.json", (c) => c.json(databaseHosting));
app.get("/sitemap.json", (c) => c.json(sitemap));
// Fallback for static assets: if `assets` binding is configured, Worker will serve `frontend/dist` automatically.
// For API 404s, return JSON. For SPA routes, serve index.html (supports client-side routing)
app.notFound(async (c) => {
    if (c.req.path.startsWith("/api/"))
        return c.json({ error: "Not found" }, 404);
    // SPA fallback: serve index.html via ASSETS binding when available
    try {
        // @ts-ignore - ASSETS is injected by Wrangler when [assets] is configured
        const assets = c.env?.ASSETS;
        if (assets) {
            const url = new URL(c.req.url);
            const indexReq = new Request(new URL("/index.html", url.origin).toString());
            const res = await assets.fetch(indexReq);
            if (res) {
                const body = await res.arrayBuffer();
                return new Response(body, {
                    status: 200,
                    headers: {
                        "Content-Type": "text/html;charset=utf-8",
                        "Cache-Control": "no-cache",
                    },
                });
            }
        }
    }
    catch { }
    return c.text("Not found", 404);
});
export default app;
