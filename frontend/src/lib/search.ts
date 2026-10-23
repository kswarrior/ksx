import type { SearchItem, SitemapCategory } from "./api";

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
  name: 60,
  keywords: 32,
  description: 16,
  section: 16,
  category: 18,
  url: 8,
};

type IndexedItem = {
  item: SearchItem;
  tokens: Record<Field, string[]>;
  normalized: Record<Field, string>;
};

export type HighlightPart = { text: string; match: boolean };

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
  return normalizeSearchText(value)
    .split(" ")
    .filter((token) => token.length > 0 && !STOP_WORDS.has(token))
    .map(stem);
}

function tokensMatch(queryToken: string, textToken: string): boolean {
  if (queryToken === textToken) return true;
  if (Math.min(queryToken.length, textToken.length) < 3) return false;
  return (
    textToken.startsWith(queryToken) || queryToken.startsWith(textToken)
  );
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

function scoreIndexedItem(entry: IndexedItem, query: string): number {
  const phrase = normalizeSearchText(query);
  if (!phrase) return 0;

  const queryTokens = searchTokens(query);
  if (queryTokens.length === 0) {
    return FIELDS.some((field) => entry.normalized[field].includes(phrase))
      ? 1
      : 0;
  }

  let score = 0;
  for (const queryToken of queryTokens) {
    let tokenScore = 0;
    for (const field of FIELDS) {
      if (
        entry.tokens[field].some((textToken) =>
          tokensMatch(queryToken, textToken)
        )
      ) {
        tokenScore += FIELD_WEIGHTS[field];
      }
    }
    if (tokenScore === 0) return 0;
    score += tokenScore;
  }

  if (entry.normalized.name === phrase) score += 400;
  else if (entry.normalized.name.startsWith(phrase)) score += 120;
  if (entry.normalized.name.includes(phrase)) score += 90;
  if (entry.normalized.keywords.includes(phrase)) score += 70;
  if (entry.normalized.description.includes(phrase)) score += 35;
  if (entry.normalized.section.includes(phrase)) score += 25;

  const everyTokenInName = queryTokens.every((queryToken) =>
    entry.tokens.name.some((textToken) => tokensMatch(queryToken, textToken))
  );
  if (everyTokenInName) score += 60;
  else if (
    queryTokens.some((queryToken) =>
      entry.tokens.name.some((textToken) =>
        tokensMatch(queryToken, textToken)
      )
    )
  ) {
    score += 20;
  }

  return score;
}

export function searchItems(
  items: SearchItem[],
  query: string
): SearchItem[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return items
    .map((item) => ({ item, score: scoreIndexedItem(indexItem(item), trimmed) }))
    .filter((result) => result.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.item.name.localeCompare(b.item.name) ||
        a.item.url.localeCompare(b.item.url)
    )
    .map((result) => result.item);
}

export function highlightParts(text: string, query: string): HighlightPart[] {
  const tokens = Array.from(
    new Set(
      normalizeSearchText(query)
        .split(" ")
        .filter((token) => token.length >= 2 && !STOP_WORDS.has(token))
    )
  ).sort((a, b) => b.length - a.length);

  if (!text || tokens.length === 0) return [{ text, match: false }];

  const pattern = tokens
    .map((token) => `${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\w*`)
    .join("|");
  const regex = new RegExp(`\\b(${pattern})`, "gi");
  const parts: HighlightPart[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ text: text.slice(last, match.index), match: false });
    }
    parts.push({ text: match[0], match: true });
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push({ text: text.slice(last), match: false });
  }

  return parts.length > 0 ? parts : [{ text, match: false }];
}
