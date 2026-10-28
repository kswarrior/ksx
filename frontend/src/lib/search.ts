import type { SearchItem, SitemapCategory } from "./api";

const STOP_WORDS = new Set([
  "a",
  "about",
  "an",
  "and",
  "any",
  "are",
  "as",
  "at",
  "be",
  "best",
  "by",
  "can",
  "could",
  "did",
  "do",
  "does",
  "for",
  "from",
  "get",
  "give",
  "good",
  "how",
  "i",
  "in",
  "is",
  "it",
  "just",
  "looking",
  "me",
  "my",
  "need",
  "of",
  "on",
  "or",
  "please",
  "recommended",
  "show",
  "some",
  "something",
  "that",
  "the",
  "these",
  "this",
  "those",
  "to",
  "top",
  "want",
  "was",
  "were",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "will",
  "with",
  "without",
  "would",
  "you",
  "your",
]);

const SYNONYM_GROUPS = [
  ["minecraft", "mc", "mcpe", "mcjava", "mcbedrock"],
  [
    "free",
    "gratis",
    "freebie",
    "costless",
    "zero",
    "cheap",
    "budget",
    "affordable",
    "lowcost",
    "cost",
  ],
  ["download", "downloader", "dl"],
  ["plugin", "plugins", "plg"],
  [
    "database",
    "db",
    "sql",
    "mysql",
    "mariadb",
    "postgres",
    "postgresql",
    "sqlite",
    "mongodb",
    "redis",
  ],
  ["vps", "vm", "container"],
  ["website", "web", "site"],
  ["android", "apk", "mobile", "ios"],
  ["bot", "afk"],
  ["stats", "statics", "status", "lookup", "motd"],
  ["ip", "domain", "dns", "srv"],
  ["java", "jdk", "jre"],
  ["bedrock", "pe"],
  ["guide", "tutorial", "howto", "setup", "install"],
  ["store", "shop", "apps", "app"],
  ["panel", "dashboard", "controlpanel"],
  ["server", "servers"],
  ["host", "hosting", "hoster", "hosts"],
  ["always", "uptime", "online", "247", "24", "7"],
  ["paid", "premium"],
];

const TOKEN_REPLACEMENTS: Record<string, string> = {
  "0": "zero",
  "2": "to",
  "4": "for",
  "b": "be",
  "c": "see",
  "gr8": "great",
  "n": "and",
  "pls": "please",
  "plz": "please",
  "r": "are",
  "thx": "thanks",
  "u": "you",
  "ur": "your",
  "y": "why",
};

const ALIASES = new Map<string, string>();
for (const group of SYNONYM_GROUPS) {
  const canonical = group[0];
  for (const word of group) {
    ALIASES.set(word, canonical);
  }
}

const FIELDS = [
  "name",
  "keywords",
  "description",
  "section",
  "category",
  "url",
] as const;

type Field = (typeof FIELDS)[number];

const FIELD_WEIGHTS: Record<Field, number> = {
  name: 100,
  keywords: 50,
  description: 28,
  section: 32,
  category: 34,
  url: 8,
};

const CONTEXT_WEIGHTS: Record<Field, number> = {
  name: 150,
  keywords: 95,
  description: 50,
  section: 55,
  category: 55,
  url: 18,
};

const COMPACT_WEIGHTS: Record<Field, number> = {
  name: 190,
  keywords: 130,
  description: 60,
  section: 60,
  category: 55,
  url: 20,
};

const PAIR_WEIGHTS: Record<Field, number> = {
  name: 22,
  keywords: 12,
  description: 5,
  section: 7,
  category: 7,
  url: 2,
};

type IndexedField = {
  tokens: string[];
  variants: string[];
  normalized: string;
  rawCompact: string;
  canonicalCompact: string;
};

type IndexedItem = {
  item: SearchItem;
  fields: Record<Field, IndexedField>;
};

type QueryToken = {
  canonical: string;
  variants: string[];
};

