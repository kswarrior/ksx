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
    }
    catch {
        res.status(502).json({ error: "Modrinth request failed" });
    }
});
// MCPEDL API proxy (PE / Bedrock content)
const MCPEDL_API = "https://api.mcpedl.com/api";
app.get("/api/mcpedl/*", async (req, res) => {
    const upstreamPath = req.originalUrl.slice("/api/mcpedl".length);
    try {
        const upstream = await fetch(`${MCPEDL_API}${upstreamPath}`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; ksx-backend/1.0; +https://github.com/anomalyco/ksx)",
                Accept: "application/json",
            },
        });
        res.status(upstream.status);
        res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "application/json");
        res.setHeader("Cache-Control", "public, max-age=60, s-maxage=120");
        res.send(Buffer.from(await upstream.arrayBuffer()));
    }
    catch {
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
    app.use(express.static(frontendDist, {
        setHeaders(res, filePath) {
            if (filePath.includes(`${path.sep}assets${path.sep}`)) {
                res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
            }
            else if (/\.(png|jpe?g|webp|svg|ico|woff2?)$/i.test(filePath)) {
                res.setHeader("Cache-Control", "public, max-age=86400");
            }
        },
    }));
    // SPA fallback – serve index.html for non-API routes
    app.get("*", (_req, res) => {
        res.sendFile(path.join(frontendDist, "index.html"));
    });
}
else {
    // 404 for API-only mode
    app.use((_req, res) => {
        res.status(404).json({ error: "Not found" });
    });
}
// Error handler
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
});
app.listen(PORT, "0.0.0.0", () => {
    console.log(`[OK] KSX Backend listening on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
});
export default app;
