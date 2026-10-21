import { useEffect, useMemo, useState } from "react";
import { api, MinecraftHosting } from "../lib/api";
import FilterMenu from "../components/FilterMenu";
import { SearchField, Select, type SelectOption } from "../components/ui";
import "./Hosting.css";

const uptimeOptions: SelectOption[] = [
  { value: "", label: "Uptime • All" },
  { value: "good", label: "24/7 only" },
  { value: "danger", label: "non-24/7" },
];

const locationOptions: SelectOption[] = [
  { value: "", label: "Location • All" },
  { value: "india", label: "India" },
  { value: "singapore", label: "Singapore" },
  { value: "france", label: "France" },
  { value: "germany", label: "Germany" },
  { value: "usa", label: "USA" },
];

const ramOptions: SelectOption[] = [
  { value: "", label: "RAM • All" },
  { value: "1", label: "≥1 GB" },
  { value: "2", label: "≥2 GB" },
  { value: "4", label: "≥4 GB" },
  { value: "6", label: "≥6 GB" },
];

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
          <div className="h-search-wrap">
            <div className="h-search-row">
              <SearchField
                className="h-search"
                value={q}
                onValueChange={setQ}
                placeholder="Search hosting name…"
                ariaLabel="Search hosting"
              />
              <FilterMenu activeCount={[uptime, location, ram].filter(Boolean).length}>
                <div className="h-filters">
                  <Select
                    className="h-select"
                    value={uptime}
                    onChange={setUptime}
                    options={uptimeOptions}
                    ariaLabel="Uptime"
                  />
                  <Select
                    className="h-select"
                    value={location}
                    onChange={setLocation}
                    options={locationOptions}
                    ariaLabel="Location"
                  />
                  <Select
                    className="h-select"
                    value={ram}
                    onChange={setRam}
                    options={ramOptions}
                    ariaLabel="RAM"
                  />
                  {(q||uptime||location||ram) && <button className="h-filter" onClick={clearFilters}>Clear filters <Icon name="close" size={12} /></button>}
                </div>
              </FilterMenu>
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
            <div style={{marginBottom:8, color:"var(--h-muted)"}}><Icon name="search" size={26} /></div>
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
                  <a className="h-card-btn" href={h.link} target="_blank" rel="noreferrer"><Icon name="external-link" size={12} /> Visit</a>
                </div>
                <div className="h-specs">
                  <span><b>{h.ram} GB</b> RAM</span>
                  <span><b>{h.cpu}</b> CPU</span>
                  <span><b>{h.disk} GB</b> Disk</span>
                </div>
                <div className="h-card-bottom">
                  <span style={{display:"inline-flex", alignItems:"center", gap:6}}><Icon name="map-pin" size={13} /> {h.location}</span>
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
