import { useEffect, useMemo, useState } from "react";
import { api, MinecraftHosting } from "../lib/api";
import FilterMenu from "../components/FilterMenu";
import Icon from "../components/Icon";
import PageHero from "../components/PageHero";
import { SearchField, Select, type SelectOption } from "../components/ui";
import "./Hosting.css";

const availabilityOptions: SelectOption[] = [
  { value: "", label: "Availability • All" },
  { value: "true", label: "24/7 only" },
  { value: "false", label: "Not 24/7" },
];

const ramOptions: SelectOption[] = [
  { value: "", label: "RAM • All" },
  { value: "1", label: "≥1 GB" },
  { value: "2", label: "≥2 GB" },
  { value: "4", label: "≥4 GB" },
  { value: "6", label: "≥6 GB" },
  { value: "8", label: "≥8 GB" },
  { value: "16", label: "≥16 GB" },
];

export default function MinecraftHostingPage() {
  const [data, setData] = useState<MinecraftHosting[]>([]);
  const [q, setQ] = useState("");
  const [alwaysOn, setAlwaysOn] = useState("");
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

  const locationOptions = useMemo<SelectOption[]>(() => [
    { value: "", label: "Location • All" },
    ...Array.from(new Set(data.map((h) => h.location).filter(Boolean)))
      .sort()
      .map((value) => ({ value, label: value })),
  ], [data]);

  const filtered = useMemo(() => data.filter((h) => {
    if (q && !h.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (alwaysOn && h.alwaysOn !== (alwaysOn === "true")) return false;
    if (location && !h.location.toLowerCase().includes(location.toLowerCase())) return false;
    if (ram && Number(h.ram) < Number(ram)) return false;
    return true;
  }), [q, alwaysOn, location, ram, data]);

  const clearFilters = () => { setQ(""); setAlwaysOn(""); setLocation(""); setRam(""); };

  return (
    <div className="hosting-page">
      <div className="hosting-bg" aria-hidden>
        <div className="hosting-bg-gradient" />
        <div className="hosting-bg-orb o1" />
        <div className="hosting-bg-orb o2" />
      </div>
      <div className="h-shell">
        <header className="h-header">
          <PageHero
            variant="inline"
            icon="server"
            title="Free Minecraft Hosting"
            subtitle="Free Minecraft hosts with their real limits and renewal rules. Trials and paid plans are excluded. Checked Oct 2026."
          />

          <div className="h-search-wrap">
            <div className="h-search-row">
              <SearchField
                className="h-search"
                value={q}
                onValueChange={setQ}
                placeholder="Search hosting name…"
                ariaLabel="Search hosting"
              />
              <FilterMenu activeCount={[alwaysOn, location, ram].filter(Boolean).length}>
                <div className="h-filters">
                  <Select
                    className="h-select"
                    value={alwaysOn}
                    onChange={setAlwaysOn}
                    options={availabilityOptions}
                    ariaLabel="Availability"
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
                  {(q||alwaysOn||location||ram) && <button className="h-filter" onClick={clearFilters}>Clear filters <Icon name="close" size={12} /></button>}
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
                  <span><b>{h.disk}</b> Disk</span>
                  <span><b>{h.players}</b> Players</span>
                </div>
                <div className="h-facts">
                  <div className="h-fact"><Icon name="smartphone" size={13} /><span><b>Verification:</b> {h.verification}</span></div>
                  <div className="h-fact"><Icon name="warning" size={13} /><span><b>Limits:</b> {h.limits}</span></div>
                </div>
                <div className="h-note"><Icon name="sparkles" size={14} /><span>{h.notes}</span></div>
                <div className="h-card-bottom">
                  <span style={{display:"inline-flex", alignItems:"center", gap:6}}><Icon name="map-pin" size={13} /> {h.location}</span>
                  <span className={`h-tag ${h.alwaysOn ? "good" : "neutral"}`}>{h.alwaysOn ? "24/7" : "Not 24/7"}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
