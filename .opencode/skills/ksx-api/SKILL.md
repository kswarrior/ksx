---
name: ksx-api
description: Use when querying KSX site data (sitemap, free Minecraft hosting, free VPS, social stats) through the ksx MCP tools or the /api endpoints, or when changing API filters and response shapes.
---

# KSX API and MCP

The `ksx` MCP server is registered in `opencode.json` and runs `mcp/ksx-server.mjs`. Prefer its tools over shelling out to curl when you need raw data.

## MCP tools

| Tool | Purpose |
| --- | --- |
| `ksx_site_summary` | Stack, deploy target, counts, categories, page list, endpoints |
| `ksx_get_sitemap` | Categories/sections/pages; optional `category`, `section`, `includeIcons` |
| `ksx_search_pages` | Search pages by name, section, or category |
| `ksx_find_minecraft_hosting` | Filter hosts by `query`, `location`, `uptime`, `minRam` |
| `ksx_find_vps_hosting` | Filter providers by `query`, `location`, `renew`, `sudo`, `alwaysOn` |
| `ksx_get_social_stats` | Live counts from `/api/social` |
| `ksx_api_get` | GET any `/api/...` path on the configured API |

Resources: `ksx://sitemap`, `ksx://hosting/minecraft`, `ksx://hosting/vps`.

The MCP server reads `backend/src/data/*.json` directly, so sitemap and hosting tools work without the backend running. Social and `ksx_api_get` need a reachable API:

- Default: `http://localhost:4000` (start with `npm run dev:backend`)
- Override: `KSX_API_BASE=https://your-deployment` in the environment that starts opencode
- Override data location: `KSX_DATA_DIR=/path/to/data`

Run the server manually with `npm run mcp`.

## HTTP endpoints

Base URL: local `http://localhost:4000`, deployed Worker URL, or same-origin under `/api`.

```bash
curl localhost:4000/api/health
curl localhost:4000/api/stats
curl localhost:4000/api/sitemap
curl "localhost:4000/api/sitemap/search?q=hosting"
curl "localhost:4000/api/hosting/minecraft?q=&uptime=good&location=india&ram=4"
curl "localhost:4000/api/hosting/vps?q=&renew=true&sudo=true&alwaysOn=true"
curl localhost:4000/api/social
```

### Response shapes

- `/api/sitemap` -> `SitemapCategory[]` with inline SVG `icon`/`logo` strings.
- `/api/sitemap/search?q=` -> flat `SearchItem[]`; matches page `name`, section `title`, or category. Empty `q` -> `[]`.
- `/api/hosting/minecraft` -> `{ count, data: MinecraftHosting[] }`, filtered by name substring, exact `uptime`, location substring, and minimum RAM.
- `/api/hosting/vps` -> `{ count, data: VpsHosting[] }`; `renew`, `sudo`, `alwaysOn` accept `"true"`/`"false"`.
- `/api/social` -> `{ updatedAt, platforms: { youtube, discord, instagram } }`; each platform has `count`, `display`, `available`, `source`, optional `online`/`name`/`error`, and `fetchedAt`.
- `/api/hosting/minecraft/:id` exists only on Express (index into the data array); the Worker does not implement it. Do not rely on it in frontend code.

Legacy aliases still work: `/minecraft/hosting/free.json`, `/vps/hosting/list/free.json`, `/sitemap.json`.

## Gotchas

- Minecraft `uptime` values are `good`, `danger`, or `excellent (always-on)`. `?uptime=good` excludes the excellent ones; the UI's "24/7" filter includes both.
- `ram` in data may be fractional or a string; `ram=4` means "at least 4 GB".
- VPS booleans are real booleans in JSON but strings in query params; omitting a param means "no filter", while `false` is a real filter.
- Social counts are cached for 5 minutes and fall back through multiple sources; `available: false` means the number is unknown, not zero.
- Express `frontend/src/lib/api.ts` and Worker `backend/src/worker.ts` must stay behaviorally identical. When changing a filter or shape, update both and run `npm run typecheck`.
