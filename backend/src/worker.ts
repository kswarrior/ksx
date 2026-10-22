import { Hono } from "hono";
import { cors } from "hono/cors";
import { getSocialStats } from "./social.js";
import type {
  SitemapCategory,
  SearchItem,
  MinecraftHosting,
  VpsHosting,
  SocialEnv,
} from "./types.js";

// Vite/Workers JSON import — with nodejs_compat we can use import assertions
// For wrangler, use `import ... with {type:"json"}` or `import ... from "...json"` with bundler.
// We inline import via `import * as` fallback for compatibility.
import sitemapData from "./data/sitemap.json" with { type: "json" };
import mcData from "./data/minecraft-hosting.json" with { type: "json" };
import vpsData from "./data/vps-hosting.json" with { type: "json" };

const sitemap = sitemapData as SitemapCategory[];
const mcHosting = mcData as MinecraftHosting[];
const vpsHosting = vpsData as VpsHosting[];

const app = new Hono<{ Bindings: SocialEnv }>();

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
      "GET /api/hosting/minecraft?q=&uptime=&location=&ram=",
      "GET /api/hosting/vps?q=&renew=&sudo=&alwaysOn=",
      "GET /api/social",
    ],
  });
});

app.get("/api/social", async (c) => {
  const force = c.req.query("refresh") === "1";
  const stats = await getSocialStats(c.env, { force });
  c.header(
    "Cache-Control",
    force
      ? "no-store"
      : "public, max-age=300, s-maxage=300, stale-while-revalidate=600"
  );
  return c.json(stats);
});

// Server jar metadata proxy (keeps browser requests same-origin)
const SERVER_JAR_PROXY_HOSTS: Record<string, string[]> = {
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

function isAllowedServerJarProxy(target: URL, method: string): boolean {
  const prefixes = SERVER_JAR_PROXY_HOSTS[target.hostname];
  if (!prefixes || !prefixes.some((prefix) => target.pathname.startsWith(prefix))) return false;
  return method === "HEAD" || !/\.(jar|zip|gz|tar)$/i.test(target.pathname);
}

app.on(["GET", "HEAD"], "/api/server-jars/proxy", async (c) => {
  let target: URL;
  try {
    target = new URL(c.req.query("url") ?? "");
  } catch {
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
      if (value) headers.set(name, value);
    }
    headers.set("Cache-Control", "public, max-age=300, s-maxage=900");
    if (c.req.method === "HEAD") return new Response(null, { status: upstream.status, headers });
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch {
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
  } catch {
    return c.json({ error: "Modrinth request failed" }, 502);
  }
});

// MCPEDL API proxy (PE / Bedrock content)
const MCPEDL_API = "https://api.mcpedl.com/api";

app.get("/api/mcpedl/*", async (c) => {
  const upstreamPath = c.req.path.slice("/api/mcpedl".length);
  const search = new URL(c.req.url).search;
  try {
    const res = await fetch(`${MCPEDL_API}${upstreamPath}${search}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ksx-backend/1.0; +https://github.com/anomalyco/ksx)",
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
  } catch {
    return c.json({ error: "MCPEDL request failed" }, 502);
  }
});

// Sitemap
app.get("/api/sitemap", (c) => c.json(sitemap));

app.get("/api/sitemap/search", (c) => {
  const q = (c.req.query("q") ?? "").trim().toLowerCase();
  if (!q) return c.json([]);
  const flat: SearchItem[] = [];
  for (const cat of sitemap) {
    for (const sec of cat.sections) {
      for (const page of sec.pages) {
        flat.push({ category: cat.category, icon: cat.icon, title: sec.title, sectionIcon: sec.icon, name: page.name, url: page.url, logo: page.logo });
      }
    }
  }
  const matched = flat.filter(
    (i) => i.name.toLowerCase().includes(q) || i.title.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
  );
  return c.json(matched);
});

// Minecraft hosting
app.get("/api/hosting/minecraft", (c) => {
  const q = (c.req.query("q") ?? "").toLowerCase();
  const uptime = c.req.query("uptime") ?? "";
  const location = (c.req.query("location") ?? "").toLowerCase();
  const ramStr = c.req.query("ram");
  const ram = ramStr ? Number(ramStr) : 0;

  const filtered = mcHosting.filter((h) => {
    if (q && !String(h.name).toLowerCase().includes(q)) return false;
    if (uptime && h.uptime !== uptime) return false;
    if (location && !String(h.location).toLowerCase().includes(location)) return false;
    if (ram) {
      const hRam = Number(h.ram);
      if (isNaN(hRam) || hRam < ram) return false;
    }
    return true;
  });
  return c.json({ count: filtered.length, data: filtered });
});

app.get("/api/hosting/vps", (c) => {
  const q = (c.req.query("q") ?? "").toLowerCase();
  const renew = c.req.query("renew");
  const sudo = c.req.query("sudo");
  const alwaysOn = c.req.query("alwaysOn");

  let result = vpsHosting;
  if (q) result = result.filter((v) => v.name.toLowerCase().includes(q));
  if (renew !== undefined && renew !== "") result = result.filter((v) => v.renew === (renew === "true"));
  if (sudo !== undefined && sudo !== "") result = result.filter((v) => v.sudo === (sudo === "true"));
  if (alwaysOn !== undefined && alwaysOn !== "") result = result.filter((v) => v.alwaysOn === (alwaysOn === "true"));
  return c.json({ count: result.length, data: result });
});

// Legacy JSON paths for backward compat (old static fetch("free.json"))
app.get("/minecraft/hosting/free.json", (c) => c.json(mcHosting));
app.get("/vps/hosting/list/free.json", (c) => c.json(vpsHosting));
app.get("/sitemap.json", (c) => c.json(sitemap));

// Fallback for static assets: if `assets` binding is configured, Worker will serve `frontend/dist` automatically.
// For API 404s, return JSON. For SPA routes, serve index.html (supports client-side routing)
app.notFound(async (c) => {
  if (c.req.path.startsWith("/api/")) return c.json({ error: "Not found" }, 404);
  // SPA fallback: serve index.html via ASSETS binding when available
  try {
    // @ts-ignore - ASSETS is injected by Wrangler when [assets] is configured
    const assets = (c.env as any)?.ASSETS;
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
  } catch {}
  return c.text("Not found", 404);
});

export default app;
