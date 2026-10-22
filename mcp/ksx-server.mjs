#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = process.env.KSX_DATA_DIR || join(ROOT, "backend", "src", "data");
const API_BASE = (process.env.KSX_API_BASE || "http://localhost:8080").replace(/\/+$/, "");
const SITE_URL = (process.env.KSX_SITE_URL || "https://ksx.pages.dev").replace(/\/+$/, "");

function loadJson(file) {
  return JSON.parse(readFileSync(join(DATA_DIR, file), "utf8"));
}

function loadData() {
  return {
    sitemap: loadJson("sitemap.json"),
    minecraft: loadJson("minecraft-hosting.json"),
    vps: loadJson("vps-hosting.json"),
  };
}

function stripIcons(sitemap) {
  return sitemap.map((category) => ({
    category: category.category,
    sections: category.sections.map((section) => ({
      title: section.title,
      pages: section.pages.map((page) => ({ name: page.name, url: page.url })),
    })),
  }));
}

function flattenSitemap(sitemap) {
  return sitemap.flatMap((category) =>
    category.sections.flatMap((section) =>
      section.pages.map((page) => ({
        category: category.category,
        section: section.title,
        name: page.name,
        url: page.url,
      }))
    )
  );
}

function text(value) {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
  };
}

function fail(message) {
  return { isError: true, content: [{ type: "text", text: message }] };
}

function includes(value, needle) {
  return String(value).toLowerCase().includes(needle.toLowerCase());
}

async function fetchJson(path, timeoutMs = 15_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const body = await res.text();
    let json;
    try {
      json = JSON.parse(body);
    } catch {
      json = body;
    }
    return { status: res.status, ok: res.ok, url: `${API_BASE}${path}`, body: json };
  } finally {
    clearTimeout(timeout);
  }
}

const server = new McpServer({
  name: "ksx",
  version: "1.0.0",
});

server.registerTool(
  "ksx_site_summary",
  {
    title: "KSX site summary",
    description:
      "Get an overview of the KSX website: stack, deploy target, page counts, categories, API endpoints, and data files.",
    annotations: { readOnlyHint: true },
  },
  async () => {
    const { sitemap, minecraft, vps } = loadData();
    const pages = flattenSitemap(sitemap);
    return text({
      name: "KSX",
      url: SITE_URL,
      description:
        "KS Warrior hub for Minecraft tools, free Minecraft hosting, free VPS lists, panels, clients, and community links.",
      stack: {
        backend: "Express (local) + Hono (Cloudflare Workers) + TypeScript",
        frontend: "Vite + React 18 + React Router + TypeScript",
        deploy: "Cloudflare Workers with assets (wrangler) or Pages + Worker",
      },
      counts: {
        categories: sitemap.length,
        sections: sitemap.reduce((sum, c) => sum + c.sections.length, 0),
        pages: pages.length,
        minecraftHosts: minecraft.length,
        vpsHosts: vps.length,
      },
      categories: sitemap.map((c) => c.category),
      pages,
      apiEndpoints: [
        "GET /api/health",
        "GET /api/stats",
        "GET /api/sitemap",
        "GET /api/sitemap/search?q=",
        "GET /api/hosting/minecraft?q=&uptime=&location=&ram=",
        "GET /api/hosting/vps?q=&type=&renew=&sudo=&alwaysOn=",
        "GET /api/social",
      ],
      dataFiles: [
        "backend/src/data/sitemap.json",
        "backend/src/data/minecraft-hosting.json",
        "backend/src/data/vps-hosting.json",
      ],
    });
  }
);

