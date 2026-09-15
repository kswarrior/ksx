import { useEffect, useMemo, useState } from "react";
import { api, VpsHosting } from "../lib/api";
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
          <div className="v-kicker"><span className="v-kicker-dot" /> VPS • HOSTING <span className="v-kicker-count">{list.length} providers</span></div>
          <h1 className="v-title">Free VPS <span>List</span></h1>
          <p className="v-sub">Zero-cost VPS for dev, bots & servers. Search instantly, check RAM/CPU/disk & renew/sudo status.</p>
          <div className="v-search-wrap">
            <div className="v-search">
              <svg viewBox="0 0 24 24" aria-hidden><circle cx="11" cy="11" r="6.5"/><path d="M16 16 L20 20"/></svg>
              <input placeholder="Search VPS by name…" value={q} onChange={(e)=>setQ(e.target.value)} aria-label="Search VPS" spellCheck={false} />
              {q && <button onClick={()=>setQ("")} style={{width:34,height:34,borderRadius:999,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.06)",color:"#fff",display:"grid",placeItems:"center",cursor:"pointer",flexShrink:0}}>✕</button>}
            </div>
            <div className="v-stats">{loading ? "Loading…" : <><strong>{filtered.length}</strong> of <strong>{list.length}</strong> providers</>}</div>
          </div>
        </header>

        {loading ? (
          <div className="v-grid">{[0,1,2,3,4,5].map(i=> <div key={i} className="v-skel" />)}</div>
        ) : filtered.length===0 ? (
          <div className="v-empty">
            <div style={{fontSize:28, marginBottom:8}}>🔍</div>
            <div style={{fontWeight:900, marginBottom:6}}>No VPS found</div>
            <div style={{color:"var(--v-muted)", fontSize:13}}>Try different search term.</div>
          </div>
        ) : (
          <div className="v-grid">
            {filtered.map((vps)=> (
              <article key={vps.name} className="v-card">
                <div className="v-card-top">
                  <div className="v-card-name" title={vps.name}>{vps.name}</div>
                  <button className="v-visit" onClick={()=>window.open(vps.link,"_blank")}>Visit ↗</button>
                </div>
                <div className="v-meta">
                  <div className="v-meta-row">
                    <span><b>{vps.ram}GB</b> RAM</span>
                    <span><b>{vps.cpu}</b> CPU</span>
                    <span><b>{vps.disk}</b> Disk</span>
                  </div>
                  <div style={{fontSize:12, color:"var(--v-muted)"}}>📍 {vps.location}</div>
                </div>
                <div className="v-tags">
                  <span className={`v-pill ${vps.renew?"yes":"no"}`}>{vps.renew?"✓ Renew":"✕ Renew"}</span>
                  <span className={`v-pill ${vps.sudo?"yes":"no"}`}>{vps.sudo?"✓ Sudo":"✕ Sudo"}</span>
                  <span className={`v-pill ${vps.alwaysOn?"yes":"no"}`}>{vps.alwaysOn?"✓ 24/7":"✕ 24/7"}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
