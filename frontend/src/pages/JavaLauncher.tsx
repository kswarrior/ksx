import { useMemo, useState } from "react";
import "./JavaLauncher.css";

type Launcher = {
  name: string;
  stars: number;
  platform: "PC" | "Android";
  info: string[];
  link: string;
  logo: string;
};

const launchers: Launcher[] = [
  {
    name: "TLauncher",
    stars: 4,
    platform: "PC",
    info: [
      "Play Minecraft: Java Edition on PC.",
      "Supports all Minecraft versions, including snapshots.",
      "Easy mod and modpack management (Forge, Fabric, OptiFine).",
      "Automatic account login and premium account support.",
      "Performance optimizations and multiplayer server compatibility.",
    ],
    link: "https://tlauncher.org/en/",
    logo: "🎮",
  },
  {
    name: "MultiMC",
    stars: 5,
    platform: "PC",
    info: ["Open-source launcher for PC.", "Supports multiple instances and versions.", "Easy mod management.", "Lightweight and stable.", "Premium account support."],
    link: "https://multimc.org/",
    logo: "🧩",
  },
  {
    name: "GDLauncher",
    stars: 4,
    platform: "PC",
    info: ["Modern launcher with clean interface.", "Supports modpacks and multiple versions.", "Cloud saves and easy account management.", "Open-source and lightweight."],
    link: "https://gdevs.io/",
    logo: "🚀",
  },
  {
    name: "ATLauncher",
    stars: 4,
    platform: "PC",
    info: ["Launcher focused on modpacks for Minecraft.", "Easy installation and management of modded instances.", "Supports all Minecraft versions.", "Open-source and free."],
    link: "https://www.atlauncher.com/",
    logo: "📦",
  },
  {
    name: "Prism Launcher",
    stars: 4,
    platform: "PC",
    info: ["Supports all Minecraft versions and multiple instances.", "Open-source launcher for modded and vanilla Minecraft.", "Highly customizable and lightweight."],
    link: "https://prismlauncher.org/",
    logo: "🔷",
  },
  {
    name: "Fold Craft Launcher",
    stars: 4,
    platform: "Android",
    info: ["Full support for mods, shaders, and resource packs.", "Customizable controls and launcher themes.", "Performance optimizations for smoother gameplay.", "Supports Forge, Fabric, LiteLoader, and OptiFine."],
    link: "https://fcl-team.github.io/pages/download.html",
    logo: "📱",
  },
  {
    name: "Mojo Launcher",
    stars: 3,
    platform: "Android",
    info: ["Supports Forge and Fabric mod loaders.", "Access all Minecraft versions, including snapshots.", "Modpack support (CurseForge & Modrinth).", "Open-source and regularly updated."],
    link: "https://play.google.com/store/apps/details?id=git.artdeell.mojo&hl=en",
    logo: "🤖",
  },
  {
    name: "PojavLauncher",
    stars: 3,
    platform: "Android",
    info: ["Run Minecraft: Java Edition on Android.", "Supports Forge, Fabric, and various mod loaders.", "Access all Minecraft versions including snapshots.", "Open-source and actively developed."],
    link: "https://pojavlauncher.en.softonic.com/android",
    logo: "⛏️",
  },
  {
    name: "Zalith Launcher",
    stars: 3,
    platform: "Android",
    info: ["Fork of PojavLauncher with a redesigned interface.", "Supports Forge, Fabric, and other mod loaders.", "Access all Minecraft versions including snapshots.", "Optimized for better performance."],
    link: "https://github.com/ZalithLauncher/ZalithLauncher/releases",
    logo: "⚡",
  },
];

function Stars({ n }: { n: number }) {
  return (
    <div className="launcher-stat">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24">
          <path fill={i < n ? "#ffd54a" : "rgba(255,255,255,0.18)"} d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.79 1.402 8.168L12 18.896 4.664 23.158l1.402-8.168L.132 9.2l8.2-1.192z" />
        </svg>
      ))}
    </div>
  );
}

export default function JavaLauncher() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"All"|"PC"|"Android">("All");
  const filtered = useMemo(()=> launchers.filter((l) => {
    if (filter!=="All" && l.platform!==filter) return false;
    if (q && !l.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [q, filter]);

  return (
    <div className="jl-page">
      <div className="jl-bg" aria-hidden>
        <div className="jl-bg-grad" />
        <div className="jl-bg-orb o1" />
        <div className="jl-bg-orb o2" />
      </div>
      <div className="jl-shell">
        <header className="jl-header">
          <div className="jl-kicker"><span className="jl-kicker-dot" /> JAVA EDITION • LAUNCHERS</div>
          <h1 className="jl-title">Minecraft Java <span>Launchers</span></h1>
          <p className="jl-sub">PC & Android launchers for Java Edition — modpacks, shaders, snapshots. Search, filter & download.</p>
          <div className="jl-search-wrap">
            <div className="jl-search">
              <svg viewBox="0 0 24 24" aria-hidden><circle cx="11" cy="11" r="6.5"/><path d="M16 16 L20 20"/></svg>
              <input placeholder="Search launcher by name…" value={q} onChange={(e)=>setQ(e.target.value)} aria-label="Search launcher" spellCheck={false} />
              {q && <button onClick={()=>setQ("")} style={{width:34,height:34,borderRadius:999,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.06)",color:"#fff",display:"grid",placeItems:"center",cursor:"pointer",flexShrink:0}}>✕</button>}
            </div>
            <div className="jl-filters">
              {(["All","PC","Android"] as const).map(v=> (
                <button key={v} className={`jl-pill ${filter===v?"active":""}`} onClick={()=>setFilter(v)}>{v} {v==="All"?`• ${launchers.length}`: v==="PC"?`• ${launchers.filter(x=>x.platform==="PC").length}`:`• ${launchers.filter(x=>x.platform==="Android").length}`}</button>
              ))}
            </div>
            <div className="jl-stats"><strong>{filtered.length}</strong> of <strong>{launchers.length}</strong> launchers</div>
          </div>
        </header>

        <div className="launcher-list">
          {filtered.map((l) => (
            <article key={l.name} className="launcher-card">
              <div className="top-row">
                <div className="launcher-logo" aria-hidden>{l.logo}</div>
                <div style={{minWidth:0, flex:1}}>
                  <div className="launcher-name">{l.name}</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop:6, flexWrap:"wrap" }}>
                    <Stars n={l.stars} />
                    <span className="platform-badge">{l.platform}</span>
                  </div>
                </div>
              </div>
              <ul className="launcher-info">
                {l.info.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <a href={l.link} target="_blank" rel="noreferrer" style={{marginTop:"auto"}}>
                <button className="download-btn">Download ↗</button>
              </a>
            </article>
          ))}
        </div>
        {filtered.length===0 && <div style={{textAlign:"center", padding:32, color:"var(--jl-muted)", background:"rgba(14,14,24,0.9)", border:"1px solid var(--jl-border)", borderRadius:16, marginTop:14}}>No launchers match search.</div>}
      </div>
    </div>
  );
}
