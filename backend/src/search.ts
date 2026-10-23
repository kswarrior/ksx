import type { SearchItem, SitemapCategory } from "./types.js";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "can",
  "do",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "the",
  "to",
  "what",
  "where",
  "with",
  "you",
  "your",
]);

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

type IndexedItem = {
  item: SearchItem;
  tokens: Record<Field, string[]>;
  normalized: Record<Field, string>;
};

export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function stem(token: string): string {
  if (token.length > 4 && token.endsWith("ies")) {
    return `${token.slice(0, -3)}y`;
  }
  if (token.length > 4 && token.endsWith("ses")) {
    return token.slice(0, -2);
  }
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

export function searchTokens(value: string): string[] {
  const seen = new Set<string>();
  const tokens: string[] = [];
  for (const token of normalizeSearchText(value).split(" ")) {
    if (!token || STOP_WORDS.has(token)) continue;
    const stemmed = stem(token);
    if (seen.has(stemmed)) continue;
    seen.add(stemmed);
    tokens.push(stemmed);
  }
  return tokens;
}

function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  let current = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    let rowMin = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost
      );
      if (current[j] < rowMin) rowMin = current[j];
    }
    if (rowMin > max) return max + 1;
    [previous, current] = [current, previous];
  }
  return previous[b.length];
}

function matchQuality(queryToken: string, textToken: string): number {
  if (queryToken === textToken) return 1;
  if (queryToken.length < 3 || textToken.length < 3) return 0;
  if (textToken.startsWith(queryToken) || queryToken.startsWith(textToken)) {
    return 0.85;
  }
  const maxDistance = queryToken.length >= 7 ? 2 : 1;
  if (Math.abs(queryToken.length - textToken.length) > maxDistance) return 0;
  const distance = editDistance(queryToken, textToken, maxDistance);
  if (distance === 1) return 0.6;
  if (distance === 2) return 0.4;
  return 0;
}

function bestMatch(tokens: string[], queryToken: string): number {
  let best = 0;
  for (const textToken of tokens) {
    const quality = matchQuality(queryToken, textToken);
    if (quality > best) {
      best = quality;
      if (best === 1) break;
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

function indexItem(item: SearchItem): IndexedItem {
  const description = item.description ?? "";
  const keywords = (item.keywords ?? []).join(" ");
  const urlText = item.url.replace(/\.html$/i, "").replace(/[/._-]+/g, " ");
  return {
    item,
    tokens: {
      name: searchTokens(item.name),
      keywords: searchTokens(keywords),
      description: searchTokens(description),
      section: searchTokens(item.title),
      category: searchTokens(item.category),
      url: searchTokens(urlText),
    },
    normalized: {
      name: normalizeSearchText(item.name),
      keywords: normalizeSearchText(keywords),
      description: normalizeSearchText(description),
      section: normalizeSearchText(item.title),
      category: normalizeSearchText(item.category),
      url: normalizeSearchText(urlText),
    },
  };
}

function scoreIndexedItem(
  entry: IndexedItem,
  queryTokens: string[],
  phrase: string
): number {
  let score = 0;
  let matched = 0;
  let nameMatched = 0;

  for (const queryToken of queryTokens) {
    let best = 0;
    let total = 0;
    let nameQuality = 0;
    for (const field of FIELDS) {
      const quality = bestMatch(entry.tokens[field], queryToken);
      if (quality === 0) continue;
      const fieldScore = quality * FIELD_WEIGHTS[field];
      total += fieldScore;
      if (fieldScore > best) best = fieldScore;
      if (field === "name") nameQuality = quality;
    }
    if (best === 0) continue;
    matched += 1;
    if (nameQuality > 0) nameMatched += 1;
    score += best + (total - best) * 0.3;
  }

  if (matched === 0 || matched < Math.ceil(queryTokens.length * 0.5)) {
    return 0;
  }

  const coverage = matched / queryTokens.length;
  score *= 0.35 + 0.65 * coverage;
  if (coverage === 1) score += 80;

  if (entry.normalized.name === phrase) score += 500;
  else if (entry.normalized.name.startsWith(phrase)) score += 220;
  else if (entry.normalized.name.includes(phrase)) score += 130;

  if (entry.normalized.keywords.includes(phrase)) score += 90;
  if (entry.normalized.description.includes(phrase)) score += 45;
  if (entry.normalized.section.includes(phrase)) score += 40;
  if (entry.normalized.category.includes(phrase)) score += 40;

  if (nameMatched === queryTokens.length) score += 120;
  else if (nameMatched > 0) score += nameMatched * 18;

  score += pairScore(entry.normalized.name, queryTokens) * 30;
  score += pairScore(entry.normalized.keywords, queryTokens) * 15;
  score += pairScore(entry.normalized.description, queryTokens) * 6;
  score += pairScore(entry.normalized.section, queryTokens) * 8;
  score += pairScore(entry.normalized.category, queryTokens) * 8;

  return score;
}

export function scoreSearchItem(item: SearchItem, query: string): number {
  const queryTokens = searchTokens(query);
  if (queryTokens.length === 0) return 0;
  return scoreIndexedItem(indexItem(item), queryTokens, queryTokens.join(" "));
}

export function searchSitemap(
  sitemap: SitemapCategory[],
  query: string
): SearchItem[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const queryTokens = searchTokens(trimmed);
  if (queryTokens.length === 0) return [];
  const phrase = queryTokens.join(" ");

  return flattenSitemap(sitemap)
    .map((item) => ({
      item,
      score: scoreIndexedItem(indexItem(item), queryTokens, phrase),
    }))
    .filter((result) => result.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.item.name.localeCompare(b.item.name) ||
        a.item.url.localeCompare(b.item.url)
    )
    .map((result) => result.item);
}
