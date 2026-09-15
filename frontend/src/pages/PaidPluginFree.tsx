import { useState } from "react";
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
  const filtered = plugins.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="paid-page">
      <h1>Minecraft Paid Plugins For Free</h1>
      <div className="search-box">
        <input placeholder="Search plugin name..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="container-wrapper">
        {filtered.map((p) => (
          <div key={p.name} className="ppf-container">
            <h2>{p.name}</h2>
            <a href={p.link} className="download-btn" target="_blank" rel="noreferrer">
              Download
            </a>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <div style={{ textAlign: "center", color: "#aaa", marginTop: 20 }}>No plugins found</div>}
    </div>
  );
}
