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

  // loaders per type
  const loaderOptions: Record<string, string[]> = {
    mod: ["forge", "fabric", "quilt", "neoforge"],
    plugin: ["paper", "purpur", "spigot", "bukkit", "folia", "velocity", "waterfall"],
    resourcepack: [],
    shader: ["optifine", "canvas", "iris"],
    datapack: [],
  };

  useEffect(() => {
    // load game versions
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
      <div className="dashboard">
        <div id="Title">Modrinth Downloader</div>
        <div className="controls">
          <select value={type} onChange={(e) => { setType(e.target.value); setLoader(""); }} className="form-element select-element">
            <option value="">All Types</option>
            <option value="mod">Mod</option>
            <option value="plugin">Plugin</option>
            <option value="resourcepack">Resourcepack</option>
            <option value="shader">Shader</option>
            <option value="datapack">Datapack</option>
          </select>
          <select value={loader} onChange={(e) => setLoader(e.target.value)} className="form-element select-element">
            <option value="">All Loaders</option>
            {(loaderOptions[type] || []).map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <select value={version} onChange={(e) => setVersion(e.target.value)} className="form-element select-element">
            <option value="">All Versions</option>
            {versionsList.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="form-element select-element">
            <option value="relevance">Relevance</option>
            <option value="downloads">Downloads</option>
            <option value="newest">Newest</option>
            <option value="updated">Updated</option>
          </select>
          <input type="text" placeholder="Search by name" value={query} onChange={(e) => setQuery(e.target.value)} className="form-element" onKeyDown={(e) => e.key === "Enter" && searchContent()} />
          <button onClick={searchContent} className="form-element button-element">🔍</button>
        </div>

        {loading && <div id="loading">Loading...</div>}
        {!loading && results.length === 0 && <div className="empty">No results. Try search.</div>}
        <div className="grid">
          {results.map((p) => (
            <div key={p.project_id} className="card" onClick={() => openDetails(p)}>
              <img className="icon" src={p.icon_url || "https://via.placeholder.com/64"} alt="" />
              <div className="info">
                <h3>{p.title}</h3>
                <p>{p.description}</p>
                <p style={{ fontSize: 12, color: "#d4d4d4", marginTop: 6 }}>{p.downloads.toLocaleString()} downloads • {p.project_type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showDetail && selected && (
        <div className="modal active" onClick={() => setShowDetail(false)}>
          <div className="modal-content full-modal" onClick={(e) => e.stopPropagation()}>
            <span className="close" onClick={() => setShowDetail(false)}>&times;</span>
            <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
              <img src={selected.icon_url || "https://via.placeholder.com/64"} alt="" style={{ width: 64, height: 64, borderRadius: 14 }} />
              <div>
                <h1 style={{ fontSize: 22 }}>{detailData ? String((detailData as { title: string }).title) : selected.title}</h1>
                <p style={{ color: "#a8a8a8" }}>{selected.description}</p>
              </div>
            </div>
            <button className="form-element button-element" onClick={() => { if (detailData) window.open(`https://modrinth.com/${(detailData as { project_type: string }).project_type}/${(detailData as { slug: string }).slug}`, "_blank"); }}>
              View on Modrinth
            </button>
            <div style={{ marginTop: 16, color: "#a8a8a8", fontSize: 14, lineHeight: 1.6 }}>
              {detailData ? String((detailData as { body: string }).body || "").slice(0, 2000) : "Loading..."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
