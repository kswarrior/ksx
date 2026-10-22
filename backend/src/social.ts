import type {
  SocialEnv,
  SocialPlatformName,
  SocialStat,
  SocialStats,
} from "./types.js";

const CACHE_TTL_MS = 5 * 60 * 1000;
const FAILURE_CACHE_TTL_MS = 60_000;
const REQUEST_TIMEOUT_MS = 10_000;

const DEFAULTS = {
  youtubeHandle: "ks_warrior_pro",
  discordInvite: "jDG7tJrHrt",
  instagramUsername: "ks_warrior_pro",
};

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
};

type ResolvedConfig = {
  youtubeHandle: string;
  youtubeApiKey?: string;
  discordInvite: string;
  instagramUsername: string;
  instagramAccessToken?: string;
  instagramUserId?: string;
};

type CacheEntry = {
  key: string;
  expiresAt: number;
  value: SocialStats;
};

let cache: CacheEntry | null = null;

function resolveConfig(env: SocialEnv): ResolvedConfig {
  return {
    youtubeHandle: cleanHandle(env.YOUTUBE_HANDLE) ?? DEFAULTS.youtubeHandle,
    youtubeApiKey: env.YOUTUBE_API_KEY?.trim() || undefined,
    discordInvite: normalizeInvite(env.DISCORD_INVITE_CODE) ?? DEFAULTS.discordInvite,
    instagramUsername:
      cleanHandle(env.INSTAGRAM_USERNAME) ?? DEFAULTS.instagramUsername,
    instagramAccessToken: env.INSTAGRAM_ACCESS_TOKEN?.trim() || undefined,
    instagramUserId: env.INSTAGRAM_USER_ID?.trim() || undefined,
  };
}

function cleanHandle(value?: string): string | undefined {
  const handle = value?.trim().replace(/^@/, "").replace(/\/+$/, "");
  return handle || undefined;
}

function normalizeInvite(value?: string): string | undefined {
  const match = value
    ?.trim()
    .match(/(?:discord\.gg\/|discord\.com\/invite\/)?([A-Za-z0-9-]+)/);
  return match?.[1];
}