type QueryAnalysis = {
  tokens: QueryToken[];
  canonical: string[];
  rawCompact: string;
  canonicalCompact: string;
};

type ScoreResult = {
  score: number;
  matched: number;
  coverage: number;
};

export type HighlightPart = { text: string; match: boolean };

export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['\u2019`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hasVowel(value: string): boolean {
  return /[aeiouy]/.test(value);
}

function stem(token: string): string {
  let word = token;
  if (word.length > 4 && word.endsWith("ies")) {
    word = `${word.slice(0, -3)}y`;
  } else if (word.length > 5 && word.endsWith("sses")) {
    word = word.slice(0, -2);
  } else if (word.length > 5 && /(?:x|z|ch|sh)es$/.test(word)) {
    word = word.slice(0, -2);
  } else if (word.length > 4 && word.endsWith("ses")) {
    word = word.slice(0, -1);
  } else if (
    word.length > 3 &&
    word.endsWith("s") &&
    !word.endsWith("ss") &&
    !word.endsWith("us") &&
    !word.endsWith("is")
  ) {
    word = word.slice(0, -1);
  }
  if (word.length > 5 && word.endsWith("ing")) {
    const base = word.slice(0, -3);
    if (hasVowel(base)) word = base;
  } else if (word.length > 4 && word.endsWith("ed")) {
    const base = word.slice(0, -2);
    if (hasVowel(base)) word = base;
  }
  if (word.length > 5 && word.endsWith("er")) {
    const base = word.slice(0, -2);
    if (hasVowel(base)) word = base;
  } else if (word.length > 5 && word.endsWith("ly")) {
    const base = word.slice(0, -2);
    if (hasVowel(base)) word = base;
  }
  if (word.length > 3 && /([^aeiouylsz])\1$/.test(word)) {
    word = word.slice(0, -1);
  }
  return word;
}

function replaceToken(token: string): string {
  return TOKEN_REPLACEMENTS[token] ?? token;
}

function canonicalize(token: string): string {
  const replaced = replaceToken(token);
  const aliased = ALIASES.get(replaced) ?? replaced;
  return stem(aliased);
}

function rawTokens(value: string): string[] {
  const tokens: string[] = [];
  for (const token of normalizeSearchText(value).split(" ")) {
    if (!token) continue;
    const replaced = replaceToken(token);
    if (!replaced || STOP_WORDS.has(replaced)) continue;
    tokens.push(replaced);
  }
  return tokens;
}

function variantsFor(raw: string, canonical: string): string[] {
  const variants = new Set<string>([
    raw,
    canonical,
    stem(raw),
    canonicalize(raw),
  ]);
  variants.delete("");
  return [...variants];
}

function buildQueryTokens(value: string): QueryToken[] {
  const merged = new Map<string, QueryToken>();
  for (const raw of rawTokens(value)) {
    const canonical = canonicalize(raw);
    if (!canonical) continue;
    const existing = merged.get(canonical);
    const variants = variantsFor(raw, canonical);
    if (existing) {
      for (const variant of variants) {
        if (!existing.variants.includes(variant)) existing.variants.push(variant);
      }
    } else {
      merged.set(canonical, { canonical, variants });
    }
  }
  return [...merged.values()];
}

function analyzeQuery(value: string): QueryAnalysis {
  const tokens = buildQueryTokens(value);
  const canonical = tokens.map((token) => token.canonical);
  const raw = rawTokens(value);
  return {
    tokens,
    canonical,
    rawCompact: raw.join(""),
    canonicalCompact: canonical.join(""),
  };
}

export function searchTokens(value: string): string[] {
  return buildQueryTokens(value).map((token) => token.canonical);
}

function maxEditDistance(length: number): number {
  if (length <= 2) return 0;
  if (length <= 5) return 1;
  if (length <= 11) return 2;
  return Math.min(3, Math.floor(length / 4));
}

