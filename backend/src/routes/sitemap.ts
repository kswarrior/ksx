import { Router } from "express";
import type { SitemapCategory, SearchItem } from "../types.js";
import sitemapData from "../data/sitemap.json" with { type: "json" };

const router = Router();

const sitemap = sitemapData as SitemapCategory[];

router.get("/", (_req, res) => {
  res.json(sitemap);
});

router.get("/search", (req, res) => {
  const q = String(req.query.q ?? "").trim().toLowerCase();
  if (!q) {
    res.json([]);
    return;
  }

  const flat: SearchItem[] = [];
  for (const cat of sitemap) {
    for (const sec of cat.sections) {
      for (const page of sec.pages) {
        flat.push({
          category: cat.category,
          icon: cat.icon,
          title: sec.title,
          name: page.name,
          url: page.url,
        });
      }
    }
  }

  const matched = flat.filter(
    (i) =>
      i.name.toLowerCase().includes(q) ||
      i.title.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q)
  );

  res.json(matched);
});

export default router;
