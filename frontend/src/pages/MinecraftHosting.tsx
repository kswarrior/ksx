import { useEffect, useState } from "react";
import { api, MinecraftHosting } from "../lib/api";
import "./Hosting.css";

export default function MinecraftHostingPage() {
  const [data, setData] = useState<MinecraftHosting[]>([]);
  const [filtered, setFiltered] = useState<MinecraftHosting[]>([]);
  const [q, setQ] = useState("");
  const [uptime, setUptime] = useState("");
  const [location, setLocation] = useState("");
  const [ram, setRam] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMinecraftHosting().then((r) => {
      setData(r.data);
      setFiltered(r.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const f = data.filter((h) => {
      if (q && !h.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (uptime && h.uptime !== uptime) return false;
      if (location && !h.location.toLowerCase().includes(location.toLowerCase())) return false;
      if (ram && Number(h.ram) < Number(ram)) return false;
      return true;
    });
    setFiltered(f);
  }, [q, uptime, location, ram, data]);

  return (
    <main className="hosting-main">
      <div className="title">Free Minecraft Hosting</div>

      <div className="search-bar">
        <input id="searchInput" placeholder="Search hosting name" value={q} onChange={(e) => setQ(e.target.value)} />
        <button id="filterBtn" onClick={() => setShowFilters((s) => !s)}>
          ⚙ Filters
        </button>
      </div>

      {showFilters && (
        <div id="filterWrapper" style={{ display: "flex" }}>
          <div className="filters-line">
            <select value={uptime} onChange={(e) => setUptime(e.target.value)}>
              <option value="">Uptime</option>
              <option value="good">24/7</option>
              <option value="danger">non-24/7</option>
            </select>
            <select value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="">Location</option>
              <option value="india">India</option>
              <option value="singapore">Singapore</option>
              <option value="france">France</option>
              <option value="germany">Germany</option>
              <option value="usa">USA</option>
            </select>
            <select value={ram} onChange={(e) => setRam(e.target.value)}>
              <option value="">RAM</option>
              <option value="1">≥1 GB</option>
              <option value="2">≥2 GB</option>
              <option value="4">≥4 GB</option>
              <option value="6">≥6 GB</option>
            </select>
          </div>
        </div>
      )}

      <div className="stats">{loading ? "Loading Hostings..." : `${filtered.length} Hosting Provides`}</div>

      <div className="list">
        {filtered.map((h) => (
          <div key={h.name} className="row">
            <div className="row-top">
              <div className="name">{h.name}</div>
              <a className="btn" href={h.link} target="_blank" rel="noreferrer">
                Visit
              </a>
            </div>
            <div className="row-specs">
              <div>
                <b>RAM:</b> {h.ram} GB
              </div>
              <div>
                <b>CPU:</b> {h.cpu}
              </div>
              <div>
                <b>DISK:</b> {h.disk} GB
              </div>
            </div>
            <div className="row-bottom">
              <div>
                <b>Location:</b> {h.location}
              </div>
              <span className={`tag ${h.uptime}`}>{h.uptime === "good" ? "24/7" : "non-24/7"}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
