import { useMemo, useState } from "react";
import Icon from "../components/Icon";
import PageHero from "../components/PageHero";
import { SearchField } from "../components/ui";
import "./PaidPluginFree.css";

type Plugin = { name: string; version: string; size: string; description: string; link: string };
const plugins: Plugin[] = [
  {
    name: "LifeStealCore",
    version: "2024.12-c",
    size: "1.17 MB",
    description: "Lifesteal SMP core with heart stealing, revive beacons, custom hearts, withdrawable heart items and anti-exploit protection.",
    link: "https://www.mediafire.com/file/gqaztuus09eqmus/LifestealCore_Build_2024.12-c.jar/file",
  },
  {
    name: "ItemsAdder",
    version: "4.0.8",
    size: "2.96 MB",
    description: "Add custom items, blocks, furniture, mobs, GUIs, HUDs and emojis through a server resource pack — no client mods required.",
    link: "https://www.mediafire.com/file/dq54xg97aedh6dy/ItemsAdder_4.0.8..jar/file",
  },
  {
    name: "AdvancedEnchantments",
    version: "9.14.5",
    size: "3.13 MB",
    description: "Create and manage 450+ custom enchantments with an in-game editor, anvil support, souls, enchanter and tinkerer.",
    link: "https://www.mediafire.com/file/yj0hjxrpm0ulk9c/AdvancedEnchantments-9.14.5.jar/file",
  },
  {
    name: "UltraPermissions",
    version: "5.3.1",
    size: "1.64 MB",
    description: "Permission and rank manager with an in-game GUI and web editor, inheritance, temporary permissions and Vault support.",
    link: "https://www.mediafire.com/file/9lxwd8x6znqh6qw/UltraPermissions.jar/file",
  },
  {
    name: "GSit (Premium)",
    version: "2.2.0",
    size: "508.63 KB",
    description: "Let players sit, lay, crawl and spin on blocks, stairs and slabs, with pose permissions, rotations and custom messages.",
    link: "https://www.mediafire.com/file/scrrnac4rs5egwm/GSit-2.2.0.jar/file",
  },
  {
    name: "TAB (Premium)",
    version: "4.1.4",
    size: "1.27 MB",
    description: "Fully animated tablist, scoreboard, bossbar and playerlist objective plugin with placeholders, sorting and per-player layouts.",
    link: "https://www.mediafire.com/file/ebdjpifh4k4k0vc/TAB_v4.1.4.jar/file",
  },
  {
    name: "MythicMobs",
    version: "Latest",
    size: "3.93 MB",
    description: "Create custom mobs, bosses, skills, items and drops in YAML, with spawners, disguises, scripting and expansion support.",
    link: "https://www.mediafire.com/file/9v8kde474r61r52/UltraCustomizer-2.6.0.jar/file",
  },
  {
    name: "UltraCustomizer",
    version: "2.6.0",
    size: "3.93 MB",
    description: "Create custom items, armour sets, weapons, tools and GUIs with abilities, effects and full in-game configuration.",
    link: "https://www.mediafire.com/file/9v8kde474r61r52/UltraCustomizer-2.6.0.jar/file",
  },
  {
    name: "ShopGUI+",
    version: "1.102.0",
    size: "711.62 KB",
    description: "Build unlimited GUI shops with categories, item prices, permissions, commands and Vault or player-points economy support.",
    link: "https://www.mediafire.com/file/3lbriu8lj5dg8jr/ShopGUIPlus-1.102.0.jar/file",
  },
  {
    name: "Jobs Reborn",
    version: "Latest",
    size: "711.62 KB",
    description: "Add a full jobs and economy system with joinable professions, salaries, level progression, action bars and Vault rewards.",
    link: "https://www.mediafire.com/file/3lbriu8lj5dg8jr/ShopGUIPlus-1.102.0.jar/file",
  },
  {
    name: "Model Engine",
    version: "4.0.8",
    size: "2.21 MB",
    description: "Bring custom 3D models, textures and animations to items, blocks, mobs and armour stands without client mods.",
    link: "https://www.mediafire.com/file/chupe2g19emexzc/ModelEngine-4.0.8.jar/file",
  },
  {
    name: "Vote Party",
    version: "2.39",
    size: "3.03 MB",
    description: "Reward the whole server when a vote goal is reached, with configurable parties, crate rewards, broadcasts and vote tracking.",
    link: "https://www.mediafire.com/file/a00vor3p38gjp3i/VoteParty-2.39.jar/file",
  },
  {
    name: "CoreProtect (Premium)",
    version: "23.2-RC3",
    size: "1.75 MB",
    description: "Log and roll back block, container and entity changes, inspect griefing and restore damaged builds with fast storage.",
    link: "https://www.mediafire.com/file/2f97ozjn4xsviws/CoreProtect-23.2-RC3.jar/file",
  },
  {
    name: "Crate Reloaded",
    version: "2.3.13",
    size: "1.62 MB",
    description: "Create fully customisable crates with keys, reward tables, animations, holograms, GUIs and per-crate permissions.",
    link: "https://www.mediafire.com/file/xr6wfbfitsqx3oh/CrateReloaded-2.3.13.jar/file",
  },
  {
    name: "BeautyQuests Expansion",
    version: "1.2.4",
    size: "129.94 KB",
    description: "An add-on for BeautyQuests that adds extra objective types and integrations, letting quest authors build richer missions.",
    link: "https://www.mediafire.com/file/xu44qflgraabgc7/beautyquests-expansion-1.2.4.jar/file",
  },
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
          <PageHero variant="inline" icon="puzzle" title="Free Paid Plugins" />

          <div className="paid-search-wrap">
            <SearchField
              className="paid-search"
              value={q}
              onValueChange={setQ}
              placeholder="Search plugin name…"
              ariaLabel="Search plugin"
            />
            <div className="paid-stats"><strong>{filtered.length}</strong> of <strong>{plugins.length}</strong> plugins</div>
          </div>
        </header>

        <div className="paid-grid">
          {filtered.map((p) => (
            <article key={p.name} className="paid-card">
              <div className="paid-card-top">
                <div className="paid-icon"><Icon name="puzzle" size={20} /></div>
                <div className="paid-identity">
                  <h3 title={p.name}>{p.name}</h3>
                  <span className="paid-version">v{p.version}</span>
                </div>
                <a
                  href={p.link}
                  className="paid-icon-btn"
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Download ${p.name}`}
                  title={`Download ${p.name}`}
                >
                  <Icon name="download" size={17} />
                </a>
              </div>
              <p className="paid-desc">{p.description}</p>
              <a href={p.link} className="download-btn" target="_blank" rel="noreferrer">
                <Icon name="download" size={14} /> Download
                <span className="paid-size">{p.size}</span>
              </a>
            </article>
          ))}
        </div>
        {filtered.length === 0 && <div className="paid-empty">No plugins match “{q}”.</div>}
      </div>
    </div>
  );
}
