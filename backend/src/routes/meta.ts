import { Router } from "express";
import { getSocialStats } from "../social.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

router.get("/stats", (_req, res) => {
  res.json({
    name: "KSX API",
    version: "1.0.0",
    description: "KS Warrior Backend",
    endpoints: [
      "GET /api/health",
      "GET /api/sitemap",
      "GET /api/sitemap/search?q=",
      "GET /api/hosting/minecraft?q=&uptime=&alwaysOn=&location=&ram=",
      "GET /api/hosting/vps?q=&type=&renew=&sudo=&alwaysOn=",
      "GET /api/hosting/website?q=&type=&customDomain=&ssl=&ads=&alwaysFree=",
      "GET /api/hosting/database?q=&type=&cardRequired=&backups=&alwaysFree=&ssl=",
      "GET /api/social",
    ],
  });
});

router.get("/social", async (req, res) => {
  try {
    const force = req.query.refresh === "1";
    const stats = await getSocialStats(
      {
        YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
        YOUTUBE_HANDLE: process.env.YOUTUBE_HANDLE,
        DISCORD_INVITE_CODE: process.env.DISCORD_INVITE_CODE,
        INSTAGRAM_ACCESS_TOKEN: process.env.INSTAGRAM_ACCESS_TOKEN,
        INSTAGRAM_USER_ID: process.env.INSTAGRAM_USER_ID,
        INSTAGRAM_USERNAME: process.env.INSTAGRAM_USERNAME,
      },
      { force }
    );
    res.setHeader(
      "Cache-Control",
      force
        ? "no-store"
        : "public, max-age=300, s-maxage=300, stale-while-revalidate=600"
    );
    res.json(stats);
  } catch (error) {
    console.error("social stats error:", error);
    res.status(502).json({ error: "Social stats unavailable" });
  }
});

export default router;
