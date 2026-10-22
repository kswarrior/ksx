import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Icon from "../components/Icon";
import { TextField } from "../components/ui";
import "./ServerInfo.css";

type McStatus = Record<string, unknown>;

export default function ServerInfo() {
  const [searchParams] = useSearchParams();
  const initialIp = (searchParams.get("ip") ?? "").trim();
  const [ip, setIp] = useState(initialIp);
  const [data, setData] = useState<McStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const autoChecked = useRef(false);

  async function fetchInfo(target?: string) {
    const value = (target ?? ip).trim();
    if (!value) { alert("Please enter a server IP"); return; }
    setLoading(true);
    try {
      const res = await fetch(`https://api.mcsrvstat.us/3/${value}`);
      const json = await res.json();
      setData(json);
    } catch {
      alert("Failed to fetch");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (autoChecked.current || !initialIp) return;
    autoChecked.current = true;
    void fetchInfo(initialIp);
  }, [initialIp]);

  const online = data ? Boolean((data as { online?: boolean }).online) : null;
  const players = data ? (data as { players?: { online?: number; max?: number } }).players : null;

  return (
    <div className="si-page">
      <div className="si-bg" aria-hidden>
        <div className="si-bg-grad" />
        <div className="si-bg-orb o1" />
        <div className="si-bg-orb o2" />
      </div>
      <div className="si-shell">
        <header className="si-header">
          <div className="si-search">
            <TextField className="si-input" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="Enter server IP (e.g. play.hypixel.net)" aria-label="Server IP" onKeyDown={(e)=> e.key==="Enter" && fetchInfo()} />
            <button className="si-btn" onClick={() => fetchInfo()}><Icon name="search" size={14} /> {loading ? "Checking…" : "Search"}</button>
          </div>
        </header>

        {data && (
          <div className="si-card">
            <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
              <span style={{padding:"6px 10px", borderRadius:8, fontSize:12, fontWeight:900, background: online ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: online ? "#4ade80" : "#f87171", border:"1px solid rgba(255,255,255,0.08)"}}>{online ? "● Online" : "● Offline"}</span>
              {players && <span style={{fontSize:12, color:"var(--si-muted)"}}>{players.online} / {players.max} players</span>}
              <button className="si-btn" style={{marginLeft:"auto", padding:"8px 12px", fontSize:12, background:"rgba(255,255,255,0.06)", color:"#fff", border:"1px solid rgba(255,255,255,0.12)"}} onClick={()=> navigator.clipboard.writeText(JSON.stringify(data,null,2))}>Copy JSON</button>
            </div>

            {players && (
              <div className="si-grid">
                <div className="si-stat"><b>Online</b><span>{players.online ?? "—"}</span></div>
                <div className="si-stat"><b>Max</b><span>{players.max ?? "—"}</span></div>
                <div className="si-stat"><b>IP</b><span style={{fontSize:12, wordBreak:"break-all"}}>{String((data as { ip?:string }).ip || ip)}</span></div>
                <div className="si-stat"><b>Port</b><span>{String((data as { port?:number }).port || "25565")}</span></div>
              </div>
            )}

            <pre className="si-pre">{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}

        {!data && (
          <div className="si-card" style={{textAlign:"center", color:"var(--si-muted)", fontSize:13}}>
            <div style={{marginBottom:8, color:"var(--si-muted)"}}><Icon name="search" size={22} /></div>
            <div style={{fontWeight:800, color:"var(--si-text)", marginBottom:6}}>No query yet</div>
            <div>Enter a server IP above to see live stats. Example: play.cubecraft.net</div>
          </div>
        )}
      </div>
    </div>
  );
}