server.registerTool(
  "ksx_get_sitemap",
  {
    title: "Get KSX sitemap",
    description:
      "List KSX site categories, sections, and page URLs. Optionally filter by category or section and include SVG icons.",
    inputSchema: {
      category: z.string().optional().describe("Case-insensitive category filter, e.g. Minecraft or VPS"),
      section: z.string().optional().describe("Case-insensitive section filter, e.g. Hosting or Make Server"),
      includeIcons: z.boolean().optional().describe("Include the inline SVG icon/logo strings (large)"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ category, section, includeIcons }) => {
    const { sitemap } = loadData();
    let result = includeIcons ? sitemap : stripIcons(sitemap);
    if (category) {
      result = result.filter((c) => includes(c.category, category));
    }
    if (section) {
      result = result
        .map((c) => ({ ...c, sections: c.sections.filter((s) => includes(s.title, section)) }))
        .filter((c) => c.sections.length > 0);
    }
    return text({
      count: result.reduce((sum, c) => sum + c.sections.reduce((n, s) => n + s.pages.length, 0), 0),
      categories: result,
    });
  }
);

server.registerTool(
  "ksx_search_pages",
  {
    title: "Search KSX pages",
    description:
      "Search KSX pages by page name, section title, or category. Returns matching routes from the sitemap.",
    inputSchema: {
      query: z.string().min(1).describe("Search text, e.g. hosting, server, java, vps"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ query }) => {
    const { sitemap } = loadData();
    const matches = flattenSitemap(sitemap).filter(
      (page) => includes(page.name, query) || includes(page.section, query) || includes(page.category, query)
    );
    return text({ query, count: matches.length, results: matches });
  }
);

server.registerTool(
  "ksx_find_minecraft_hosting",
  {
    title: "Find free Minecraft hosting",
    description:
      "Find free Minecraft server hosts from the KSX list. Filter by name, location, uptime status, and minimum RAM.",
    inputSchema: {
      query: z.string().optional().describe("Case-insensitive host name filter"),
      location: z.string().optional().describe("Case-insensitive location filter, e.g. Germany, USA, India"),
      uptime: z.string().optional().describe("Exact uptime status, e.g. good, danger, excellent (always-on)"),
      minRam: z.number().nonnegative().optional().describe("Minimum RAM in GB"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ query, location, uptime, minRam }) => {
    const { minecraft } = loadData();
    const data = minecraft.filter((host) => {
      if (query && !includes(host.name, query)) return false;
      if (location && !includes(host.location, location)) return false;
      if (uptime && String(host.uptime).toLowerCase() !== uptime.toLowerCase()) return false;
      if (minRam !== undefined) {
        const ram = Number(host.ram);
        if (!Number.isFinite(ram) || ram < minRam) return false;
      }
      return true;
    });
    return text({
      count: data.length,
      filters: { query, location, uptime, minRam },
      data,
    });
  }
);

server.registerTool(
  "ksx_find_vps_hosting",
  {
    title: "Find free VPS hosting",
    description:
      "Find free VPS, cloud shell, IDE, notebook, or sandbox providers from the KSX list. Filter by name, type, location, renewal, sudo, and always-on support. Includes verification requirements and usage limits.",
    inputSchema: {
      query: z.string().optional().describe("Case-insensitive provider name filter"),
      type: z.string().optional().describe("Case-insensitive type filter, e.g. VPS, Cloud shell, Cloud IDE, Notebook"),
      location: z.string().optional().describe("Case-insensitive location filter, e.g. Global, USA, Europe"),
      renew: z.boolean().optional().describe("Whether the free quota renews"),
      sudo: z.boolean().optional().describe("Whether sudo/root is available"),
      alwaysOn: z.boolean().optional().describe("Whether the instance can stay always-on"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ query, type, location, renew, sudo, alwaysOn }) => {
    const { vps } = loadData();
    const data = vps.filter((host) => {
      if (query && !includes(host.name, query)) return false;
      if (type && !includes(host.type, type)) return false;
      if (location && !includes(host.location, location)) return false;
      if (renew !== undefined && host.renew !== renew) return false;
      if (sudo !== undefined && host.sudo !== sudo) return false;
      if (alwaysOn !== undefined && host.alwaysOn !== alwaysOn) return false;
      return true;
    });
    return text({
      count: data.length,
      filters: { query, type, location, renew, sudo, alwaysOn },
      data,
    });
  }
);

server.registerTool(
  "ksx_get_social_stats",
  {
    title: "Get KSX social stats",
    description:
      "Fetch live YouTube subscriber, Discord member, and Instagram follower counts from the KSX API. Requires the API to be reachable; set KSX_API_BASE or run the local backend on port 8080.",
    annotations: { readOnlyHint: true },
  },
  async () => {
    try {
      const response = await fetchJson("/api/social");
      if (!response.ok) {
        return fail(`KSX API ${response.url} returned HTTP ${response.status}: ${JSON.stringify(response.body)}`);
      }
      return text(response.body);
    } catch (error) {
      return fail(
        `Could not reach the KSX API at ${API_BASE}. Start it with "npm run dev:backend" or set KSX_API_BASE. Error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
);

server.registerTool(
  "ksx_api_get",
  {
    title: "GET a KSX API endpoint",
    description:
      "Call a read-only KSX API path such as /api/sitemap or /api/hosting/vps?alwaysOn=true. Only paths starting with /api/ are allowed.",
    inputSchema: {
      path: z
        .string()
        .startsWith("/api/")
        .describe("API path including query string, e.g. /api/sitemap/search?q=hosting"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ path }) => {
    if (path.includes("..")) return fail("Path traversal is not allowed.");
    try {
      const response = await fetchJson(path);
      return text(response);
    } catch (error) {
      return fail(
        `Could not reach the KSX API at ${API_BASE}. Start it with "npm run dev:backend" or set KSX_API_BASE. Error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
);

server.registerResource(
  "ksx-sitemap",
  "ksx://sitemap",
  {
    title: "KSX sitemap",
    description: "Full KSX sitemap without inline SVG icons",
    mimeType: "application/json",
  },
  async (uri) => {
    const { sitemap } = loadData();
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(stripIcons(sitemap), null, 2),
        },
      ],
    };
  }
);

server.registerResource(
  "ksx-minecraft-hosting",
  "ksx://hosting/minecraft",
  {
    title: "Free Minecraft hosting list",
    description: "KSX free Minecraft host list with RAM, CPU, disk, location, uptime, and link",
    mimeType: "application/json",
  },
  async (uri) => {
    const { minecraft } = loadData();
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(minecraft, null, 2),
        },
      ],
    };
  }
);

server.registerResource(
  "ksx-vps-hosting",
  "ksx://hosting/vps",
  {
    title: "Free VPS hosting list",
    description: "KSX free compute provider list with type, RAM, CPU, disk, location, verification, limits, notes, renewal, sudo, and always-on flags",
    mimeType: "application/json",
  },
  async (uri) => {
    const { vps } = loadData();
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(vps, null, 2),
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[ksx-mcp] ready (data: ${DATA_DIR}, api: ${API_BASE})`);
