import { useEffect, useMemo, useState } from "react";
import { api, MinecraftHosting } from "../lib/api";
import "./Hosting.css";

export default function MinecraftHostingPage() {
  const [data, setData] = useState<MinecraftHosting[]>([]);
  const [q, setQ] = useState("");
  const [uptime, setUptime] = useState("");
  const [location, setLocation] = useState("");
  const [ram, setRam] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api.getMinecraftHosting().then((r) => {
      if (!alive) return;
      setData(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => data.filter((h) => {
    if (q && !h.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (uptime && h.uptime !== uptime) return false;
    if (location && !h.location.toLowerCase().includes(location.toLowerCase())) return false;
    if (ram && Number(h.ram) < Number(ram)) return false;
    return true;
  }), [q, uptime, location, ram, data]);

  const clearFilters = () => { setQ(""); setUptime(""); setLocation(""); setRam(""); };

  return (
    <div className="hosting-page">
      <div className="hosting-bg" aria-hidden>
        <div className="hosting-bg-gradient" />
        <div className="hosting-bg-orb o1" />
        <div className="hosting-bg-orb o2" />
      </div>
      <div className="h-shell">
        <header className="h-header">
          <div className="h-kicker"><span className="h-kicker-dot" /> MINECRAFT • HOSTING <span className="h-kicker-count">{data.length} providers</span></div>
          <h1 className="h-title">Free Minecraft <span>Hosting</span></h1>
          <p className="h-sub">Curated free hosts — filter by RAM, location & uptime. Lag-less cards, instant search, tap Visit to launch.</p>

          <div className="h-search-wrap">
            <div className="h-search">
              <svg viewBox="0 0 24 24" aria-hidden><circle cx="11" cy="11" r="6.5"/><path d="M16 16 L20 20"/></svg>
              <input placeholder="Search hosting name…" value={q} onChange={(e)=>setQ(e.target.value)} aria-label="Search hosting" spellCheck={false} />
              {q && <button className="h-search-btn" onClick={()=>setQ("")} aria-label="Clear">✕</button>}
            </div>
            <div className="h-filters">
              <select className="h-select" value={uptime} onChange={(e)=>setUptime(e.target.value)} aria-label="Uptime">
                <option value="">Uptime • All</option>
                <option value="good">24/7 only</option>
                <option value="danger">non-24/7</option>
              </select>
              <select className="h-select" value={location} onChange={(e)=>setLocation(e.target.value)} aria-label="Location">
                <option value="">Location • All</option>
                <option value="india">India</option>
                <option value="singapore">Singapore</option>
                <option value="france">France</option>
                <option value="germany">Germany</option>
                <option value="usa">USA</option>
              </select>
              <select className="h-select" value={ram} onChange={(e)=>setRam(e.target.value)} aria-label="RAM">
                <option value="">RAM • All</option>
                <option value="1">≥1 GB</option>
                <option value="2">≥2 GB</option>
                <option value="4">≥4 GB</option>
                <option value="6">≥6 GB</option>
              </select>
              {(q||uptime||location||ram) && <button className="h-filter" onClick={clearFilters}>Clear ✕</button>}
            </div>
            <div className="h-stats">{loading ? "Loading…" : <><strong>{filtered.length}</strong> of <strong>{data.length}</strong> providers</>}</div>
          </div>
        </header>

        {loading ? (
          <div className="h-grid">
            {[0,1,2,3,4,5].map(i=> <div key={i} className="h-skeleton" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-empty">
            <div style={{fontSize:28, marginBottom:8}}>🔍</div>
            <div style={{fontWeight:900, marginBottom:6}}>No matches</div>
            <div style={{color:"var(--h-muted)", fontSize:13, marginBottom:12}}>Try adjusting filters or search term.</div>
            <button className="h-card-btn" onClick={clearFilters}>Clear filters</button>
          </div>
        ) : (
          <div className="h-grid">
            {filtered.map((h)=> (
              <article key={h.name} className="h-card">
                <div className="h-card-top">
                  <div className="h-card-name" title={h.name}>{h.name}</div>
                  <a className="h-card-btn" href={h.link} target="_blank" rel="noreferrer">Visit ↗</a>
                </div>
                <div className="h-specs">
                  <span><b>{h.ram} GB</b> RAM</span>
                  <span><b>{h.cpu}</b> CPU</span>
                  <span><b>{h.disk} GB</b> Disk</span>
                </div>
                <div className="h-card-bottom">
                  <span>📍 {h.location}</span>
                  <span className={`h-tag ${h.uptime==="good"?"good":h.uptime==="warning"?"warn":"bad"}`}>{h.uptime==="good"?"24/7":h.uptime==="warning"?"Partial":"non-24/7"}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
