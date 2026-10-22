import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import sitemapRouter from "./routes/sitemap.js";
import hostingRouter from "./routes/hosting.js";
import metaRouter from "./routes/meta.js";
import sitemapData from "./data/sitemap.json" with { type: "json" };
import mcData from "./data/minecraft-hosting.json" with { type: "json" };
import vpsData from "./data/vps-hosting.json" with { type: "json" };

const app = express();
const PORT = Number(process.env.PORT ?? 8080);

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());

// API routes
app.use("/api/sitemap", sitemapRouter);
app.use("/api/hosting", hostingRouter);
app.use("/api", metaRouter);

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

app.get("/api/server-jars/proxy", async (req, res) => {
  let target: URL;
  try {
    target = new URL(String(req.query.url ?? ""));
  } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }
  if (target.protocol !== "https:" || !isAllowedServerJarProxy(target, req.method)) {
    res.status(400).json({ error: "URL not allowed" });
    return;
  }
  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: {
        "User-Agent": "ksx-backend/1.0 (+https://github.com/anomalyco/ksx)",
        Accept: req.headers.accept ?? "*/*",
      },
    });
    res.status(upstream.status);
    for (const name of ["content-type", "content-length", "last-modified", "etag"]) {
      const value = upstream.headers.get(name);
      if (value) res.setHeader(name, value);
    }
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=900");
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    res.status(502).json({ error: "Server jar request failed" });
  }
});

// Modrinth API proxy (avoids browser CORS/network restrictions)
const MODRINTH_API = "https://api.modrinth.com/v2";

app.get("/api/modrinth/*", async (req, res) => {
  const upstreamPath = req.originalUrl.slice("/api/modrinth".length);
  try {
    const upstream = await fetch(`${MODRINTH_API}${upstreamPath}`, {
      headers: {
        "User-Agent": "ksx-backend/1.0 (+https://github.com/anomalyco/ksx)",
        Accept: "application/json",
      },
    });
    res.status(upstream.status);
    res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "application/json");
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=120");
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    res.status(502).json({ error: "Modrinth request failed" });
  }
});

// MCPEDL API proxy (PE / Bedrock content)
const MCPEDL_API = "https://api.mcpedl.com/api";
const MCPEDL_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

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

function translateProxyUrl(url: string): string {
  const target = new URL(url);
  const proxy = new URL(
    `https://${target.hostname.replace(/\./g, "-")}.translate.goog${target.pathname}`
  );
  target.searchParams.forEach((value, key) => proxy.searchParams.set(key, value));
  proxy.searchParams.set("_x_tr_sl", "auto");
  proxy.searchParams.set("_x_tr_tl", "en");
  proxy.searchParams.set("_x_tr_hl", "en");
  return proxy.toString();
}

async function fetchMcpedl(url: string): Promise<Response> {
  const direct = await fetch(url, { headers: MCPEDL_HEADERS });
  if (direct.status !== 403 && direct.status !== 429) return direct;
  try {
    const fallback = await fetch(translateProxyUrl(url), {
      headers: { "User-Agent": MCPEDL_UA, Accept: "application/json" },
    });
    if (fallback.ok) return fallback;
  } catch {
    // keep the upstream response
  }
  return direct;
}

app.get("/api/mcpedl/*", async (req, res) => {
  const upstreamPath = req.originalUrl.slice("/api/mcpedl".length);
  try {
    const upstream = await fetchMcpedl(`${MCPEDL_API}${upstreamPath}`);
    res.status(upstream.status);
    res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "application/json");
    res.setHeader(
      "Cache-Control",
      upstream.ok ? "public, max-age=60, s-maxage=120" : "no-store"
    );
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    res.status(502).json({ error: "MCPEDL request failed" });
  }
});

// Legacy JSON for old static fetch("free.json") compatibility
app.get("/minecraft/hosting/free.json", (_req, res) => res.json(mcData));
app.get("/vps/hosting/list/free.json", (_req, res) => res.json(vpsData));
app.get("/sitemap.json", (_req, res) => res.json(sitemapData));

// Serve frontend in production (if built)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.resolve(__dirname, "../../frontend/dist");
if (fs.existsSync(frontendDist)) {
  app.use(
    express.static(frontendDist, {
      setHeaders(res, filePath) {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (/\.(png|jpe?g|webp|svg|ico|woff2?)$/i.test(filePath)) {
          res.setHeader("Cache-Control", "public, max-age=86400");
        }
      },
    })
  );
  // SPA fallback – serve index.html for non-API routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
} else {
  // 404 for API-only mode
  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });
}

// Error handler
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[OK] KSX Backend listening on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});

export default app;
