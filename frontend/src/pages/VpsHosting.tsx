import { useEffect, useMemo, useState } from "react";
import { api, VpsHosting } from "../lib/api";
import Icon from "../components/Icon";
import FilterMenu from "../components/FilterMenu";
import { SearchField, Select } from "../components/ui";
import "./Vps.css";

const ramOptions = [
  { value: "", label: "RAM • Any" },
  { value: "1", label: "≥1 GB" },
  { value: "2", label: "≥2 GB" },
  { value: "4", label: "≥4 GB" },
  { value: "8", label: "≥8 GB" },
  { value: "16", label: "≥16 GB" },
];

const diskOptions = [
  { value: "", label: "Disk • Any" },
  { value: "20", label: "≥20 GB" },
  { value: "50", label: "≥50 GB" },
  { value: "100", label: "≥100 GB" },
];

const toNumber = (value: string | number) => {
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function VpsHostingPage() {
  const [list, setList] = useState<VpsHosting[]>([]);
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [ram, setRam] = useState("");
  const [disk, setDisk] = useState("");
  const [renewOnly, setRenewOnly] = useState(false);
  const [sudoOnly, setSudoOnly] = useState(false);
  const [alwaysOnOnly, setAlwaysOnOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api.getVpsHosting().then((r) => { if(!alive) return; setList(r.data); setLoading(false); }).catch(()=>setLoading(false));
    return ()=>{ alive=false; };
  }, []);

  const locationOptions = useMemo(() => [
    { value: "", label: "Location • All" },
    ...Array.from(new Set(list.map((v) => v.location).filter(Boolean)))
      .sort()
      .map((value) => ({ value, label: value })),
  ], [list]);

  const filtered = useMemo(() => list.filter((v) => {
    if (q && !v.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (location && !v.location.toLowerCase().includes(location.toLowerCase())) return false;
    if (ram && toNumber(v.ram) < Number(ram)) return false;
    if (disk && toNumber(v.disk) < Number(disk)) return false;
    if (renewOnly && !v.renew) return false;
    if (sudoOnly && !v.sudo) return false;
    if (alwaysOnOnly && !v.alwaysOn) return false;
    return true;
  }), [list, q, location, ram, disk, renewOnly, sudoOnly, alwaysOnOnly]);

  const activeCount = [location, ram, disk].filter(Boolean).length
    + [renewOnly, sudoOnly, alwaysOnOnly].filter(Boolean).length;

  const clearFilters = () => {
    setQ("");
    setLocation("");
    setRam("");
    setDisk("");
    setRenewOnly(false);
    setSudoOnly(false);
    setAlwaysOnOnly(false);
  };

  return (
    <div className="vps-page">
      <div className="vps-bg" aria-hidden>
        <div className="vps-bg-grad" />
        <div className="vps-bg-orb o1" />
        <div className="vps-bg-orb o2" />
      </div>
      <div className="v-shell">
        <header className="v-header">
          <div className="v-search-wrap">
            <div className="v-search-row">
              <SearchField
                className="v-search"
                value={q}
                onValueChange={setQ}
                placeholder="Search VPS by name…"
                ariaLabel="Search VPS"
              />
              <FilterMenu activeCount={activeCount}>
                <div className="v-filter-fields">
                  <Select
                    className="v-select"
                    value={location}
                    onChange={setLocation}
                    options={locationOptions}
                    ariaLabel="Location"
                  />
                  <Select
                    className="v-select"
                    value={ram}
                    onChange={setRam}
                    options={ramOptions}
                    ariaLabel="Minimum RAM"
                  />
                  <Select
                    className="v-select"
                    value={disk}
                    onChange={setDisk}
                    options={diskOptions}
                    ariaLabel="Minimum disk"
                  />
                  <div className="v-filter-toggles">
                    <span className="v-filter-label">Must have</span>
                    <div className="v-filter-toggle-row">
                      <button
                        type="button"
                        className={`v-filter-pill ${renewOnly ? "active" : ""}`}
                        aria-pressed={renewOnly}
                        onClick={() => setRenewOnly((value) => !value)}
                      >
                        Renew
                      </button>
                      <button
                        type="button"
                        className={`v-filter-pill ${sudoOnly ? "active" : ""}`}
                        aria-pressed={sudoOnly}
                        onClick={() => setSudoOnly((value) => !value)}
                      >
                        Sudo
                      </button>
                      <button
                        type="button"
                        className={`v-filter-pill ${alwaysOnOnly ? "active" : ""}`}
                        aria-pressed={alwaysOnOnly}
                        onClick={() => setAlwaysOnOnly((value) => !value)}
                      >
                        24/7
                      </button>
                    </div>
                  </div>
                  {activeCount > 0 && (
                    <button type="button" className="v-filter-clear" onClick={clearFilters}>
                      Clear filters <Icon name="close" size={12} />
                    </button>
                  )}
                </div>
              </FilterMenu>
            </div>
            <div className="v-stats">{loading ? "Loading…" : <><strong>{filtered.length}</strong> of <strong>{list.length}</strong> providers</>}</div>
          </div>
        </header>

        {loading ? (
          <div className="v-grid">{[0,1,2,3,4,5].map(i=> <div key={i} className="v-skel" />)}</div>
        ) : filtered.length===0 ? (
          <div className="v-empty">
            <div style={{marginBottom:8, color:"var(--v-muted)"}}><Icon name="search" size={26} /></div>
            <div style={{fontWeight:900, marginBottom:6}}>No VPS found</div>
            <div style={{color:"var(--v-muted)", fontSize:13}}>Try different search or filters.</div>
          </div>
        ) : (
          <div className="v-grid">
            {filtered.map((vps)=> (
              <article key={vps.name} className="v-card">
                <div className="v-card-top">
                  <div className="v-card-name" title={vps.name}>{vps.name}</div>
                  <button className="v-visit" onClick={()=>window.open(vps.link,"_blank")}><Icon name="external-link" size={12} /> Visit</button>
                </div>
                <div className="v-meta">
                  <div className="v-meta-row">
                    <span><b>{vps.ram}GB</b> RAM</span>
                    <span><b>{vps.cpu}</b> CPU</span>
                    <span><b>{vps.disk}</b> Disk</span>
                  </div>
                  <div style={{fontSize:12, color:"var(--v-muted)", display:"flex", alignItems:"center", gap:6}}><Icon name="map-pin" size={13} /> {vps.location}</div>
                </div>
                <div className="v-tags">
                  <span className={`v-pill ${vps.renew?"yes":"no"}`}><Icon name={vps.renew ? "check" : "close"} size={12} /> Renew</span>
                  <span className={`v-pill ${vps.sudo?"yes":"no"}`}><Icon name={vps.sudo ? "check" : "close"} size={12} /> Sudo</span>
                  <span className={`v-pill ${vps.alwaysOn?"yes":"no"}`}><Icon name={vps.alwaysOn ? "check" : "close"} size={12} /> 24/7</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
