import { Router } from "express";
import type { SitemapCategory } from "../types.js";
import { searchSitemap } from "../search.js";
import sitemapData from "../data/sitemap.json" with { type: "json" };

const router = Router();

const sitemap = sitemapData as SitemapCategory[];

router.get("/", (_req, res) => {
  res.json(sitemap);
});

router.get("/search", (req, res) => {
  const q = String(req.query.q ?? "").trim();
  res.json(searchSitemap(sitemap, q));
});

export default router;
