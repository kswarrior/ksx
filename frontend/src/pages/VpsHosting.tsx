import { useEffect, useMemo, useState } from "react";
import { api, VpsHosting } from "../lib/api";
import Icon from "../components/Icon";
import { SearchField } from "../components/ui";
import "./Vps.css";

export default function VpsHostingPage() {
  const [list, setList] = useState<VpsHosting[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api.getVpsHosting().then((r) => { if(!alive) return; setList(r.data); setLoading(false); }).catch(()=>setLoading(false));
    return ()=>{ alive=false; };
  }, []);

  const filtered = useMemo(()=> list.filter((v) => !q || v.name.toLowerCase().includes(q.toLowerCase())), [list,q]);

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
            <SearchField
              className="v-search"
              value={q}
              onValueChange={setQ}
              placeholder="Search VPS by name…"
              ariaLabel="Search VPS"
            />
            <div className="v-stats">{loading ? "Loading…" : <><strong>{filtered.length}</strong> of <strong>{list.length}</strong> providers</>}</div>
          </div>
        </header>

        {loading ? (
          <div className="v-grid">{[0,1,2,3,4,5].map(i=> <div key={i} className="v-skel" />)}</div>
        ) : filtered.length===0 ? (
          <div className="v-empty">
            <div style={{marginBottom:8, color:"var(--v-muted)"}}><Icon name="search" size={26} /></div>
            <div style={{fontWeight:900, marginBottom:6}}>No VPS found</div>
            <div style={{color:"var(--v-muted)", fontSize:13}}>Try different search term.</div>
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