function cacheKey(config: ResolvedConfig): string {
  return JSON.stringify({
    youtubeHandle: config.youtubeHandle,
    youtubeApi: Boolean(config.youtubeApiKey),
    discordInvite: config.discordInvite,
    instagramUsername: config.instagramUsername,
    instagramGraph: Boolean(
      config.instagramAccessToken && config.instagramUserId
    ),
  });
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function parseCompactCount(raw: string): number | null {
  const match = raw.trim().replace(/,/g, "").match(/^(\d+(?:\.\d+)?)\s*([KMB])?/i);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;
  const unit = match[2]?.toUpperCase();
  const multiplier = unit === "B" ? 1e9 : unit === "M" ? 1e6 : unit === "K" ? 1e3 : 1;
  return Math.round(value * multiplier);
}

function parseSubscriberText(raw: string): { count: number; display: string } | null {
  const match = raw.match(/([\d.,]+)\s*([KMB])?\s+subscribers?/i);
  if (!match) return null;
  const display = `${match[1]}${match[2]?.toUpperCase() ?? ""}`;
  const count = parseCompactCount(display);
  return count === null ? null : { count, display };
}

function parseFollowerText(raw: string): { count: number; display: string } | null {
  const match = raw.match(/([\d.,]+)\s*([KMB])?\s+followers?/i);
  if (!match) return null;
  const display = `${match[1]}${match[2]?.toUpperCase() ?? ""}`;
  const count = parseCompactCount(display);
  return count === null ? null : { count, display };
}

function formatCount(count: number): string {
  return new Intl.NumberFormat("en-US").format(count);
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function unavailable(
  platform: SocialPlatformName,
  url: string,
  handle: string,
  label: SocialStat["label"],
  error: string
): SocialStat {
  return {
    platform,
    url,
    handle,
    label,
    count: null,
    display: null,
    available: false,
    source: "unavailable",
    error,
    fetchedAt: new Date().toISOString(),
  };
}

function parseYouTubeSubscriberHtml(
  html: string
): { count: number; display: string } | null {
  const patterns = [
    /"subscriberCountText"\s*:\s*\{\s*"simpleText"\s*:\s*"([^"]+)"/,
    /"subscriberCountText"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([^"]+)"/,
    /"subscriberCountText"\s*:\s*"([^"]+)"/,
    /"content"\s*:\s*"([\d.,]+\s*[KMB]?\s+subscribers?)"/i,
    /([\d.,]+\s*[KMB]?\s+subscribers?)/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    const parsed = match ? parseSubscriberText(match[1]) : null;
    if (parsed) return parsed;
  }
  return null;
}

async function getYouTubeStats(config: ResolvedConfig): Promise<SocialStat> {
  const url = `https://youtube.com/@${config.youtubeHandle}`;
  const label = "subscribers" as const;

  if (config.youtubeApiKey) {
    try {
      const apiUrl =
        "https://www.googleapis.com/youtube/v3/channels?part=statistics" +
        `&forHandle=${encodeURIComponent(`@${config.youtubeHandle}`)}` +
        `&key=${encodeURIComponent(config.youtubeApiKey)}`;
      const res = await fetchWithTimeout(apiUrl, { headers: { Accept: "application/json" } });
      const json = (await res.json()) as {
        items?: { statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean } }[];
        error?: { message?: string };
      };
      if (!res.ok) {
        throw new Error(json.error?.message ?? `YouTube API HTTP ${res.status}`);
      }
      const stats = json.items?.[0]?.statistics;
      if (stats?.hiddenSubscriberCount) {
        throw new Error("YouTube subscriber count is hidden");
      }
      const count = Number(stats?.subscriberCount);
      if (!Number.isFinite(count)) throw new Error("YouTube subscriber count missing");
      return {
        platform: "youtube",
        url,
        handle: config.youtubeHandle,
        label,
        count,
        display: formatCount(count),
        available: true,
        source: "youtube-api",
        fetchedAt: new Date().toISOString(),
      };
    } catch {
      // Fall through to the public channel page.
    }
  }

  const pageUrls = [
    `https://www.youtube.com/@${config.youtubeHandle}/about?hl=en&gl=US`,
    `https://www.youtube.com/@${config.youtubeHandle}?hl=en&gl=US`,
  ];
  const errors: string[] = [];

  for (const pageUrl of pageUrls) {
    try {
      const res = await fetchWithTimeout(pageUrl, {
        headers: {
          ...BROWSER_HEADERS,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9",
          Cookie: "CONSENT=YES+cb.20240101-00-p0.en+FX+111; SOCS=CAI",
        },
      });
      if (!res.ok) throw new Error(`YouTube page HTTP ${res.status}`);
      const html = await res.text();
      const parsed = parseYouTubeSubscriberHtml(html);
      if (!parsed) throw new Error("YouTube subscriber count not found");
      return {
        platform: "youtube",
        url,
        handle: config.youtubeHandle,
        label,
        count: parsed.count,
        display: parsed.display,
        available: true,
        source: "youtube-page",
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      errors.push(errorMessage(error));
    }
  }

  return unavailable(
    "youtube",
    url,
    config.youtubeHandle,
    label,
    errors.join("; ") || "YouTube subscriber count unavailable"
  );
}

async function getDiscordStats(config: ResolvedConfig): Promise<SocialStat> {
  const url = `https://discord.gg/${config.discordInvite}`;
  const label = "members" as const;

  try {
    const res = await fetchWithTimeout(
      `https://discord.com/api/v10/invites/${encodeURIComponent(config.discordInvite)}?with_counts=true&with_expiration=true`,
      { headers: { Accept: "application/json", "User-Agent": "KSX-SocialStats/1.0" } }
    );
    const json = (await res.json()) as {
      message?: string;
      approximate_member_count?: number;
      approximate_presence_count?: number;
      guild?: { name?: string };
    };
    if (!res.ok) throw new Error(json.message ?? `Discord API HTTP ${res.status}`);
    if (typeof json.approximate_member_count !== "number") {
      throw new Error("Discord member count unavailable");
    }
    return {
      platform: "discord",
      url,
      handle: config.discordInvite,
      label,
      count: json.approximate_member_count,
      display: formatCount(json.approximate_member_count),
      available: true,
      source: "discord-invite",
      online: json.approximate_presence_count ?? null,
      name: json.guild?.name,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return unavailable("discord", url, config.discordInvite, label, errorMessage(error));
  }
}

function instagramStat(
  config: ResolvedConfig,
  count: number,
  source: SocialStat["source"]
): SocialStat {
  return {
    platform: "instagram",
    url: `https://instagram.com/${config.instagramUsername}`,
    handle: config.instagramUsername,
    label: "followers",
    count,
    display: formatCount(count),
    available: true,
    source,
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchInstagramGraphCount(config: ResolvedConfig): Promise<number> {
  if (!config.instagramAccessToken) {
    throw new Error("Instagram access token not configured");
  }

  const token = encodeURIComponent(config.instagramAccessToken);
  const urls: string[] = [];

  if (config.instagramUserId) {
    urls.push(
      `https://graph.facebook.com/v23.0/${encodeURIComponent(config.instagramUserId)}` +
        `?fields=followers_count,username&access_token=${token}`
    );
  }
  urls.push(
    `https://graph.instagram.com/v23.0/me` +
      `?fields=user_id,username,followers_count&access_token=${token}`
  );

  let lastError: unknown = null;
  for (const graphUrl of urls) {
    try {
      const res = await fetchWithTimeout(graphUrl, {
        headers: { Accept: "application/json" },
      });
      const json = (await res.json()) as {
        followers_count?: number;
        error?: { message?: string };
      };
      if (!res.ok) {
        throw new Error(json.error?.message ?? `Instagram API HTTP ${res.status}`);
      }
      if (typeof json.followers_count !== "number") {
        throw new Error("Instagram follower count missing");
      }
      return json.followers_count;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Instagram follower count unavailable");
}

async function getInstagramStats(config: ResolvedConfig): Promise<SocialStat> {
  const url = `https://instagram.com/${config.instagramUsername}`;
  const label = "followers" as const;
  const errors: string[] = [];

  if (config.instagramAccessToken) {
    try {
      const count = await fetchInstagramGraphCount(config);
      return instagramStat(config, count, "instagram-graph");
    } catch (error) {
      errors.push(errorMessage(error));
    }
  }

  try {
    const res = await fetchWithTimeout(
      `https://www.instagram.com/${encodeURIComponent(config.instagramUsername)}/`,
      {
        headers: {
          ...BROWSER_HEADERS,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9",
        },
      },
      15_000
    );
    if (!res.ok) throw new Error(`Instagram page HTTP ${res.status}`);
    const html = await res.text();
    const patterns = [
      /"edge_followed_by"\s*:\s*\{\s*"count"\s*:\s*(\d+)/,
      /"follower_count"\s*:\s*(\d+)/,
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        const count = Number(match[1]);
        if (Number.isFinite(count)) {
          return instagramStat(config, count, "instagram-public");
        }
      }
    }
    const textMatch = html.match(/([\d.,]+)\s*([KMB])?\s+followers?/i);
    const textCount = textMatch
      ? parseCompactCount(`${textMatch[1]}${textMatch[2]?.toUpperCase() ?? ""}`)
      : null;
    if (textCount !== null) {
      return instagramStat(config, textCount, "instagram-public");
    }
    throw new Error("Instagram profile requires login");
  } catch (error) {
    errors.push(errorMessage(error));
  }

  try {
    const res = await fetchWithTimeout(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(config.instagramUsername)}`,
      {
        headers: {
          ...BROWSER_HEADERS,
          Accept: "application/json",
          "x-ig-app-id": "936619743392459",
          "x-ig-www-claim": "0",
          "x-asbd-id": "129477",
          "X-Requested-With": "XMLHttpRequest",
          Origin: "https://www.instagram.com",
          Referer: `https://www.instagram.com/${config.instagramUsername}/`,
        },
      }
    );
    const json = (await res.json()) as {
      data?: { user?: { edge_followed_by?: { count?: number } } };
      message?: string;
    };
    const count = json.data?.user?.edge_followed_by?.count;
    if (typeof count === "number") {
      return instagramStat(config, count, "instagram-public");
    }
    errors.push(json.message ?? "Instagram public profile unavailable");
  } catch (error) {
    errors.push(errorMessage(error));
  }

  try {
    const res = await fetchWithTimeout(
      `https://r.jina.ai/http://www.instagram.com/${encodeURIComponent(config.instagramUsername)}/`,
      { headers: { Accept: "text/plain" } },
      15_000
    );
    if (!res.ok) throw new Error(`Instagram reader HTTP ${res.status}`);
    const text = await res.text();
    const parsed = parseFollowerText(text);
    if (!parsed) throw new Error("Instagram follower count not found");
    return instagramStat(config, parsed.count, "instagram-public");
  } catch (error) {
    errors.push(errorMessage(error));
  }

  return unavailable(
    "instagram",
    url,
    config.instagramUsername,
    label,
    config.instagramAccessToken
      ? errors.join("; ") || "Instagram follower count unavailable"
      : "Set INSTAGRAM_ACCESS_TOKEN to read live Instagram followers"
  );
}

type GetSocialStatsOptions = {
  force?: boolean;
};

export async function getSocialStats(
  env: SocialEnv = {},
  options: GetSocialStatsOptions = {}
): Promise<SocialStats> {
  const config = resolveConfig(env);
  const key = cacheKey(config);
  const now = Date.now();
  if (!options.force && cache && cache.key === key && cache.expiresAt > now) {
    return cache.value;
  }

  const [youtube, discord, instagram] = await Promise.all([
    getYouTubeStats(config),
    getDiscordStats(config),
    getInstagramStats(config),
  ]);

  const value: SocialStats = {
    updatedAt: new Date().toISOString(),
    platforms: { youtube, discord, instagram },
  };
  const hasLiveData = Object.values(value.platforms).some((platform) => platform.available);
  cache = {
    key,
    expiresAt: now + (hasLiveData ? CACHE_TTL_MS : FAILURE_CACHE_TTL_MS),
    value,
  };
  return value;
}
