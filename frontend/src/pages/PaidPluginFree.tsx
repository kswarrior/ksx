import { useMemo, useState } from "react";
import "./PaidPluginFree.css";

type Plugin = { name: string; link: string };
const plugins: Plugin[] = [
  { name: "LifeStealCore", link: "https://www.mediafire.com/file/gqaztuus09eqmus/LifestealCore_Build_2024.12-c.jar/file" },
  { name: "ItemsAdder", link: "https://www.mediafire.com/file/dq54xg97aedh6dy/ItemsAdder_4.0.8..jar/file" },
  { name: "AdvancedEnchantments", link: "https://www.mediafire.com/file/yj0hjxrpm0ulk9c/AdvancedEnchantments-9.14.5.jar/file" },
  { name: "UltraPermissions", link: "https://www.mediafire.com/file/9lxwd8x6znqh6qw/UltraPermissions.jar/file" },
  { name: "GSit (Premium)", link: "https://www.mediafire.com/file/scrrnac4rs5egwm/GSit-2.2.0.jar/file" },
  { name: "TAB (Premium)", link: "https://www.mediafire.com/file/ebdjpifh4k4k0vc/TAB_v4.1.4.jar/file" },
  { name: "MythicMobs", link: "https://www.mediafire.com/file/9v8kde474r61r52/UltraCustomizer-2.6.0.jar/file" },
  { name: "UltraCustomizer", link: "https://www.mediafire.com/file/9v8kde474r61r52/UltraCustomizer-2.6.0.jar/file" },
  { name: "ShopGUI+", link: "https://www.mediafire.com/file/3lbriu8lj5dg8jr/ShopGUIPlus-1.102.0.jar/file" },
  { name: "Jobs Reborn", link: "https://www.mediafire.com/file/3lbriu8lj5dg8jr/ShopGUIPlus-1.102.0.jar/file" },
  { name: "Model Engine", link: "https://www.mediafire.com/file/chupe2g19emexzc/ModelEngine-4.0.8.jar/file" },
  { name: "Vote Party", link: "https://www.mediafire.com/file/a00vor3p38gjp3i/VoteParty-2.39.jar/file" },
  { name: "CoreProtect (Premium)", link: "https://www.mediafire.com/file/2f97ozjn4xsviws/CoreProtect-23.2-RC3.jar/file" },
  { name: "Crate Reloaded", link: "https://www.mediafire.com/file/xr6wfbfitsqx3oh/CrateReloaded-2.3.13.jar/file" },
  { name: "BeautyQuests Expansion", link: "https://www.mediafire.com/file/xu44qflgraabgc7/beautyquests-expansion-1.2.4.jar/file" },
];

export default function PaidPluginFree() {
  const [q, setQ] = useState("");
  const filtered = useMemo(()=> plugins.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())), [q]);
  return (
    <div className="paid-page">
      <div className="paid-bg" aria-hidden>
        <div className="paid-bg-grad" />
        <div className="paid-bg-orb o1" />
        <div className="paid-bg-orb o2" />
      </div>
      <div className="paid-shell">
        <header className="paid-header">
          <div className="paid-kicker"><span className="paid-kicker-dot" /> MAKE SERVER • PLUGINS</div>
          <h1 className="paid-title">Paid Plugins <span>For Free</span></h1>
          <p className="paid-sub">Premium plugins unlocked — lifesteal, itemsadder, enchantments & more. Search & download.</p>
          <div className="paid-search-wrap">
            <div className="paid-search">
              <svg viewBox="0 0 24 24" aria-hidden><circle cx="11" cy="11" r="6.5"/><path d="M16 16 L20 20"/></svg>
              <input placeholder="Search plugin name…" value={q} onChange={(e)=>setQ(e.target.value)} aria-label="Search plugin" spellCheck={false} />
              {q && <button onClick={()=>setQ("")} style={{width:34,height:34,borderRadius:999,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.06)",color:"#fff",display:"grid",placeItems:"center",cursor:"pointer",flexShrink:0}}>✕</button>}
            </div>
            <div className="paid-stats"><strong>{filtered.length}</strong> of <strong>{plugins.length}</strong> plugins</div>
          </div>
        </header>

        <div className="paid-grid">
          {filtered.map((p) => (
            <article key={p.name} className="paid-card">
              <div className="paid-icon">🧩</div>
              <h3 title={p.name}>{p.name}</h3>
              <a href={p.link} className="download-btn" target="_blank" rel="noreferrer">
                Download ↗
              </a>
            </article>
          ))}
        </div>
        {filtered.length === 0 && <div className="paid-empty">No plugins match “{q}”.</div>}
      </div>
    </div>
  );
}
