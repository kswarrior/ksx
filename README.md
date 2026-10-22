# KSX — Backend TS + Frontend React + TS (Cloudflare Ready)

Converted from static HTML (`index2.html` + `minecraft/**` + `vps/**`) to a TypeScript monorepo. Legacy `*.html`/`minecraft/`/`vps/` files have been removed — only `backend/` + `frontend/` remain.

## Stack

| Layer | Tech |
|-------|------|
| Backend | Express (local) + **Hono** (Cloudflare Workers) + TypeScript |
| Frontend | Vite + React 18 + React Router + TypeScript |
| Deploy | Cloudflare **Workers** (assets) or **Pages** |

## Structure

```
.
├── backend/
│   ├── src/
│   │   ├── index.ts      # Express for local dev + serves frontend/dist
│   │   ├── worker.ts     # Hono app for Cloudflare Workers (same routes)
│   │   ├── types.ts
│   │   ├── data/         # sitemap.json, minecraft-hosting.json, vps-hosting.json
│   │   └── routes/       # Express routes (mirrored in worker.ts)
│   ├── wrangler.toml     # Workers config: name=ksx-backend, assets=../frontend/dist, nodejs_compat
│   └── package.json      # scripts: dev, dev:worker, deploy
├── frontend/
│   ├── src/ (Layout, Dashboard, MapPage, Social, MinecraftHosting, VpsHosting, JavaLauncher, KsClient, ServerInfo, PanelPages)
│   ├── public/ (_redirects, _headers, robots.txt, sitemap.*) # copied for Pages
│   ├── vite.config.ts    # proxy /api → :4000
│   └── wrangler deploy via Pages
└── package.json          # monorepo: dev, build, deploy, deploy:frontend, deploy:worker
```

## Local Dev

```bash
npm install --prefix backend && npm install --prefix frontend
npm run dev              # Express :4000 + Vite :5173
npm run dev:worker --prefix backend # Wrangler dev (Worker + assets) :4000
# or separately:
npm run dev:backend      # Express
npm run dev:frontend     # Vite
```

Env:
- `PORT` (Express only, default 4000)
- `VITE_API_BASE` — `""` for same-origin (Worker assets), or `https://ksx-backend.<subdomain>.workers.dev` if deploying separately
- `YOUTUBE_HANDLE` (optional, default `ks_warrior_pro`)
- `YOUTUBE_API_KEY` (optional; live subscriber count uses the YouTube Data API, otherwise the public channel page)
- `DISCORD_INVITE_CODE` (optional, default `2kAYnH655h`; accepts a code or full invite URL)
- `INSTAGRAM_USERNAME` (optional, default `ks_warrior_pro`)
- `INSTAGRAM_ACCESS_TOKEN` + `INSTAGRAM_USER_ID` (optional; official Graph API follower count, otherwise the public profile)

## Build

```bash
npm run build            # tsc backend + vite frontend
npm run typecheck
npm start                # node backend/dist/index.js serves frontend/dist
```

## Deploy to Cloudflare

### Option A — Single Worker with Assets (recommended, 1 deployment)

Frontend + API on same Worker (Hono `worker.ts` + `[assets]` = `frontend/dist`):

```bash
npm run build
npx wrangler login
npm run deploy:worker   # = cd backend && wrangler deploy (needs frontend/dist built)
# or: npm run deploy    # alias
```

`backend/wrangler.toml:1` sets `not_found_handling = "single-page-application"` so React Router works. API stays under `/api/*`, static files from `/assets/*`.

Check:

```bash
./backend/node_modules/.bin/wrangler deploy --dry-run --cwd backend
# Read 12 files from ../frontend/dist — Total Upload: ~105 KiB
```

### Option B — Pages (frontend) + Workers (backend) separate

```bash
# 1. Backend API only (comment out [assets] in wrangler.toml first)
npm run deploy --prefix backend

# 2. Frontend Pages – set VITE_API_BASE to Worker URL
echo 'VITE_API_BASE=https://ksx-backend.<subdomain>.workers.dev' > frontend/.env.production
npm run deploy:frontend  # vite build + wrangler pages deploy dist --project-name ksx-frontend
```

Dashboard alternative: Connect GitHub repo to **Cloudflare Pages** → Build command `npm run build --prefix frontend`, output `frontend/dist`, env `VITE_API_BASE`.

`frontend/public/_redirects:1` (`/* /index.html 200`) handles SPA fallback on Pages; `frontend/public/_headers:1` sets caching/CORS.

## API

```
GET /api/health
GET /api/stats
GET /api/sitemap
GET /api/sitemap/search?q=hosting
GET /api/hosting/minecraft?q=&uptime=good&location=india&ram=4
GET /api/hosting/vps?q=&renew=true&sudo=true&alwaysOn=true
GET /api/social
```

`/api/social` returns the current YouTube subscriber, Discord member, and Instagram follower counts that power the Social page. Responses are cached for 5 minutes; each platform reports `available: false` (never a fabricated number) when its live source cannot be reached. Discord counts require a valid invite, and Instagram falls back to a public reader when no Graph API credentials are set.

Search mimics original `s-*` grouping; `localStorage` keys `ks-web-recent`/`ks-web-fav`/`ks-web-last-page` preserved.

## MCP & Skills

This repo ships a local [MCP](https://modelcontextprotocol.io) server and opencode skills so agents can explore and operate the site.

| File | Purpose |
| --- | --- |
| `opencode.json` | Registers the `ksx` MCP server with opencode (restart opencode after editing) |
| `mcp/ksx-server.mjs` | Stdio MCP server reading `backend/src/data/` and the live API |
| `.opencode/skills/ksx-site/` | Repo structure, routes, data rules, common tasks |
| `.opencode/skills/ksx-api/` | API/MCP tool reference, filters, response shapes, gotchas |
| `.opencode/skills/ksx-deploy/` | Cloudflare Workers/Pages build, deploy, env, SPA notes |

```bash
npm install          # installs @modelcontextprotocol/sdk + zod
npm run mcp          # run the MCP server manually
```

MCP tools: `ksx_site_summary`, `ksx_get_sitemap`, `ksx_search_pages`, `ksx_find_minecraft_hosting`, `ksx_find_vps_hosting`, `ksx_get_social_stats`, `ksx_api_get`. Resources: `ksx://sitemap`, `ksx://hosting/minecraft`, `ksx://hosting/vps`.

Sitemap and hosting tools read the JSON data directly. Live tools default to `http://localhost:4000` (start `npm run dev:backend`) and can be pointed elsewhere:

```bash
KSX_API_BASE=https://ksx-backend.<subdomain>.workers.dev opencode
# optional: KSX_DATA_DIR=/path/to/backend/src/data
# optional: KSX_SITE_URL=https://your-site.example (used in site summaries)
```

## What was removed

```
about.html, dashboard.html, index.html, index2.html, map.html, social.html,
open-main-page.js, sitemap.json/.xml, robots.txt, image/, logo.png, minecraft/, vps/
```
All data moved to `backend/src/data/` and `frontend/public/`. Git shows `D` for those files — commit removal.

## CSS

Per-page `.css` kept (`Dashboard.css`, `MapPage.css`, `Layout.css`, `global.css`). Vite bundles to single `assets/index-*.css` — no extra requests. Keep this over single `App.css` for isolation.