function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () =>
    new Array<number>(cols).fill(0)
  );
  for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j;
  for (let i = 1; i < rows; i += 1) {
    let rowMin = i;
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        value = Math.min(value, matrix[i - 2][j - 2] + 1);
      }
      matrix[i][j] = value;
      if (value < rowMin) rowMin = value;
    }
    if (rowMin > max) return max + 1;
  }
  return matrix[a.length][b.length];
}

function matchQuality(a: string, b: string): number {
  if (a === b) return 1;
  const aLength = a.length;
  const bLength = b.length;
  if (Math.min(aLength, bLength) < 2) return 0;
  if (aLength >= 3 && bLength >= 3) {
    const shorter = Math.min(aLength, bLength);
    const longer = Math.max(aLength, bLength);
    const ratio = shorter / longer;
    if (a.startsWith(b) || b.startsWith(a)) {
      return 0.55 + 0.3 * ratio;
    }
    if (bLength >= 4 && ratio >= 0.7 && b.includes(a)) {
      return 0.5 + 0.25 * ratio;
    }
    if (aLength >= 4 && ratio >= 0.7 && a.includes(b)) {
      return 0.5 + 0.25 * ratio;
    }
  }
  const max = maxEditDistance(Math.max(aLength, bLength));
  if (max === 0 || Math.abs(aLength - bLength) > max) return 0;
  const distance = editDistance(a, b, max);
  if (distance > max) return 0;
  const ratio = Math.min(aLength, bLength) / Math.max(aLength, bLength);
  if (distance === 1) return 0.62 + 0.15 * ratio;
  if (distance === 2) return 0.42 + 0.15 * ratio;
  if (distance === 3) return 0.25 + 0.1 * ratio;
  return 0;
}

function bestMatch(textVariants: string[], queryVariants: string[]): number {
  let best = 0;
  for (const queryVariant of queryVariants) {
    for (const textVariant of textVariants) {
      const quality = matchQuality(queryVariant, textVariant);
      if (quality > best) {
        best = quality;
        if (best === 1) return 1;
      }
    }
  }
  return best;
}

function pairScore(text: string, queryTokens: string[]): number {
  let matches = 0;
  for (let i = 0; i < queryTokens.length; i += 1) {
    for (let j = i + 1; j < queryTokens.length; j += 1) {
      const a = queryTokens[i];
      const b = queryTokens[j];
      if (text.includes(`${a} ${b}`) || text.includes(`${b} ${a}`)) {
        matches += 1;
      }
    }
  }
  return matches;
}

function shortestWindow(textTokens: string[], queryTokens: string[]): number {
  const target = new Set(queryTokens);
  if (target.size === 0 || target.size > textTokens.length) return 0;
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < textTokens.length; i += 1) {
    if (!target.has(textTokens[i])) continue;
    const seen = new Set<string>();
    for (let j = i; j < textTokens.length; j += 1) {
      if (target.has(textTokens[j])) seen.add(textTokens[j]);
      if (seen.size === target.size) {
        const length = j - i + 1;
        if (length < best) best = length;
        break;
      }
    }
  }
  return Number.isFinite(best) ? best : 0;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function indexField(value: string): IndexedField {
  const raw = unique(rawTokens(value));
  const canonical = unique(raw.map(canonicalize).filter(Boolean));
  const variants = new Set<string>();
  for (const token of raw) {
    for (const variant of variantsFor(token, canonicalize(token))) {
      variants.add(variant);
    }
  }
  for (const token of canonical) {
    for (const variant of variantsFor(token, token)) {
      variants.add(variant);
    }
  }
  for (let i = 0; i < raw.length - 1; i += 1) {
    variants.add(`${raw[i]}${raw[i + 1]}`);
  }
  for (let i = 0; i < canonical.length - 1; i += 1) {
    variants.add(`${canonical[i]}${canonical[i + 1]}`);
  }
  return {
    tokens: canonical,
    variants: [...variants].filter(Boolean),
    normalized: canonical.join(" "),
    rawCompact: raw.join(""),
    canonicalCompact: canonical.join(""),
  };
}

