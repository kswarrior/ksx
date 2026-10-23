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
    website: loadJson("website-hosting.json"),
    database: loadJson("database-hosting.json"),
  };
}

function stripIcons(sitemap) {
  return sitemap.map((category) => ({
    category: category.category,
    sections: category.sections.map((section) => ({
      title: section.title,
      pages: section.pages.map((page) => ({
        name: page.name,
        url: page.url,
        ...(page.description ? { description: page.description } : {}),
        ...(page.keywords?.length ? { keywords: page.keywords } : {}),
        ...(page.soon ? { soon: true } : {}),
      })),
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
        ...(page.description ? { description: page.description } : {}),
        ...(page.keywords?.length ? { keywords: page.keywords } : {}),
        ...(page.soon ? { soon: true } : {}),
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

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "can", "do", "for",
  "from", "how", "i", "in", "is", "it", "me", "my", "of", "on", "or",
  "the", "to", "what", "where", "with", "you", "your",
]);

function normalizeText(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function stem(token) {
  if (token.length > 4 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.length > 4 && token.endsWith("ses")) return token.slice(0, -2);
  if (
    token.length > 3 &&
    token.endsWith("s") &&
    !token.endsWith("ss") &&
    !token.endsWith("us") &&
    !token.endsWith("is")
  ) {
    return token.slice(0, -1);
  }
  return token;
}

function searchTokens(value) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token && !STOP_WORDS.has(token))
    .map(stem);
}

function tokensMatch(queryToken, textToken) {
  if (queryToken === textToken) return true;
  if (Math.min(queryToken.length, textToken.length) < 3) return false;
  return textToken.startsWith(queryToken);
}

function scorePage(page, query) {
  const phrase = normalizeText(query);
  if (!phrase) return 0;
  const fields = {
    name: { text: normalizeText(page.name), weight: 60 },
    keywords: { text: normalizeText((page.keywords ?? []).join(" ")), weight: 32 },
    description: { text: normalizeText(page.description ?? ""), weight: 16 },
    section: { text: normalizeText(page.section), weight: 16 },
    category: { text: normalizeText(page.category), weight: 18 },
  };
  const queryTokens = searchTokens(query);
  if (queryTokens.length === 0) {
    return Object.values(fields).some((field) => field.text.includes(phrase)) ? 1 : 0;
  }
  let score = 0;
  for (const queryToken of queryTokens) {
    let tokenScore = 0;
    for (const field of Object.values(fields)) {
      const fieldTokens = field.text.split(" ").map(stem);
      if (fieldTokens.some((textToken) => tokensMatch(queryToken, textToken))) {
        tokenScore += field.weight;
      }
    }
    if (tokenScore === 0) return 0;
    score += tokenScore;
  }
  if (fields.name.text === phrase) score += 400;
  else if (fields.name.text.startsWith(phrase)) score += 120;
  if (fields.name.text.includes(phrase)) score += 90;
  if (fields.keywords.text.includes(phrase)) score += 70;
  if (fields.description.text.includes(phrase)) score += 35;
  return score;
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
    const { sitemap, minecraft, vps, website, database } = loadData();
    const pages = flattenSitemap(sitemap);
    return text({
      name: "KSX",
      url: SITE_URL,
      description:
        "KS Warrior hub for Minecraft tools, free Minecraft hosting, free VPS lists, free website hosting, free database hosting, panels, clients, and community links.",
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
        websiteHosts: website.length,
        databaseHosts: database.length,
      },
      categories: sitemap.map((c) => c.category),
      pages,
      apiEndpoints: [
        "GET /api/health",
        "GET /api/stats",
        "GET /api/sitemap",
        "GET /api/sitemap/search?q=",
        "GET /api/hosting/minecraft?q=&uptime=&alwaysOn=&location=&ram=",
        "GET /api/hosting/vps?q=&type=&renew=&sudo=&alwaysOn=",
        "GET /api/hosting/website?q=&type=&customDomain=&ssl=&ads=&alwaysFree=",
        "GET /api/hosting/database?q=&type=&cardRequired=&backups=&alwaysFree=&ssl=",
        "GET /api/social",
      ],
      dataFiles: [
        "backend/src/data/sitemap.json",
        "backend/src/data/minecraft-hosting.json",
        "backend/src/data/vps-hosting.json",
        "backend/src/data/website-hosting.json",
        "backend/src/data/database-hosting.json",
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
      "Search KSX pages by name, description, keywords, section title, or category. Multi-word queries match in any order, so 'paid plugins' and 'plugins paid' both find the Paid Plugins page.",
    inputSchema: {
      query: z.string().min(1).describe("Search text, e.g. free minecraft hosting, plugins paid, java, vps"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ query }) => {
    const { sitemap } = loadData();
    const matches = flattenSitemap(sitemap)
      .map((page) => ({ page, score: scorePage(page, query) }))
      .filter((entry) => entry.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.page.name.localeCompare(b.page.name) ||
          a.page.url.localeCompare(b.page.url)
      )
      .map((entry) => entry.page);
    return text({ query, count: matches.length, results: matches });
  }
);

server.registerTool(
  "ksx_find_minecraft_hosting",
  {
    title: "Find free Minecraft hosting",
    description:
      "Find free Minecraft server hosts from the KSX list. Filter by name, location, always-on support, minimum RAM, or legacy uptime status. Includes player slots, verification, limits, and notes.",
    inputSchema: {
      query: z.string().optional().describe("Case-insensitive host name filter"),
      location: z.string().optional().describe("Case-insensitive location filter, e.g. Germany, USA, India"),
      alwaysOn: z.boolean().optional().describe("Whether the free server stays online when empty"),
      uptime: z.string().optional().describe("Legacy exact uptime status, e.g. good, danger, excellent (always-on)"),
      minRam: z.number().nonnegative().optional().describe("Minimum RAM in GB"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ query, location, alwaysOn, uptime, minRam }) => {
    const { minecraft } = loadData();
    const data = minecraft.filter((host) => {
      if (query && !includes(host.name, query)) return false;
      if (location && !includes(host.location, location)) return false;
      if (alwaysOn !== undefined && host.alwaysOn !== alwaysOn) return false;
      if (uptime && String(host.uptime).toLowerCase() !== uptime.toLowerCase()) return false;
      if (minRam !== undefined) {
        const ram = Number(host.ram);
        if (!Number.isFinite(ram) || ram < minRam) return false;
      }
      return true;
    });
    return text({
      count: data.length,
      filters: { query, location, alwaysOn, uptime, minRam },
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
  "ksx_find_website_hosting",
  {
    title: "Find free website hosting",
    description:
      "Find free website hosting providers, static hosts, and site builders from the KSX list. Filter by name, type, custom domain, SSL, ads, and always-free status. Includes storage, traffic, site limits, verification requirements, and notes.",
    inputSchema: {
      query: z.string().optional().describe("Case-insensitive provider name filter"),
      type: z.string().optional().describe("Case-insensitive type filter, e.g. Static, PHP, builder"),
      customDomain: z.boolean().optional().describe("Whether a free custom domain is supported"),
      ssl: z.boolean().optional().describe("Whether free SSL is included"),
      ads: z.boolean().optional().describe("Whether the free plan shows ads or forces branding"),
      alwaysFree: z.boolean().optional().describe("Whether the free tier has no time limit"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ query, type, customDomain, ssl, ads, alwaysFree }) => {
    const { website } = loadData();
    const data = website.filter((host) => {
      if (query && !includes(host.name, query)) return false;
      if (type && !includes(host.type, type)) return false;
      if (customDomain !== undefined && host.customDomain !== customDomain) return false;
      if (ssl !== undefined && host.ssl !== ssl) return false;
      if (ads !== undefined && host.ads !== ads) return false;
      if (alwaysFree !== undefined && host.alwaysFree !== alwaysFree) return false;
      return true;
    });
    return text({
      count: data.length,
      filters: { query, type, customDomain, ssl, ads, alwaysFree },
      data,
    });
  }
);

server.registerTool(
  "ksx_find_database_hosting",
  {
    title: "Find free database hosting",
    description:
      "Find always-free managed databases, caches, vector stores, and serverless data platforms from the KSX list. Filter by name, type, card requirement, backups, SSL, and always-free status. Includes storage, traffic, database limits, region, verification requirements, and notes.",
    inputSchema: {
      query: z.string().optional().describe("Case-insensitive provider name filter"),
      type: z.string().optional().describe("Case-insensitive type filter, e.g. PostgreSQL, SQLite, Vector"),
      cardRequired: z.boolean().optional().describe("Whether a credit card is required"),
      backups: z.boolean().optional().describe("Whether backups are included"),
      ssl: z.boolean().optional().describe("Whether TLS is included"),
      alwaysFree: z.boolean().optional().describe("Whether the free tier has no time limit"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ query, type, cardRequired, backups, ssl, alwaysFree }) => {
    const { database } = loadData();
    const data = database.filter((host) => {
      if (query && !includes(host.name, query)) return false;
      if (type && !includes(host.type, type)) return false;
      if (cardRequired !== undefined && host.cardRequired !== cardRequired) return false;
      if (backups !== undefined && (host.backups !== "None") !== backups) return false;
      if (ssl !== undefined && host.ssl !== ssl) return false;
      if (alwaysFree !== undefined && host.alwaysFree !== alwaysFree) return false;
      return true;
    });
    return text({
      count: data.length,
      filters: { query, type, cardRequired, backups, ssl, alwaysFree },
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
    description: "KSX free Minecraft host list with RAM, CPU, disk, players, location, always-on status, verification, limits, notes, and link",
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

server.registerResource(
  "ksx-website-hosting",
  "ksx://hosting/website",
  {
    title: "Free website hosting list",
    description: "KSX free website hosting list with type, storage, bandwidth, site limits, database, custom domain, SSL, ads, verification, limits, and notes",
    mimeType: "application/json",
  },
  async (uri) => {
    const { website } = loadData();
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(website, null, 2),
        },
      ],
    };
  }
);

server.registerResource(
  "ksx-database-hosting",
  "ksx://hosting/database",
  {
    title: "Free database hosting list",
    description: "KSX free database hosting list with type, storage, traffic, database limits, region, backups, SSL, card requirement, verification, limits, and notes",
    mimeType: "application/json",
  },
  async (uri) => {
    const { database } = loadData();
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(database, null, 2),
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[ksx-mcp] ready (data: ${DATA_DIR}, api: ${API_BASE})`);
