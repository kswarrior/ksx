import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import FilterMenu from "../components/FilterMenu";
import { SearchField, Select, type SelectOption } from "../components/ui";
import { API_BASE } from "../lib/api";
import "./JavaDownloader.css";

type Project = {
  project_id: string;
  title: string;
  description: string;
  icon_url: string;
  categories: string[];
  downloads: number;
  project_type: string;
};

const API = `${API_BASE}/api/modrinth`;

const typeOptions: SelectOption[] = [
  { value: "", label: "All Types" },
  { value: "mod", label: "Mod" },
  { value: "plugin", label: "Plugin" },
  { value: "resourcepack", label: "Resourcepack" },
  { value: "shader", label: "Shader" },
  { value: "datapack", label: "Datapack" },
];

const sortOptions: SelectOption[] = [
  { value: "relevance", label: "Relevance" },
  { value: "downloads", label: "Downloads" },
  { value: "newest", label: "Newest" },
  { value: "updated", label: "Updated" },
];

export default function JavaDownloader() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [loader, setLoader] = useState("");
  const [version, setVersion] = useState("");
  const [sort, setSort] = useState("relevance");
  const [versionsList, setVersionsList] = useState<string[]>([]);
  const [results, setResults] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(false);

  const loaderOptions: Record<string, string[]> = {
    mod: ["forge", "fabric", "quilt", "neoforge"],
    plugin: ["paper", "purpur", "spigot", "bukkit", "folia", "velocity", "waterfall"],
    resourcepack: [],
    shader: ["optifine", "canvas", "iris"],
    datapack: [],
  };

  useEffect(() => {
    fetch(`${API}/tag/game_version`)
      .then((r) => r.json())
      .then((d: { version: string }[]) => setVersionsList(d.slice(0, 80).map((x) => x.version)))
      .catch(() => setVersionsList(["1.21.1", "1.20.1", "1.19.4"]));
  }, []);

  async function searchContent() {
    setLoading(true);
    setError(false);
    setResults([]);
    const facets: string[][] = [];
    if (type) facets.push([`project_type:${type}`]);
    if (loader) facets.push([`categories:${loader}`]);
    if (version) facets.push([`versions:${version}`]);
    const index = sort === "downloads" ? "downloads" : sort === "newest" ? "newest" : sort === "updated" ? "updated" : "relevance";
    const params = new URLSearchParams({ query: query || "", limit: "24", index });
    if (facets.length) params.set("facets", JSON.stringify(facets));
    try {
      const r = await fetch(`${API}/search?${params.toString()}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      const hits: Project[] = d.hits || [];
      setResults(hits);
    } catch {
      setError(true);
      setResults([]);
    } finally {
      setHasSearched(true);
      setLoading(false);
    }
  }

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
                    value={type}
                    onChange={(next) => { setType(next); setLoader(""); }}
                    options={typeOptions}
                    ariaLabel="Project type"
                  />
                  <Select
                    className="jd-select"
                    value={loader}
                    onChange={setLoader}
                    options={[
                      { value: "", label: "All Loaders" },
                      ...(loaderOptions[type] || []).map((l) => ({ value: l, label: l })),
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
                    options={sortOptions}
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
            <Link key={p.project_id} className="jd-card" to={`/minecraft/java/downloader/${p.project_id}`}>
              <img className="jd-icon" src={p.icon_url || "https://via.placeholder.com/64"} alt="" loading="lazy" decoding="async" />
              <div className="jd-info">
                <h3 title={p.title}>{p.title}</h3>
                <p>{p.description}</p>
                <div className="jd-meta">{p.downloads.toLocaleString()} downloads • {p.project_type}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
