import { Hono } from "hono";
import { cors } from "hono/cors";
// Vite/Workers JSON import — with nodejs_compat we can use import assertions
// For wrangler, use `import ... with {type:"json"}` or `import ... from "...json"` with bundler.
// We inline import via `import * as` fallback for compatibility.
import sitemapData from "./data/sitemap.json" with { type: "json" };
import mcData from "./data/minecraft-hosting.json" with { type: "json" };
import vpsData from "./data/vps-hosting.json" with { type: "json" };
const sitemap = sitemapData;
const mcHosting = mcData;
const vpsHosting = vpsData;
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
            "GET /api/hosting/minecraft?q=&uptime=&location=&ram=",
            "GET /api/hosting/vps?q=&renew=&sudo=&alwaysOn=",
        ],
    });
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
                flat.push({ category: cat.category, icon: cat.icon, title: sec.title, name: page.name, url: page.url });
            }
        }
    }
    const matched = flat.filter((i) => i.name.toLowerCase().includes(q) || i.title.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
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
        if (q && !String(h.name).toLowerCase().includes(q))
            return false;
        if (uptime && h.uptime !== uptime)
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
    const renew = c.req.query("renew");
    const sudo = c.req.query("sudo");
    const alwaysOn = c.req.query("alwaysOn");
    let result = vpsHosting;
    if (q)
        result = result.filter((v) => v.name.toLowerCase().includes(q));
    if (renew !== undefined && renew !== "")
        result = result.filter((v) => v.renew === (renew === "true"));
    if (sudo !== undefined && sudo !== "")
        result = result.filter((v) => v.sudo === (sudo === "true"));
    if (alwaysOn !== undefined && alwaysOn !== "")
        result = result.filter((v) => v.alwaysOn === (alwaysOn === "true"));
    return c.json({ count: result.length, data: result });
});
// Legacy JSON paths for backward compat (old static fetch("free.json"))
app.get("/minecraft/hosting/free.json", (c) => c.json(mcHosting));
app.get("/vps/hosting/list/free.json", (c) => c.json(vpsHosting));
app.get("/sitemap.json", (c) => c.json(sitemap));
// Fallback for static assets: if `assets` binding is configured, Worker will serve `frontend/dist` automatically.
// For API 404s, return JSON
app.notFound((c) => {
    if (c.req.path.startsWith("/api/"))
        return c.json({ error: "Not found" }, 404);
    return c.text("Not found", 404);
});
export default app;
