import { useState } from "react";
import "./ServerInfo.css";

type McStatus = Record<string, unknown>;

export default function ServerInfo() {
  const [ip, setIp] = useState("");
  const [data, setData] = useState<McStatus | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchInfo() {
    if (!ip.trim()) { alert("Please enter a server IP"); return; }
    setLoading(true);
    try {
      const res = await fetch(`https://api.mcsrvstat.us/3/${ip.trim()}`);
      const json = await res.json();
      setData(json);
    } catch {
      alert("Failed to fetch");
    } finally { setLoading(false); }
  }

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
          <div className="si-kicker"><span className="si-kicker-dot" /> SERVER • STATICS</div>
          <h1 className="si-title">Minecraft Server <span>Info</span></h1>
          <p className="si-sub">Enter any Java/Bedrock IP — get status, players, MOTD & version instantly.</p>
          <div className="si-search">
            <input className="si-input" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="Enter server IP (e.g. play.hypixel.net)" aria-label="Server IP" onKeyDown={(e)=> e.key==="Enter" && fetchInfo()} />
            <button className="si-btn" onClick={fetchInfo}>{loading ? "Checking…" : "Search ↗"}</button>
          </div>
        </header>

        {data && (
          <div className="si-card">
            <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
              <span style={{padding:"6px 10px", borderRadius:999, fontSize:12, fontWeight:900, background: online ? "rgba(74,222,128,0.15)" : "rgba(239,68,68,0.15)", color: online ? "#4ade80" : "#ef4444", border:"1px solid rgba(255,255,255,0.08)"}}>{online ? "● Online" : "● Offline"}</span>
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
            <div style={{fontSize:22, marginBottom:8}}>🔍</div>
            <div style={{fontWeight:800, color:"var(--si-text)", marginBottom:6}}>No query yet</div>
            <div>Enter a server IP above to see live stats. Example: play.cubecraft.net</div>
          </div>
        )}
      </div>
    </div>
  );
}
