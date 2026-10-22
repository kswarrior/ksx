---
name: ksx-deploy
description: "Use when building or deploying the KSX website to Cloudflare (Workers, Pages, wrangler), changing wrangler.toml, configuring VITE_API_BASE or worker secrets/vars, or debugging SPA/asset routing in production."
---

# KSX Deploy

KSX ships either as one Cloudflare Worker with static assets or as Pages (frontend) + Worker (API). Both wrangler configs exist; know which one is in play.

## Build first

```bash
npm install
npm run build          # backend tsc -> backend/dist, frontend vite -> frontend/dist
npm run typecheck
```

Wrangler deploys `frontend/dist` as assets and bundles `backend/src/worker.ts`. If `frontend/dist` is missing, the deploy fails or serves stale assets.

## Option A — single Worker (recommended)

`backend/wrangler.toml`:

```toml
name = "ksx-backend"
main = "src/worker.ts"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]
[assets]
directory = "../frontend/dist"
binding = "ASSETS"
not_found_handling = "single-page-application"
```

```bash
npm run build
npm run deploy:worker   # build frontend + cd backend && wrangler deploy
# or: npm run deploy    # full build + backend wrangler deploy
```

API stays under `/api/*`; assets under `/assets/*`; all other paths fall through to `index.html` for React Router. The Hono `notFound` handler also tries the `ASSETS` binding before returning a plain 404.

There is a second config at the repo root (`wrangler.toml`) with `main = "backend/src/worker.ts"` and `directory = "frontend/dist"`. It is used only when running wrangler from the repo root. Keep it consistent with `backend/wrangler.toml` if you edit either.

Verify without deploying:

```bash
./backend/node_modules/.bin/wrangler deploy --dry-run --cwd backend
```

## Option B — Pages + Worker

1. Remove/comment `[assets]` in `backend/wrangler.toml`, then `npm run deploy --prefix backend` for the API Worker.
2. Point the frontend at that Worker:

```bash
echo 'VITE_API_BASE=https://ksx-backend.<subdomain>.workers.dev' > frontend/.env.production
npm run deploy:frontend   # vite build + wrangler pages deploy dist --project-name ksx-frontend
```

`frontend/public/_redirects` (`/* /index.html 200`) provides SPA fallback and `_headers` sets caching/CORS. Both are only used on Pages.

For the Pages dashboard, set build command `npm run build --prefix frontend`, output `frontend/dist`, and `VITE_API_BASE`.

## Environment variables

Express (local) and Worker both read these from the environment:

- `YOUTUBE_HANDLE` (default `ks_warrior_pro`)
- `YOUTUBE_API_KEY` (optional; without it, subscriber count is scraped from the public page)
- `DISCORD_INVITE_CODE` (default `2kAYnH655h`)
- `INSTAGRAM_USERNAME` (default `ks_warrior_pro`)
- `INSTAGRAM_ACCESS_TOKEN` + `INSTAGRAM_USER_ID` (optional Graph API path)

Set Worker secrets with `wrangler secret put NAME` (from `backend/`), not by committing values. Public vars can go in `[vars]`.

## Gotchas

- `VITE_*` values are baked in at Vite build time; changing them requires a rebuild, not just a redeploy.
- `ksx.pages.dev` currently serves a small wrapper page that iframes `https://website.ksw.workers.dev`, which is an older static site not built from this repo. Confirm the intended production URL before assuming a deploy updates the public page.
- The Worker CORS policy is `origin: "*"`; Express uses `origin: true` with credentials. Keep API clients same-origin where possible.
- `frontend/public/robots.txt` and `sitemap.xml` hardcode `https://ksx.pages.dev`; update them if the canonical domain changes.
- Do not commit `.env`, `.env.production`, `.wrangler/`, or `dist/`.
- Never deploy or commit without an explicit request.
