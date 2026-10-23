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
│   │   ├── data/         # sitemap.json, minecraft-hosting.json, vps-hosting.json, website-hosting.json, database-hosting.json
│   │   └── routes/       # Express routes (mirrored in worker.ts)
│   ├── wrangler.toml     # Workers config: name=ksx-backend, assets=../frontend/dist, nodejs_compat
│   └── package.json      # scripts: dev, dev:worker, deploy
├── frontend/
│   ├── src/ (Layout, Dashboard, MapPage, Social, MinecraftHosting, VpsHosting, WebsiteHosting, DatabaseHosting, JavaLauncher, KsClient, ServerInfo, PanelPages)
│   ├── public/ (_redirects, _headers, robots.txt, sitemap.*) # copied for Pages
│   ├── vite.config.ts    # proxy /api → :8080
│   └── wrangler deploy via Pages
└── package.json          # monorepo: dev, build, deploy, deploy:frontend, deploy:worker
```

## Local Dev

```bash
npm install --prefix backend && npm install --prefix frontend
npm run dev              # Express :8080 + Vite :5173
npm run dev:worker --prefix backend # Wrangler dev (Worker + assets) :8080
# or separately:
npm run dev:backend      # Express
npm run dev:frontend     # Vite
```

Env:
- `PORT` (Express only, default 8080)
- `VITE_API_BASE` — `""` for same-origin (Worker assets), or `https://ksx-backend.<subdomain>.workers.dev` if deploying separately
- `YOUTUBE_HANDLE` (optional, default `ks_warrior_pro`)
- `YOUTUBE_API_KEY` (optional; live subscriber count uses the YouTube Data API, otherwise the public channel page)
- `DISCORD_INVITE_CODE` (optional, default `jDG7tJrHrt`; accepts a code or full invite URL)
- `INSTAGRAM_USERNAME` (optional, default `ks_warrior_pro`)
- `INSTAGRAM_ACCESS_TOKEN` (optional; live follower count via the Instagram Graph API; `INSTAGRAM_USER_ID` is only needed for Facebook-login tokens. Instagram now login-gates public profiles, so a token is required for reliable live follower counts)

## Build

```bash
npm run build            # tsc backend + vite frontend
npm run typecheck
npm start                # node backend/dist/index.js serves frontend/dist
```

## Download tracking (Cloudflare D1)

KS Portal (Android app) and KS Client (Bedrock resource pack) both record downloads
through the same endpoints. The KS Portal download button sends a click to
`POST /api/apps/ks-portal/download`; KS Client uses
`POST /api/apps/ks-client/download`.
On Cloudflare Workers this writes to the `app_downloads` D1 table. The Worker
creates the tables and seeds the `apps` table automatically on the first request,
so a manual seed is optional. Migration and seed files live in `backend/migrations/`.

### Option 1 — Cloudflare dashboard (no CLI)

1. Cloudflare Dashboard → **Storage & Databases → D1 SQL Database → Create database**, name it `ksx-db`.
2. Open the database and copy its **Database ID**.
3. If you deploy with Wrangler or Workers Builds, paste the ID into
   `backend/wrangler.toml` (`database_id = "..."`) and root `wrangler.toml` if used.
   If you deploy only from the dashboard, add the binding in
   **Worker → Settings → Bindings → Add → D1 database**: variable name `DB`, database `ksx-db`.
4. Open the D1 database → **Console** and run `backend/migrations/0001_apps.sql`,
   then `backend/migrations/0002_seed_ks_portal.sql` (or skip this: the Worker
   auto-creates and seeds on the first download).
5. Redeploy the Worker.

No API token is needed when Cloudflare deploys the Worker for you.

### Option 2 — Wrangler CLI

```bash
cd backend
npx wrangler login                  # or set CLOUDFLARE_API_TOKEN
npx wrangler d1 create ksx-db       # copy the printed database_id
# paste the id into backend/wrangler.toml (and root wrangler.toml if deploying from root)
npx wrangler d1 migrations apply ksx-db --local
npx wrangler d1 migrations apply ksx-db --remote
```

Check recorded downloads:

```bash
npx wrangler d1 execute ksx-db --remote --command "SELECT COUNT(*) AS downloads FROM app_downloads;"
```

### Credentials and `.env` safety

- `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are only needed for CLI/CI.
  Create a token at **My Profile → API Tokens** (Workers + D1 edit permissions).
  For GitHub Actions, store them in **Repo Settings → Secrets and variables → Actions**.
- Locally, copy `.env.example` to `backend/.env` (or use `backend/.dev.vars`).
  Both are git-ignored — never commit real tokens.
- Production Worker secrets (YouTube/Instagram keys) belong in
  **Worker → Settings → Variables and Secrets**, not in the repository.
- The D1 **Database ID** is not a secret. The **API token is** — never put it in
  `wrangler.toml`, frontend code, or a committed `.env`.

The local Express server has no D1 binding; it accepts the click and returns
`recorded: false`. Use `npm run dev:worker` to test D1 locally.

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
GET /api/hosting/minecraft?q=&alwaysOn=true&location=india&ram=4
GET /api/hosting/vps?q=&type=VPS&renew=true&sudo=true&alwaysOn=true
GET /api/hosting/website?q=&type=Static&customDomain=true&ssl=true&ads=false&alwaysFree=true
GET /api/hosting/database?q=&type=PostgreSQL&cardRequired=false&backups=true&alwaysFree=true&ssl=true
GET /api/apps/:slug/stats
POST /api/apps/:slug/download
GET /api/social
```

`/api/apps/:slug/stats` returns the all-time `downloads` total plus `currentDownloads`
and a `versions` breakdown. Each version keeps its own count, so a new release
starts from zero and does not inherit downloads from previous versions.

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

MCP tools: `ksx_site_summary`, `ksx_get_sitemap`, `ksx_search_pages`, `ksx_find_minecraft_hosting`, `ksx_find_vps_hosting`, `ksx_find_website_hosting`, `ksx_find_database_hosting`, `ksx_get_social_stats`, `ksx_api_get`. Resources: `ksx://sitemap`, `ksx://hosting/minecraft`, `ksx://hosting/vps`, `ksx://hosting/website`, `ksx://hosting/database`.

Sitemap and hosting tools read the JSON data directly. Live tools default to `http://localhost:8080` (start `npm run dev:backend`) and can be pointed elsewhere:

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