function indexItem(item: SearchItem): IndexedItem {
  const description = item.description ?? "";
  const keywords = (item.keywords ?? []).join(" ");
  const urlText = item.url.replace(/\.html$/i, "").replace(/[/._-]+/g, " ");
  return {
    item,
    fields: {
      name: indexField(item.name),
      keywords: indexField(keywords),
      description: indexField(description),
      section: indexField(item.title),
      category: indexField(item.category),
      url: indexField(urlText),
    },
  };
}

function evaluateItem(entry: IndexedItem, query: QueryAnalysis): ScoreResult {
  const queryTokens = query.tokens;
  if (queryTokens.length === 0) {
    return { score: 0, matched: 0, coverage: 0 };
  }

  const fieldQualities: Record<Field, number[]> = {
    name: [],
    keywords: [],
    description: [],
    section: [],
    category: [],
    url: [],
  };

  let score = 0;
  let matched = 0;
  let qualitySum = 0;

  for (const queryToken of queryTokens) {
    let bestQuality = 0;
    let bestWeighted = 0;
    let totalWeighted = 0;
    for (const field of FIELDS) {
      const quality = bestMatch(
        entry.fields[field].variants,
        queryToken.variants
      );
      fieldQualities[field].push(quality);
      if (quality === 0) continue;
      const weighted = quality * FIELD_WEIGHTS[field];
      totalWeighted += weighted;
      if (weighted > bestWeighted) bestWeighted = weighted;
      if (quality > bestQuality) bestQuality = quality;
    }
    if (bestQuality === 0) continue;
    matched += 1;
    qualitySum += bestQuality;
    score += bestWeighted + (totalWeighted - bestWeighted) * 0.28;
  }

  if (matched === 0) return { score: 0, matched: 0, coverage: 0 };

  const coverage = matched / queryTokens.length;
  score *= 0.35 + 0.65 * coverage;
  score += coverage * coverage * 210;
  if (coverage === 1) score += 120;
  if (qualitySum > 0) score += qualitySum * 30;

  for (const field of FIELDS) {
    const qualities = fieldQualities[field];
    if (qualities.length === 0) continue;
    const minimum = Math.min(...qualities);
    if (queryTokens.length > 1 && minimum >= 0.55) {
      const fieldBonus =
        CONTEXT_WEIGHTS[field] *
        (field === "name" ? 1 : 0.55) *
        Math.min(1, minimum + 0.1);
      score += fieldBonus;
    }
    if (queryTokens.length > 1) {
      const window = shortestWindow(entry.fields[field].tokens, query.canonical);
      if (window > 0) {
        const slack = window - query.canonical.length;
        score += CONTEXT_WEIGHTS[field] / (1 + Math.max(0, slack) * 1.4);
      }
    }
  }

  score += pairScore(entry.fields.name.normalized, query.canonical) * PAIR_WEIGHTS.name;
  score +=
    pairScore(entry.fields.keywords.normalized, query.canonical) *
    PAIR_WEIGHTS.keywords;
  score +=
    pairScore(entry.fields.description.normalized, query.canonical) *
    PAIR_WEIGHTS.description;
  score +=
    pairScore(entry.fields.section.normalized, query.canonical) *
    PAIR_WEIGHTS.section;
  score +=
    pairScore(entry.fields.category.normalized, query.canonical) *
    PAIR_WEIGHTS.category;
  score += pairScore(entry.fields.url.normalized, query.canonical) * PAIR_WEIGHTS.url;

  if (query.rawCompact.length >= 6) {
    for (const field of FIELDS) {
      const compact = entry.fields[field].rawCompact;
      if (!compact) continue;
      let bonus = 0;
      if (compact === query.rawCompact) {
        bonus = COMPACT_WEIGHTS[field] * 1.35;
      } else if (compact.includes(query.rawCompact)) {
        bonus = COMPACT_WEIGHTS[field];
      }
      if (bonus > 0) score += bonus;
    }
  }

  if (query.canonicalCompact.length >= 5) {
    for (const field of FIELDS) {
      const compact = entry.fields[field].canonicalCompact;
      if (!compact) continue;
      if (compact === query.canonicalCompact) {
        score += COMPACT_WEIGHTS[field] * 0.9;
      } else if (compact.includes(query.canonicalCompact)) {
        score += COMPACT_WEIGHTS[field] * 0.6;
      }
    }
  }

  if (entry.fields.name.normalized === query.canonical.join(" ")) {
    score += 620;
  } else if (
    query.canonical.length > 0 &&
    entry.fields.name.normalized.startsWith(`${query.canonical.join(" ")} `)
  ) {
    score += 280;
  }

  const nameQualities = fieldQualities.name;
  const nameMatched = nameQualities.filter((quality) => quality > 0).length;
  if (nameMatched === queryTokens.length) score += 150;
  else if (nameMatched > 0) score += nameMatched * 20;

  return { score, matched, coverage };
}

