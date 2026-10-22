---
name: ksx-site
description: "Use when exploring or changing the KSX website repo (ksx / KS Warrior hub): routes, pages, hosting lists, sitemap data, React + Express/Hono monorepo structure, or running dev/build/typecheck."
---

# KSX Site

KSX is the KS Warrior hub: a TypeScript monorepo with a React frontend and an API implemented twice (Express for local dev, Hono for Cloudflare Workers). It lists Minecraft tools, free Minecraft hosts, free VPS providers, panel install guides, and social counts.

## Layout

```
backend/src/index.ts        Express server (local dev, serves frontend/dist when built)
backend/src/worker.ts       Hono app with the same API for Cloudflare Workers
backend/src/routes/         Express routers: sitemap, hosting, meta
backend/src/social.ts       YouTube/Discord/Instagram stat fetchers with 5 min cache
backend/src/data/           sitemap.json, minecraft-hosting.json, vps-hosting.json (source of truth)
frontend/src/App.tsx        React Router route table
frontend/src/pages/         One component (+ .css) per page
frontend/src/lib/api.ts     Typed API client used by pages
frontend/src/components/    Layout, search, filters, markdown, UI controls
frontend/public/            Static files: robots.txt, sitemap.xml, legacy sitemap.json
mcp/ksx-server.mjs          Local MCP server exposing site data (see ksx-api skill)
.opencode/skills/           These skills
```

## Commands

```bash
npm install
npm run dev            # Express :8080 + Vite :5173
npm run dev:backend    # Express only
npm run dev:frontend   # Vite only
npm run dev:worker     # wrangler dev (Hono + assets) :8080
npm run build          # backend tsc + frontend vite build
npm run typecheck      # tsc --noEmit for backend and frontend
```

Run `npm run typecheck` before finishing changes. There is no test suite or lint script.

## Routes

| Route | Page |
| --- | --- |
| `/`, `/dashboard` | Dashboard (news, pins, recents) |
| `/map` | Sitemap browser with search |
| `/social` | Live YouTube/Discord/Instagram counts |
| `/about` | About page (content in `frontend/src/pages/about.md`) |
| `/minecraft/hosting/free[.html]` | Free Minecraft host list |
| `/vps/hosting/list/free[.html]` | Free VPS list |
| `/minecraft/make-hosting/{pterodactyl,puffer,airlink,ks-panel}[.html]` | Panel setup guides (KS Panel is coming soon) |
| `/minecraft/java/{launcher,downloader}[.html]` | Java tools |
| `/minecraft/bedrock/ks-client[.html]` | Bedrock client page |
| `/minecraft/server/{statics,bot}[.html]` | Server stat lookup / bot setup |
| `/minecraft/make-server/{setup-server-in-vps,server.jar-downloader,paid-plugin-free,custom-ip}[.html]` | Server guides |
| `/minecraft/*`, `/vps/*` | Generic placeholder fallback |

Most routes are registered twice in `frontend/src/App.tsx`: with and without `.html`, because the old static site used `.html` URLs and the sitemap still does. Preserve both when adding a page.

## Data rules

- Edit hosting data only in `backend/src/data/*.json`; the API and UI read it at runtime.
- To add a page to the map/search, update `backend/src/data/sitemap.json` (category -> sections -> pages) and `frontend/public/sitemap.xml`.
- Add `"soon": true` to a sitemap page to show a Coming Soon badge on `/map`; still register a route/page so the link works.
- `frontend/public/sitemap.json` is a stale legacy copy. The React app never reads it; do not treat it as source of truth. Update it only if a task explicitly asks for the static copy.
- Sitemap page URLs keep the `.html` suffix even though React Router serves both forms.
- Minecraft entries keep a legacy `uptime` string (`good`, `danger`, or `excellent (always-on)`) plus the boolean `alwaysOn`. Filter with `alwaysOn`; `uptime` remains an exact-match legacy filter. Each entry also has `players`, `verification`, `limits`, and `notes`.
- Never fabricate social counts. `/api/social` reports `available: false` when a platform cannot be reached.

## Adding a page

1. Create `frontend/src/pages/MyPage.tsx` (and `MyPage.css` if needed), following the styling of an existing page.
2. Add a lazy import in `frontend/src/App.tsx` and register both `path` and `path.html`.
3. Add the page to `backend/src/data/sitemap.json` so it appears on `/map` and in search.
4. Add the URL to `frontend/public/sitemap.xml`.
5. Run `npm run typecheck`.

## Conventions

- Function components, named default exports, hooks at top level.
- API access goes through `frontend/src/lib/api.ts`; use `VITE_API_BASE` only through that module.
- Keep per-page CSS files rather than a shared App.css.
- Use `Icon` and the `components/ui` controls instead of raw SVG/inputs where practical.
- Do not change API response shapes without updating `frontend/src/lib/api.ts` and `backend/src/worker.ts` together; Express and Worker implementations must stay in sync.
