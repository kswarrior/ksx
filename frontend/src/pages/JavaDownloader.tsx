import { useEffect, useState } from "react";
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

const API = "https://api.modrinth.com/v2";

export default function JavaDownloader() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [loader, setLoader] = useState("");
  const [version, setVersion] = useState("");
  const [sort, setSort] = useState("relevance");
  const [versionsList, setVersionsList] = useState<string[]>([]);
  const [results, setResults] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailData, setDetailData] = useState<Record<string, unknown> | null>(null);

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
    setResults([]);
    const facets: string[] = [];
    if (type) facets.push(`["project_type:${type}"]`);
    if (loader) facets.push(`["categories:${loader}"]`);
    if (version) facets.push(`["versions:${version}"]`);
    const facetsStr = facets.length ? `&facets=[${facets.join(",")}]` : "";
    const index = sort === "downloads" ? "downloads" : sort === "newest" ? "newest" : sort === "updated" ? "updated" : "relevance";
    const url = `${API}/search?query=${encodeURIComponent(query || "")}&limit=24&index=${index}${facetsStr}`;
    try {
      const r = await fetch(url);
      const d = await r.json();
      const hits: Project[] = d.hits || [];
      setResults(hits);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    searchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openDetails(p: Project) {
    setSelected(p);
    setShowDetail(true);
    try {
      const r = await fetch(`${API}/project/${p.project_id}`);
      const d = await r.json();
      setDetailData(d);
    } catch {
      setDetailData(null);
    }
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
          <div className="jd-kicker"><span className="jd-kicker-dot" /> UNIVERSAL • DOWNLOADER</div>
          <h1 className="jd-title">Modrinth <span>Downloader</span></h1>
          <p className="jd-sub">Mods, plugins, shaders & packs from Modrinth — fast search, lag-less cards, instant details.</p>
          <div className="jd-controls">
            <div className="jd-row1">
              <select value={type} onChange={(e) => { setType(e.target.value); setLoader(""); }} className="jd-select">
                <option value="">All Types</option>
                <option value="mod">Mod</option>
                <option value="plugin">Plugin</option>
                <option value="resourcepack">Resourcepack</option>
                <option value="shader">Shader</option>
                <option value="datapack">Datapack</option>
              </select>
              <select value={loader} onChange={(e) => setLoader(e.target.value)} className="jd-select">
                <option value="">All Loaders</option>
                {(loaderOptions[type] || []).map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <select value={version} onChange={(e) => setVersion(e.target.value)} className="jd-select">
                <option value="">All Versions</option>
                {versionsList.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="jd-select">
                <option value="relevance">Relevance</option>
                <option value="downloads">Downloads</option>
                <option value="newest">Newest</option>
                <option value="updated">Updated</option>
              </select>
            </div>
            <div className="jd-row1">
              <input type="text" placeholder="Search by name (press Enter)" value={query} onChange={(e) => setQuery(e.target.value)} className="jd-input" onKeyDown={(e) => e.key === "Enter" && searchContent()} />
              <button onClick={searchContent} className="jd-btn">🔍 Search</button>
            </div>
          </div>
        </header>

        {loading && <div className="jd-loading">Searching Modrinth…</div>}
        {!loading && results.length === 0 && <div className="jd-empty">No results. Try different filters or search term.</div>}
        <div className="jd-grid">
          {results.map((p) => (
            <article key={p.project_id} className="jd-card" onClick={() => openDetails(p)}>
              <img className="jd-icon" src={p.icon_url || "https://via.placeholder.com/64"} alt="" loading="lazy" decoding="async" />
              <div className="jd-info">
                <h3 title={p.title}>{p.title}</h3>
                <p>{p.description}</p>
                <div className="jd-meta">{p.downloads.toLocaleString()} downloads • {p.project_type}</div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {showDetail && selected && (
        <div className="jd-modal" onClick={() => setShowDetail(false)}>
          <div className="jd-modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="jd-close" onClick={() => setShowDetail(false)}>&times;</span>
            <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
              <img src={selected.icon_url || "https://via.placeholder.com/64"} alt="" style={{ width: 64, height: 64, borderRadius: 14, border:"1px solid rgba(255,255,255,0.12)" }} />
              <div style={{minWidth:0}}>
                <h2 style={{ fontSize: 18, fontWeight:900, letterSpacing:-0.4 }}>{detailData ? String((detailData as { title: string }).title) : selected.title}</h2>
                <p style={{ color: "#9aa0b4", fontSize:13, marginTop:4, lineHeight:1.5 }}>{selected.description}</p>
              </div>
            </div>
            <button className="jd-btn" onClick={() => { if (detailData) window.open(`https://modrinth.com/${(detailData as { project_type: string }).project_type}/${(detailData as { slug: string }).slug}`, "_blank"); }}>
              View on Modrinth ↗
            </button>
            <div style={{ marginTop: 16, color: "#9aa0b4", fontSize: 13, lineHeight: 1.6, whiteSpace:"pre-wrap", wordBreak:"break-word", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.06)", padding:14, borderRadius:12 }}>
              {detailData ? String((detailData as { body: string }).body || "").slice(0, 2500) || "No description" : "Loading..."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
