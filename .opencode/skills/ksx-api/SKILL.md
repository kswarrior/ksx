---
name: ksx-api
description: "Use when querying KSX site data (sitemap, free Minecraft hosting, free VPS, free website hosting, free database hosting, social stats) through the ksx MCP tools or the /api endpoints, or when changing API filters and response shapes."
---

# KSX API and MCP

The `ksx` MCP server is registered in `opencode.json` and runs `mcp/ksx-server.mjs`. Prefer its tools over shelling out to curl when you need raw data.

## MCP tools

| Tool | Purpose |
| --- | --- |
| `ksx_site_summary` | Stack, deploy target, counts, categories, page list, endpoints |
| `ksx_get_sitemap` | Categories/sections/pages; optional `category`, `section`, `includeIcons` |
| `ksx_search_pages` | Search pages by name, section, or category |
| `ksx_find_minecraft_hosting` | Filter hosts by `query`, `location`, `uptime`, `alwaysOn`, `minRam` |
| `ksx_find_vps_hosting` | Filter providers by `query`, `type`, `location`, `renew`, `sudo`, `alwaysOn` |
| `ksx_find_website_hosting` | Filter providers by `query`, `type`, `customDomain`, `ssl`, `ads`, `alwaysFree` |
| `ksx_find_database_hosting` | Filter providers by `query`, `type`, `cardRequired`, `backups`, `ssl`, `alwaysFree` |
| `ksx_get_social_stats` | Live counts from `/api/social` |
| `ksx_api_get` | GET any `/api/...` path on the configured API |

Resources: `ksx://sitemap`, `ksx://hosting/minecraft`, `ksx://hosting/vps`, `ksx://hosting/website`, `ksx://hosting/database`.

The MCP server reads `backend/src/data/*.json` directly, so sitemap and hosting tools work without the backend running. Social and `ksx_api_get` need a reachable API:

- Default: `http://localhost:8080` (start with `npm run dev:backend`)
- Override: `KSX_API_BASE=https://your-deployment` in the environment that starts opencode
- Override data location: `KSX_DATA_DIR=/path/to/data`
- Override summary URL: `KSX_SITE_URL=https://your-site.example`

Run the server manually with `npm run mcp`.

## HTTP endpoints

Base URL: local `http://localhost:8080`, deployed Worker URL, or same-origin under `/api`.

```bash
curl localhost:8080/api/health
curl localhost:8080/api/stats
curl localhost:8080/api/sitemap
curl "localhost:8080/api/sitemap/search?q=hosting"
curl "localhost:8080/api/hosting/minecraft?q=&alwaysOn=true&location=india&ram=4"
curl "localhost:8080/api/hosting/vps?q=&type=VPS&renew=true&sudo=true&alwaysOn=true"
curl "localhost:8080/api/hosting/website?q=&type=Static&customDomain=true&ssl=true&ads=false&alwaysFree=true"
curl "localhost:8080/api/hosting/database?q=&type=PostgreSQL&cardRequired=false&backups=true&alwaysFree=true&ssl=true"
curl localhost:8080/api/apps/ks-portal/stats
curl -X POST localhost:8080/api/apps/ks-portal/download -H "Content-Type: application/json" -d '{"version":"1.5.0","platform":"android"}'
curl localhost:8080/api/social
```

### Response shapes

- `/api/sitemap` -> `SitemapCategory[]` with inline SVG `icon`/`logo` strings.
- `/api/sitemap/search?q=` -> flat `SearchItem[]`; matches page `name`, section `title`, or category. Empty `q` -> `[]`.
- `/api/hosting/minecraft` -> `{ count, data: MinecraftHosting[] }`, filtered by name substring, location substring, minimum RAM, legacy exact `uptime`, and `alwaysOn` (`"true"`/`"false"`). Each entry also includes `players`, `alwaysOn`, `verification`, `limits`, and `notes`.
- `/api/hosting/vps` -> `{ count, data: VpsHosting[] }`; `type` matches a substring of `VPS`, `Cloud shell`, `Cloud IDE`, `Notebook`, or `Sandbox`; `renew`, `sudo`, `alwaysOn` accept `"true"`/`"false"`. Each entry also includes `verification`, `limits`, and `notes`.
- `/api/hosting/website` -> `{ count, data: WebsiteHosting[] }`; `type` matches a substring such as `Static`, `PHP`, `Python`, or `builder`; `customDomain`, `ssl`, `ads`, `alwaysFree` accept `"true"`/`"false"`. Each entry has `storage`, `bandwidth`, `sites`, `database`, `verification`, `limits`, and `notes`.
- `/api/hosting/database` -> `{ count, data: DatabaseHosting[] }`; `type` matches a substring such as `PostgreSQL`, `SQLite`, `Document`, or `Vector`; `cardRequired`, `backups`, `ssl`, `alwaysFree` accept `"true"`/`"false"`. Each entry has `storage`, `transfer`, `databases`, `region`, `backups`, `verification`, `limits`, and `notes`.
- `/api/apps/:slug/stats` -> `{ slug, name, version, platform, downloads, available, reason? }`; `downloads` is the D1 row count for the app, or `null` when D1 is unavailable (Express). `available: false` does not mean zero. `POST /api/apps/:slug/download` records a click when D1 is bound.
- `/api/social` -> `{ updatedAt, platforms: { youtube, discord, instagram } }`; each platform has `count`, `display`, `available`, `source`, optional `online`/`name`/`error`, and `fetchedAt`. Add `?refresh=1` to bypass the 5 minute server cache.
- `/api/hosting/minecraft/:id` exists only on Express (index into the data array); the Worker does not implement it. Do not rely on it in frontend code.

Legacy aliases still work: `/minecraft/hosting/free.json`, `/vps/hosting/list/free.json`, `/website/hosting/list/free.json`, `/database/hosting/list/free.json`, `/sitemap.json`.

## Gotchas

- Minecraft `uptime` is a legacy display string (`good`, `danger`, or `excellent (always-on)`). Prefer the boolean `alwaysOn` for filtering; `?uptime=good` excludes the excellent ones.
- `ram` in data may be fractional or a string; `ram=4` means "at least 4 GB".
- VPS booleans are real booleans in JSON but strings in query params; omitting a param means "no filter", while `false` is a real filter.
- Social counts are cached for 5 minutes (failures for 1 minute) and fall back through multiple sources; `available: false` means the number is unknown, not zero. Instagram login-gates public profiles, so live follower counts need `INSTAGRAM_ACCESS_TOKEN`.
- Express `frontend/src/lib/api.ts` and Worker `backend/src/worker.ts` must stay behaviorally identical. When changing a filter or shape, update both and run `npm run typecheck`.
