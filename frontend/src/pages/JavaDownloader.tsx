import { useCallback, useEffect, useRef, useState } from "react";
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

type ModrinthHit = {
  project_id: string;
  title: string;
  description: string;
  icon_url: string;
  categories: string[];
  downloads: number;
  project_type: string;
};

type ModrinthSearchResponse = {
  hits?: ModrinthHit[];
  total_hits?: number;
};

type ResultBatch = {
  items: Project[];
  hasMore: boolean;
};

const MODRINTH_API = `${API_BASE}/api/modrinth`;

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

const javaTypeOptions: SelectOption[] = [
  { value: "", label: "All Types" },
  { value: "mod", label: "Mod" },
  { value: "plugin", label: "Plugin" },
  { value: "resourcepack", label: "Resourcepack" },
  { value: "shader", label: "Shader" },
  { value: "datapack", label: "Datapack" },
];

const javaSortOptions: SelectOption[] = [
  { value: "relevance", label: "Relevance" },
  { value: "downloads", label: "Downloads" },
  { value: "newest", label: "Newest" },
  { value: "updated", label: "Updated" },
];

const javaLoaderOptions: Record<string, string[]> = {
  mod: ["forge", "fabric", "quilt", "neoforge"],
  plugin: ["paper", "purpur", "spigot", "bukkit", "folia", "velocity", "waterfall"],
  resourcepack: [],
  shader: ["optifine", "canvas", "iris"],
  datapack: [],
};

export default function JavaDownloader() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [loader, setLoader] = useState("");
  const [version, setVersion] = useState("");
  const [sort, setSort] = useState("relevance");
  const [versionsList, setVersionsList] = useState<string[]>([]);
  const [results, setResults] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(false);
  const requestId = useRef(0);
  const loadingMoreRef = useRef(false);
  const resultsRef = useRef<Project[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  resultsRef.current = results;

  useEffect(() => {
    fetch(`${MODRINTH_API}/tag/game_version`)
      .then((r) => r.json())
      .then((d: { version: string }[]) => setVersionsList(d.slice(0, 80).map((x) => x.version)))
      .catch(() => setVersionsList(["1.21.1", "1.20.1", "1.19.4"]));
  }, []);

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
    }));
    const total = typeof d.total_hits === "number" ? d.total_hits : offset + items.length;
    return { items, hasMore: items.length > 0 && offset + items.length < total };
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
      const batch = await fetchModrinthResults(0, batchSize);
      if (id === requestId.current) {
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
      const offset = resultsRef.current.length;
      const batch = await fetchModrinthResults(offset, batchSize);
      if (id !== requestId.current) return;
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
  }, [hasMore, loading, query, type, loader, version, sort]);

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
  }, [type, loader, version, sort]);

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
            title="Java Downloader"
            subtitle="Mods, plugins, resource packs, shaders, and datapacks for Minecraft: Java Edition, powered by Modrinth."
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
              <FilterMenu activeCount={[type, loader, version, sort !== "relevance" ? sort : ""].filter(Boolean).length}>
                <div className="jd-filter-fields">
                  <Select
                    className="jd-select"
                    value={type}
                    onChange={(next) => { setType(next); setLoader(""); }}
                    options={javaTypeOptions}
                    ariaLabel="Content type"
                  />
                  <Select
                    className="jd-select"
                    value={loader}
                    onChange={setLoader}
                    options={[
                      { value: "", label: "All Loaders" },
                      ...(javaLoaderOptions[type] || []).map((l) => ({ value: l, label: l })),
                    ]}
                    ariaLabel="Loader"
                  />
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
                  <Select
                    className="jd-select"
                    value={sort}
                    onChange={setSort}
                    options={javaSortOptions}
                    ariaLabel="Sort by"
                  />
                </div>
              </FilterMenu>
            </div>
          </div>
        </header>

        {loading && <div className="jd-loading">Searching Modrinth…</div>}
        {!loading && error && (
          <div className="jd-empty">
            Couldn't load results from Modrinth.{" "}
            <button type="button" className="jd-retry" onClick={searchContent}>Retry</button>
          </div>
        )}
        {!loading && !error && hasSearched && results.length === 0 && (
          <div className="jd-empty">No results. Try different filters or search term.</div>
        )}
        <div className="jd-grid">
          {results.map((p) => (
            <Link key={p.id} className="jd-card" to={`/minecraft/java/downloader/${p.id}`}>
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
