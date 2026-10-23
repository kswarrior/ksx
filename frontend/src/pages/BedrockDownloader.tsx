import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import FilterMenu from "../components/FilterMenu";
import PageHero from "../components/PageHero";
import { SearchField, Select, type SelectOption } from "../components/ui";
import { API_BASE } from "../lib/api";
import "./JavaDownloader.css";

type Project = {
  id: string;
  title: string;
  description: string;
  icon_url: string;
  categories: string[];
  downloads: number;
  project_type: string;
};

type McpedlTag = {
  id: number;
  name: string;
  slug: string;
  children?: McpedlTag[];
};

type McpedlSearchItem = {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  introduction?: string;
  image?: string;
  type_id: number;
  downloadCount?: number;
  cf_tags?: { name: string; slug: string }[];
  highlight?: { description?: string[] };
};

type McpedlSearchResponse = {
  results?: McpedlSearchItem[];
  meta?: {
    total?: number;
    page?: number;
    page_size?: number;
    page_count?: number;
  };
};

type ResultBatch = {
  items: Project[];
  hasMore: boolean;
  nextPage: number;
};

const MCPEDL_API = `${API_BASE}/api/mcpedl`;
const MCPEDL_PAGE_SIZE = 20;

function getResultsBatchSize(): number {
  if (typeof window === "undefined") return 24;
  const shellWidth = Math.min(1120, window.innerWidth - 32);
  const columns = Math.max(1, Math.floor((shellWidth + 12) / 262));
  const rows = Math.max(3, Math.ceil((window.innerHeight - 220) / 150) + 1);
  return Math.max(8, Math.min(60, columns * rows));
}

function appendUnique(previous: Project[], next: Project[]): Project[] {
  if (next.length === 0) return previous;
  const seen = new Set(previous.map((project) => project.id));
  const merged = [...previous];
  for (const project of next) {
    if (seen.has(project.id)) continue;
    seen.add(project.id);
    merged.push(project);
  }
  return merged;
}

const bedrockTypeOptions: SelectOption[] = [
  { value: "", label: "All Types" },
  { value: "1", label: "Addons" },
  { value: "2", label: "Maps" },
  { value: "3", label: "Textures" },
  { value: "6", label: "Skins" },
  { value: "9", label: "Scripts" },
];

const bedrockSortOptions: SelectOption[] = [
  { value: "relevance", label: "Relevance" },
  { value: "popularity_week", label: "Popular (Week)" },
  { value: "popularity_month", label: "Popular (Month)" },
  { value: "popularity_all", label: "Popular (All Time)" },
  { value: "updated_at", label: "Recently Updated" },
  { value: "created_at", label: "Newest" },
];

const bedrockTagRoots: Record<string, string> = {
  "1": "addons",
  "2": "maps",
  "3": "texture-packs",
  "6": "skins",
  "9": "scripts",
};

