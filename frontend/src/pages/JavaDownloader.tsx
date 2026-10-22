import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import FilterMenu from "../components/FilterMenu";
import { SearchField, Select, type SelectOption } from "../components/ui";
import { API_BASE } from "../lib/api";
import "./JavaDownloader.css";

type Platform = "java" | "bedrock";

type Project = {
  id: string;
  title: string;
  description: string;
  icon_url: string;
  categories: string[];
  downloads: number;
  project_type: string;
  platform: Platform;
};

type McpedlTag = {
  id: number;
  name: string;
  slug: string;
  children?: McpedlTag[];
};

type ModrinthHit = {
  project_id: string;
  title: string;
  description: string;
  icon_url: string;
  categories: string[];
  downloads: number;
  project_type: string;
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

type ModrinthSearchResponse = {
  hits?: ModrinthHit[];
  total_hits?: number;
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
  nextPage?: number;
};

const MODRINTH_API = `${API_BASE}/api/modrinth`;
const MCPEDL_API = `${API_BASE}/api/mcpedl`;
const BEDROCK_PAGE_SIZE = 20;

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

const platformOptions: SelectOption[] = [
  { value: "java", label: "Java Edition" },
  { value: "bedrock", label: "PE / Bedrock" },
];

const javaTypeOptions: SelectOption[] = [
  { value: "", label: "All Types" },
  { value: "mod", label: "Mod" },
  { value: "plugin", label: "Plugin" },
  { value: "resourcepack", label: "Resourcepack" },
  { value: "shader", label: "Shader" },
  { value: "datapack", label: "Datapack" },
];

const bedrockTypeOptions: SelectOption[] = [
  { value: "", label: "All Types" },
  { value: "1", label: "Addons" },
  { value: "2", label: "Maps" },
  { value: "3", label: "Textures" },
  { value: "6", label: "Skins" },
  { value: "9", label: "Scripts" },
];

const javaSortOptions: SelectOption[] = [
  { value: "relevance", label: "Relevance" },
  { value: "downloads", label: "Downloads" },
  { value: "newest", label: "Newest" },
  { value: "updated", label: "Updated" },
];

const bedrockSortOptions: SelectOption[] = [
  { value: "relevance", label: "Relevance" },
  { value: "popularity_week", label: "Popular (Week)" },
  { value: "popularity_month", label: "Popular (Month)" },
  { value: "popularity_all", label: "Popular (All Time)" },
  { value: "updated_at", label: "Recently Updated" },
  { value: "created_at", label: "Newest" },
];

const javaLoaderOptions: Record<string, string[]> = {
  mod: ["forge", "fabric", "quilt", "neoforge"],
  plugin: ["paper", "purpur", "spigot", "bukkit", "folia", "velocity", "waterfall"],
  resourcepack: [],
  shader: ["optifine", "canvas", "iris"],
  datapack: [],
};

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

export default function JavaDownloader() {
  const [searchParams, setSearchParams] = useSearchParams();
  const platform: Platform = searchParams.get("platform") === "bedrock" ? "bedrock" : "java";

  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [loader, setLoader] = useState("");
  const [version, setVersion] = useState("");
  const [sort, setSort] = useState("relevance");
  const [versionsList, setVersionsList] = useState<string[]>([]);
  const [mcpedlRoots, setMcpedlRoots] = useState<McpedlTag[]>([]);
  const [results, setResults] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(false);
  const requestId = useRef(0);
  const nextBedrockPage = useRef(1);
  const loadingMoreRef = useRef(false);
  const resultsRef = useRef<Project[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  resultsRef.current = results;

  const provider = platform === "bedrock" ? "MCPEDL" : "Modrinth";

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
    if (platform !== "java") return;
    fetch(`${MODRINTH_API}/tag/game_version`)
      .then((r) => r.json())
      .then((d: { version: string }[]) => setVersionsList(d.slice(0, 80).map((x) => x.version)))
      .catch(() => setVersionsList(["1.21.1", "1.20.1", "1.19.4"]));
  }, [platform]);

  useEffect(() => {
    if (platform !== "bedrock" || mcpedlRoots.length) return;
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
  }, [platform, mcpedlRoots.length]);

  async function fetchModrinthResults(offset: number, limit: number): Promise<ResultBatch> {
    const facets: string[][] = [];
    if (type) facets.push([`project_type:${type}`]);
    if (loader) facets.push([`categories:${loader}`]);
    if (version) facets.push([`versions:${version}`]);
    const index = sort === "downloads" ? "downloads" : sort === "newest" ? "newest" : sort === "updated" ? "updated" : "relevance";
    const params = new URLSearchParams({
      query: query || "",
      limit: String(limit),
      offset: String(offset),
      index,
    });
    if (facets.length) params.set("facets", JSON.stringify(facets));
    const r = await fetch(`${MODRINTH_API}/search?${params.toString()}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = (await r.json()) as ModrinthSearchResponse;
    const items = ((d.hits || []) as ModrinthHit[]).map((hit) => ({
      id: hit.project_id,
      title: hit.title,
      description: hit.description,
      icon_url: hit.icon_url,
      categories: hit.categories,
      downloads: hit.downloads,
      project_type: hit.project_type,
      platform: "java" as const,
    }));
    const total = typeof d.total_hits === "number" ? d.total_hits : offset + items.length;
    return { items, hasMore: items.length > 0 && offset + items.length < total };
  }

  async function fetchBedrockPage(page: number): Promise<{ items: Project[]; pageCount: number }> {
    const params = new URLSearchParams({ q: query || "", page: String(page), sort });
    if (type) params.set("type_id", type);
    if (loader) params.set("cf_tags", loader);
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
      platform: "bedrock" as const,
    }));
    const total = d.meta?.total ?? items.length;
    const pageCount =
      d.meta?.page_count ??
      Math.max(page, Math.ceil(total / Math.max(1, d.meta?.page_size ?? BEDROCK_PAGE_SIZE)));
    return { items, pageCount };
  }

  async function fetchBedrockResults(startPage: number, wanted: number): Promise<ResultBatch & { nextPage: number }> {
    const pagesToFetch = Math.max(1, Math.ceil(wanted / BEDROCK_PAGE_SIZE));
    const items: Project[] = [];
    let nextPage = startPage;
    let hasMore = false;
    for (let i = 0; i < pagesToFetch; i += 1) {
      const pageNumber = nextPage;
      const page = await fetchBedrockPage(pageNumber);
      items.push(...page.items);
      hasMore = page.items.length > 0 && pageNumber < page.pageCount;
      nextPage = pageNumber + 1;
      if (!hasMore) break;
    }
    return { items, hasMore, nextPage };
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
      if (platform === "bedrock") {
        const batch = await fetchBedrockResults(1, batchSize);
        if (id === requestId.current) {
          nextBedrockPage.current = batch.nextPage;
          setResults(batch.items);
          setHasMore(batch.hasMore);
        }
      } else {
        const batch = await fetchModrinthResults(0, batchSize);
        if (id === requestId.current) {
          setResults(batch.items);
          setHasMore(batch.hasMore);
        }
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
      if (platform === "bedrock") {
        const batch = await fetchBedrockResults(nextBedrockPage.current, batchSize);
        if (id !== requestId.current) return;
        nextBedrockPage.current = batch.nextPage;
        setResults((previous) => appendUnique(previous, batch.items));
        setHasMore(batch.hasMore);
      } else {
        const offset = resultsRef.current.length;
        const batch = await fetchModrinthResults(offset, batchSize);
        if (id !== requestId.current) return;
        setResults((previous) => appendUnique(previous, batch.items));
        setHasMore(batch.hasMore);
      }
    } catch {
      if (id === requestId.current) setLoadMoreError(true);
    } finally {
      if (id === requestId.current) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [hasMore, loading, platform, query, type, loader, version, sort]);

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
  }, [platform, type, loader, version, sort]);

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

  function changePlatform(next: string) {
    if (next === platform) return;
    setType("");
    setLoader("");
    setVersion("");
    setSort("relevance");
    const params = new URLSearchParams(searchParams);
    if (next === "bedrock") params.set("platform", "bedrock");
    else params.delete("platform");
    setSearchParams(params, { replace: true });
  }

  return (
    <div className="jd-page">
      <div className="jd-bg" aria-hidden>
        <div className="jd-bg-grad" />
        <div className="jd-bg-orb o1" />
        <div className="jd-bg-orb o2" />
      </div>
      <div className="jd-shell">
        <header className="jd-header">
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
              <FilterMenu activeCount={[type, loader, version, sort !== "relevance" ? sort : ""].filter(Boolean).length}>
                <div className="jd-filter-fields">
                  <Select
                    className="jd-select"
                    value={platform}
                    onChange={changePlatform}
                    options={platformOptions}
                    ariaLabel="Platform"
                  />
                  <Select
                    className="jd-select"
                    value={type}
                    onChange={(next) => { setType(next); setLoader(""); }}
                    options={platform === "bedrock" ? bedrockTypeOptions : javaTypeOptions}
                    ariaLabel="Content type"
                  />
                  <Select
                    className="jd-select"
                    value={loader}
                    onChange={setLoader}
                    options={platform === "bedrock" ? categoryOptions : [
                      { value: "", label: "All Loaders" },
                      ...(javaLoaderOptions[type] || []).map((l) => ({ value: l, label: l })),
                    ]}
                    searchable={platform === "bedrock"}
                    searchPlaceholder="Search categories…"
                    ariaLabel={platform === "bedrock" ? "Category" : "Loader"}
                  />
                  {platform === "java" && (
                    <Select
                      className="jd-select"
                      value={version}
                      onChange={setVersion}
                      options={[
                        { value: "", label: "All Versions" },
                        ...versionsList.map((v) => ({ value: v, label: v })),
                      ]}
                      searchable
                      searchPlaceholder="Search versions…"
                      ariaLabel="Game version"
                    />
                  )}
                  <Select
                    className="jd-select"
                    value={sort}
                    onChange={setSort}
                    options={platform === "bedrock" ? bedrockSortOptions : javaSortOptions}
                    ariaLabel="Sort by"
                  />
                </div>
              </FilterMenu>
            </div>
          </div>
        </header>

        {loading && <div className="jd-loading">Searching {provider}…</div>}
        {!loading && error && (
          <div className="jd-empty">
            Couldn't load results from {provider}.{" "}
            <button type="button" className="jd-retry" onClick={searchContent}>Retry</button>
          </div>
        )}
        {!loading && !error && hasSearched && results.length === 0 && (
          <div className="jd-empty">No results. Try different filters or search term.</div>
        )}
        <div className="jd-grid">
          {results.map((p) => (
            <Link
              key={`${p.platform}-${p.id}`}
              className="jd-card"
              to={p.platform === "bedrock"
                ? `/minecraft/bedrock/downloader/${p.id}`
                : `/minecraft/java/downloader/${p.id}`}
            >
              <img className="jd-icon" src={p.icon_url || "https://via.placeholder.com/64"} alt="" loading="lazy" decoding="async" />
              <div className="jd-info">
                <h3 title={p.title}>{p.title}</h3>
                <p>{p.description}</p>
                <div className="jd-meta">{(p.downloads ?? 0).toLocaleString()} downloads • {p.project_type}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
