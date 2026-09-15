# KSX — Backend TS + Frontend React + TS

Converted from a static HTML/CSS/JS site (original `index2.html` + `dashboard.html` / `map.html` / `social.html` + `minecraft/**` + `vps/**`) into a modern full-stack TypeScript monorepo.

## Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js + Express + TypeScript (`backend/`) |
| Frontend | Vite + React 18 + React Router + TypeScript (`frontend/`) |
| API | REST JSON (`/api/*`) |
| Styling | CSS per-page/component (preserved original dark theme) |

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── index.ts          # Express app + static frontend serving
│   │   ├── types.ts
│   │   ├── data/             # sitemap.json, minecraft-hosting.json, vps-hosting.json
│   │   └── routes/
│   │       ├── sitemap.ts    # GET /api/sitemap, /api/sitemap/search?q=
│   │       ├── hosting.ts    # GET /api/hosting/minecraft, /api/hosting/vps
│   │       └── meta.ts       # GET /api/health, /api/stats
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx, App.tsx
│   │   ├── components/Layout.tsx  # Topbar + Sidebar + Search (replaces index2.html shell)
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx      # replaces dashboard.html
│   │   │   ├── MapPage.tsx        # replaces map.html
│   │   │   ├── Social.tsx         # replaces social.html
│   │   │   ├── MinecraftHosting.tsx # replaces minecraft/hosting/free.html
│   │   │   ├── VpsHosting.tsx     # replaces vps/hosting/list/free.html
│   │   │   ├── JavaLauncher.tsx   # replaces minecraft/java/launcher.html
│   │   │   ├── KsClient.tsx       # replaces minecraft/bedrock/ks-client.html
│   │   │   ├── ServerInfo.tsx     # replaces minecraft/server/statics.html
│   │   │   └── PanelPages.tsx     # pterodactyl / puffer / skyport
│   │   └── lib/api.ts
│   └── vite.config.ts        # proxy /api → :4000 in dev
└── package.json              # monorepo scripts
```

## How the original site maps to the new code

| Original | New |
|----------|-----|
| `index2.html` (shell + topbar + sidebar + iframe loader + search + fav) | `frontend/src/components/Layout.tsx` + `App.tsx` router (no iframe) |
| `open-main-page.js` (topbar banner + redirect) | removed – SPA handles routing directly |
| `dashboard.html` localStorage recent/fav + news slider | `frontend/src/pages/Dashboard.tsx` (hooks + CSS) |
| `map.html` fetch `sitemap.json` | `frontend/src/pages/MapPage.tsx` + `GET /api/sitemap` |
| `social.html` static cards | `frontend/src/pages/Social.tsx` |
| `minecraft/hosting/free.html + free.json` | `frontend/src/pages/MinecraftHosting.tsx` + `GET /api/hosting/minecraft` |
| `vps/hosting/list/free.html + free.json` | `frontend/src/pages/VpsHosting.tsx` + `GET /api/hosting/vps` |
| `sitemap.json` | served via backend, single source of truth |

Search now hits `GET /api/sitemap/search?q=` (backend) and client-side grouping matches the original `s-*` classes.

Recent/Favourite/LastPage still use `localStorage` keys `ks-web-recent`, `ks-web-fav`, `ks-web-last-page` so existing users keep data.

## Development

```bash
# install all
npm install --prefix backend
npm install --prefix frontend

# run backend (4000) + frontend (5173) together
npm run dev          # or dev:backend / dev:frontend separately

# backend only
npm run dev --prefix backend   # http://localhost:4000/api/health

# frontend only (proxies /api to backend)
npm run dev --prefix frontend  # http://localhost:5173
```

Env:
- `PORT` – backend port (default 4000)
- `VITE_API_BASE` – override API base for frontend (default `""` → same-origin / proxy)

## Production

```bash
npm run build          # builds backend dist + frontend dist
npm start              # serves frontend from backend/frontend/dist + API on same port
# or: node backend/dist/index.js
```

Backend serves `frontend/dist` statically and falls back to `index.html` for SPA routing. API stays under `/api/*`.

## API Reference

```
GET /api/health
GET /api/stats
GET /api/sitemap
GET /api/sitemap/search?q=hosting
GET /api/hosting/minecraft?q=&uptime=good&location=india&ram=4
GET /api/hosting/vps?q=&renew=true&sudo=true&alwaysOn=true
```

## Notes

- Original static files (`*.html` under `minecraft/` / `vps/`) are kept for reference but no longer used at runtime; migrate remaining pages (bot, downloader, paid-plugin-free, custom-ip, setup-server-in-vps, server.jar-downloader) incrementally by adding new `pages/` components and routes.
- `about.html` was empty → `About.tsx` provides a proper page.
- Styles were extracted to component-scoped CSS to keep bundle size small; global vars in `frontend/src/styles/global.css` + `Layout.css`.