const bedrockTypeLabels: Record<string, string> = {
  "1": "Addons",
  "2": "Maps",
  "3": "Textures",
  "6": "Skins",
  "9": "Scripts",
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function BedrockDownloader() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("relevance");
  const [mcpedlRoots, setMcpedlRoots] = useState<McpedlTag[]>([]);
  const [results, setResults] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(false);
  const requestId = useRef(0);
  const nextPage = useRef(1);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const categoryOptions = useMemo<SelectOption[]>(() => {
    const rootSlug = bedrockTagRoots[type];
    const roots = rootSlug ? mcpedlRoots.filter((root) => root.slug === rootSlug) : mcpedlRoots;
    const seen = new Set<string>();
    const options: SelectOption[] = [{ value: "", label: "All Categories" }];
    for (const root of roots) {
      for (const child of root.children ?? []) {
        if (seen.has(child.slug)) continue;
        seen.add(child.slug);
        options.push({ value: child.slug, label: child.name });
      }
    }
    return options;
  }, [mcpedlRoots, type]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${MCPEDL_API}/search/tags`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: { roots?: McpedlTag[] }) => {
        if (!cancelled) setMcpedlRoots(d.roots ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function fetchBedrockPage(page: number): Promise<{ items: Project[]; pageCount: number }> {
    const params = new URLSearchParams({ q: query || "", page: String(page), sort });
    if (type) params.set("type_id", type);
    if (category) params.set("cf_tags", category);
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const r = await fetch(`${MCPEDL_API}/search/advanced?${params.toString()}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = (await r.json()) as McpedlSearchResponse;
        const items = ((d.results || []) as McpedlSearchItem[]).map((item) => ({
          id: item.slug,
          title: item.title,
          description:
            item.summary ||
            stripHtml(item.highlight?.description?.[0] ?? "") ||
            item.introduction ||
            "",
          icon_url: item.image || "",
          categories: (item.cf_tags ?? []).map((tag) => tag.name),
          downloads: item.downloadCount ?? 0,
          project_type: bedrockTypeLabels[String(item.type_id)] ?? "Addon",
        }));
        const total = d.meta?.total ?? items.length;
        const pageCount =
          d.meta?.page_count ??
          Math.max(page, Math.ceil(total / Math.max(1, d.meta?.page_size ?? MCPEDL_PAGE_SIZE)));
        return { items, pageCount };
      } catch (err) {
        lastError = err;
        if (attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }
    throw lastError instanceof Error ? lastError : new Error("MCPEDL request failed");
  }

  async function fetchBedrockResults(startPage: number, wanted: number): Promise<ResultBatch> {
    const pagesToFetch = Math.max(1, Math.ceil(wanted / MCPEDL_PAGE_SIZE));
    const items: Project[] = [];
    let nextPageNumber = startPage;
    let hasMoreResults = false;
    for (let i = 0; i < pagesToFetch; i += 1) {
      const pageNumber = nextPageNumber;
      try {
        const page = await fetchBedrockPage(pageNumber);
        items.push(...page.items);
        hasMoreResults = page.items.length > 0 && pageNumber < page.pageCount;
        nextPageNumber = pageNumber + 1;
        if (!hasMoreResults) break;
      } catch (err) {
        if (items.length === 0) throw err;
        return { items, hasMore: true, nextPage: pageNumber };
      }
    }
    return { items, hasMore: hasMoreResults, nextPage: nextPageNumber };
  }

  async function searchContent() {
    const id = ++requestId.current;
    const batchSize = getResultsBatchSize();
    setLoading(true);
    setLoadingMore(false);
    loadingMoreRef.current = false;
    setLoadMoreError(false);
    setError(false);
    setResults([]);
    setHasMore(false);
    try {
      const batch = await fetchBedrockResults(1, batchSize);
      if (id === requestId.current) {
        nextPage.current = batch.nextPage;
        setResults(batch.items);
        setHasMore(batch.hasMore);
      }
    } catch {
      if (id === requestId.current) {
        setError(true);
        setResults([]);
        setHasMore(false);
      }
    } finally {
      if (id === requestId.current) {
        setHasSearched(true);
        setLoading(false);
      }
    }
  }

  const loadMore = useCallback(async () => {
    if (loading || loadingMoreRef.current || !hasMore) return;
    const id = requestId.current;
    const batchSize = getResultsBatchSize();
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setLoadMoreError(false);
    try {
      const batch = await fetchBedrockResults(nextPage.current, batchSize);
      if (id !== requestId.current) return;
      nextPage.current = batch.nextPage;
      setResults((previous) => appendUnique(previous, batch.items));
      setHasMore(batch.hasMore);
    } catch {
      if (id === requestId.current) setLoadMoreError(true);
    } finally {
      if (id === requestId.current) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [hasMore, loading, query, type, category, sort]);

  useEffect(() => {
    searchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtersInitialized = useRef(false);

  useEffect(() => {
    if (!filtersInitialized.current) {
      filtersInitialized.current = true;
      return;
    }
    searchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, category, sort]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || loading || loadingMore || error || loadMoreError) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: "300px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, error, loadMoreError, loadMore]);

  return (
    <div className="jd-page">
      <div className="jd-bg" aria-hidden>
        <div className="jd-bg-grad" />
        <div className="jd-bg-orb o1" />
        <div className="jd-bg-orb o2" />
      </div>
      <div className="jd-shell">
        <header className="jd-header">
          <PageHero
            variant="inline"
            icon="download"
            title="Bedrock Downloader"
            subtitle="Addons, maps, textures, skins, and scripts for Minecraft: Bedrock Edition, powered by MCPEDL."
          />

          <div className="jd-controls">
            <div className="jd-row1">
              <SearchField
                className="jd-search"
                value={query}
                onValueChange={setQuery}
                placeholder="Search by name (press Enter)"
                ariaLabel="Search projects"
                onKeyDown={(e) => e.key === "Enter" && searchContent()}
              />
              <FilterMenu activeCount={[type, category, sort !== "relevance" ? sort : ""].filter(Boolean).length}>
                <div className="jd-filter-fields">
                  <Select
                    className="jd-select"
                    value={type}
                    onChange={(next) => { setType(next); setCategory(""); }}
                    options={bedrockTypeOptions}
                    ariaLabel="Content type"
                  />
                  <Select
                    className="jd-select"
                    value={category}
                    onChange={setCategory}
                    options={categoryOptions}
                    searchable
                    searchPlaceholder="Search categories…"
                    ariaLabel="Category"
                  />
                  <Select
                    className="jd-select"
                    value={sort}
                    onChange={setSort}
                    options={bedrockSortOptions}
                    ariaLabel="Sort by"
                  />
                </div>
              </FilterMenu>
            </div>
          </div>
        </header>

        {loading && <div className="jd-loading">Searching MCPEDL…</div>}
        {!loading && error && (
          <div className="jd-empty">
            Couldn't load results from MCPEDL.{" "}
            <button type="button" className="jd-retry" onClick={searchContent}>Retry</button>
          </div>
        )}
        {!loading && !error && hasSearched && results.length === 0 && (
          <div className="jd-empty">No results. Try different filters or search term.</div>
        )}
        <div className="jd-grid">
          {results.map((p) => (
            <Link key={p.id} className="jd-card" to={`/minecraft/bedrock/downloader/${p.id}`}>
              <img className="jd-icon" src={p.icon_url || "https://via.placeholder.com/64"} alt="" loading="lazy" decoding="async" />
              <div className="jd-info">
                <h3 title={p.title}>{p.title}</h3>
                <p>{p.description}</p>
                <div className="jd-meta">{(p.downloads ?? 0).toLocaleString()} downloads • {p.project_type}</div>
              </div>
            </Link>
          ))}
        </div>
        {hasMore && (
          <div ref={sentinelRef} className="jd-sentinel">
            {loadingMore && <div className="jd-loading">Loading more…</div>}
            {loadMoreError && (
              <div className="jd-empty">
                Couldn't load more results.{" "}
                <button type="button" className="jd-retry" onClick={loadMore}>Retry</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