function relevanceFloor(results: { score: number }[]): number {
  let best = 0;
  for (const result of results) {
    if (result.score > best) best = result.score;
  }
  return best * 0.1;
}

export function flattenSitemap(sitemap: SitemapCategory[]): SearchItem[] {
  const flat: SearchItem[] = [];
  for (const category of sitemap) {
    for (const section of category.sections) {
      for (const page of section.pages) {
        flat.push({
          category: category.category,
          icon: category.icon,
          title: section.title,
          sectionIcon: section.icon,
          name: page.name,
          url: page.url,
          logo: page.logo,
          logoUrl: page.logoUrl,
          description: page.description,
          keywords: page.keywords,
          soon: page.soon,
        });
      }
    }
  }
  return flat;
}

const itemIndexCache = new WeakMap<SearchItem[], IndexedItem[]>();

function indexItems(items: SearchItem[]): IndexedItem[] {
  const cached = itemIndexCache.get(items);
  if (cached) return cached;
  const indexed = items.map(indexItem);
  itemIndexCache.set(items, indexed);
  return indexed;
}

function runSearch(
  entries: IndexedItem[],
  query: string
): SearchItem[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const analysis = analyzeQuery(trimmed);
  if (analysis.tokens.length === 0) return [];

  const scored = entries.map((entry) => ({
    item: entry.item,
    ...evaluateItem(entry, analysis),
  }));
  const required = Math.max(1, Math.ceil(analysis.tokens.length * 0.5));
  const enough = scored.filter(
    (result) => result.matched >= required && result.score > 0
  );
  const pool =
    enough.length > 0
      ? enough
      : scored.filter((result) => result.matched > 0 && result.score > 0);
  const floor = relevanceFloor(pool);

  return pool
    .filter((result) => result.score >= floor)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.item.name.localeCompare(b.item.name) ||
        a.item.url.localeCompare(b.item.url)
    )
    .map((result) => result.item);
}

export function searchItems(
  items: SearchItem[],
  query: string
): SearchItem[] {
  return runSearch(indexItems(items), query);
}

export function highlightParts(text: string, query: string): HighlightPart[] {
  if (!text) return [{ text, match: false }];

  const analysis = analyzeQuery(query);
  if (analysis.tokens.length === 0) return [{ text, match: false }];

  const parts: HighlightPart[] = [];
  const wordPattern = /[A-Za-z0-9]+/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = wordPattern.exec(text)) !== null) {
    const word = match[0];
    const canonical = canonicalize(normalizeSearchText(word));
    if (!canonical) continue;
    const variants = variantsFor(normalizeSearchText(word), canonical);
    let quality = 0;
    for (const queryToken of analysis.tokens) {
      const current = bestMatch(variants, queryToken.variants);
      if (current > quality) quality = current;
      if (quality === 1) break;
    }
    if (quality < 0.6) continue;
    if (match.index > last) {
      parts.push({ text: text.slice(last, match.index), match: false });
    }
    parts.push({ text: word, match: true });
    last = match.index + word.length;
  }

  if (last < text.length) {
    parts.push({ text: text.slice(last), match: false });
  }

  return parts.length > 0 ? parts : [{ text, match: false }];
}
