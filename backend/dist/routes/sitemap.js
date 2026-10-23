import { Router } from "express";
import { searchSitemap } from "../search.js";
import sitemapData from "../data/sitemap.json" with { type: "json" };
const router = Router();
const sitemap = sitemapData;
router.get("/", (_req, res) => {
    res.json(sitemap);
});
router.get("/search", (req, res) => {
    const q = String(req.query.q ?? "").trim();
    res.json(searchSitemap(sitemap, q));
});
export default router;
