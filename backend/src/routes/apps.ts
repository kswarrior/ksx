import { Router } from "express";
import type { AppRecord } from "../types.js";
import appsData from "../data/apps.json" with { type: "json" };

const apps = appsData as AppRecord[];
const router = Router();

router.get("/:slug/stats", (req, res) => {
  const app = apps.find((item) => item.slug === req.params.slug);
  if (!app) {
    res.status(404).json({ error: "Unknown app" });
    return;
  }

  res.json({
    slug: app.slug,
    name: app.name,
    version: app.version,
    platform: app.platform,
    downloads: null,
    available: false,
    reason: "D1 is only available on Cloudflare Workers",
  });
});

router.post("/:slug/download", (req, res) => {
  const app = apps.find((item) => item.slug === req.params.slug);
  if (!app) {
    res.status(404).json({ error: "Unknown app" });
    return;
  }

  res.json({
    ok: true,
    recorded: false,
    reason: "D1 is only available on Cloudflare Workers",
  });
});

export default router;
