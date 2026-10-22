import { useMemo, useState } from "react";
import FilterMenu from "../components/FilterMenu";
import BrandLogo from "../components/BrandLogo";
import Icon, { type IconName } from "../components/Icon";
import PageHero from "../components/PageHero";
import { SearchField, Select, type SelectOption } from "../components/ui";
import "./JavaLauncher.css";

const platformFilters = ["All", "Windows", "macOS", "Linux", "Android", "iOS"] as const;
type PlatformFilter = (typeof platformFilters)[number];
type Platform = Exclude<PlatformFilter, "All">;
type Category = "Official" | "Modded" | "PvP" | "Mobile";
type Source = "Official" | "Open source" | "Freeware";

type Launcher = {
  name: string;
  logo: string;
  tagline: string;
  platforms: Platform[];
  category: Category;
  source: Source;
  account: string;
  features: string[];
  caveat: string;
  link: string;
  icon: IconName;
};

const launchers: Launcher[] = [
  {
    name: "Minecraft Launcher",
    logo: "https://www.google.com/s2/favicons?domain=minecraft.net&sz=128",
    tagline: "The official Mojang launcher for Java and Bedrock.",
    platforms: ["Windows", "macOS", "Linux"],
    category: "Official",
    source: "Official",
    account: "Microsoft account",
    features: [
      "Official Java and Bedrock launcher",
      "Snapshots, updates and quick play",
      "Profile, skin and Realms access",
    ],
    caveat: "No modpack manager or built-in mod browser. Linux builds are x86_64 and distro packaging varies.",
    link: "https://www.minecraft.net/en-us/download",
    icon: "gamepad",
  },
  {
    name: "Prism Launcher",
    logo: "https://github.com/PrismLauncher.png?size=128",
    tagline: "Powerful open-source launcher for modded instances.",
    platforms: ["Windows", "macOS", "Linux"],
    category: "Modded",
    source: "Open source",
    account: "Microsoft account",
    features: [
      "Multiple isolated instances and accounts",
      "Modrinth and CurseForge mod browsing",
      "Automatic Java runtime management",
      "Lightweight Qt interface with themes",
    ],
    caveat: "Desktop only. CurseForge browsing can require extra setup, and there is no mobile version.",
    link: "https://prismlauncher.org/download/",
    icon: "gem",
  },
  {
    name: "Modrinth App",
    logo: "https://github.com/modrinth.png?size=128",
    tagline: "Modrinth-native launcher with one-click mods and packs.",
    platforms: ["Windows", "macOS", "Linux"],
    category: "Modded",
    source: "Open source",
    account: "Microsoft account",
    features: [
      "Built-in Modrinth mod and modpack browser",
      "One-click updates and instance importing",
      "Per-instance settings and skin selector",
      "Open source with Windows, macOS and Linux builds",
    ],
    caveat: "CurseForge content is not supported, and Linux builds are known to be unstable on some systems.",
    link: "https://modrinth.com/app",
    icon: "sparkles",
  },
  {
    name: "GDLauncher",
    logo: "https://github.com/gorilla-devs.png?size=128",
    tagline: "Polished modpack launcher with cloud instance sharing.",
    platforms: ["Windows", "macOS", "Linux"],
    category: "Modded",
    source: "Open source",
    account: "Microsoft account",
    features: [
      "One-click CurseForge and Modrinth installs",
      "Automatic Java and dependency setup",
      "Cloud instance sharing codes",
      "Built-in server manager",
    ],
    caveat: "Not as lightweight as Prism or MultiMC, and there is no mobile version.",
    link: "https://gdlauncher.com/",
    icon: "rocket",
  },
  {
    name: "ATLauncher",
    logo: "https://github.com/ATLauncher.png?size=128",
    tagline: "Modpack-focused launcher with a large built-in catalog.",
    platforms: ["Windows", "macOS", "Linux"],
    category: "Modded",
    source: "Open source",
    account: "Microsoft account",
    features: [
      "Large curated modpack catalog",
      "Browses CurseForge, Modrinth and Technic packs",
      "Forge, Fabric and NeoForge support",
      "Open source and free",
    ],
    caveat: "Desktop only. The interface is less modern than Prism or Modrinth App.",
    link: "https://www.atlauncher.com/",
    icon: "package",
  },
  {
    name: "MultiMC",
    logo: "https://github.com/MultiMC.png?size=128",
    tagline: "Lightweight, predictable instance manager.",
    platforms: ["Windows", "macOS", "Linux"],
    category: "Modded",
    source: "Open source",
    account: "Microsoft account",
    features: [
      "Cleanly separated instances",
      "Forge, Fabric, Quilt and LiteLoader",
      "Import packs from Modrinth, CurseForge and FTB",
      "Low memory footprint",
    ],
    caveat: "No built-in mod browser or updater, and releases are infrequent.",
    link: "https://multimc.org/",
    icon: "puzzle",
  },
  {
    name: "CurseForge App",
    logo: "https://github.com/CurseForge.png?size=128",
    tagline: "The official CurseForge app for mods and modpacks.",
    platforms: ["Windows", "macOS", "Linux"],
    category: "Modded",
    source: "Freeware",
    account: "Microsoft account",
    features: [
      "Huge CurseForge mod and modpack catalog",
      "One-click installs and updates",
      "Standalone app on Windows, macOS and Linux",
      "Built-in mod management",
    ],
    caveat: "Ad-supported unless you pay for Premium. Windows also has an Overwolf build with extra integration.",
    link: "https://www.curseforge.com/download/app",
    icon: "cloud",
  },
  {
    name: "FTB App",
    logo: "https://github.com/FTBTeam.png?size=128",
    tagline: "Official launcher for Feed The Beast modpacks.",
    platforms: ["Windows", "macOS", "Linux"],
    category: "Modded",
    source: "Freeware",
    account: "Microsoft account",
    features: [
      "Official FTB modpack catalog",
      "One-click pack installs and updates",
      "Electron app on all desktop platforms",
      "Access to FTB Worlds and server files",
    ],
    caveat: "Focused on FTB packs and funded by ads. Other modpacks are limited.",
    link: "https://www.feed-the-beast.com/ftb-app",
    icon: "pickaxe",
  },
  {
    name: "Technic Launcher",
    logo: "https://github.com/TechnicPack.png?size=128",
    tagline: "Classic platform for community modpacks.",
    platforms: ["Windows", "macOS", "Linux"],
    category: "Modded",
    source: "Open source",
    account: "Microsoft account",
    features: [
      "Thousands of community modpacks",
      "One-click installs and automatic updates",
      "Runs on Windows, macOS and Linux",
      "Open-source launcher",
    ],
    caveat: "An older platform. Third-party packs may use external download sources.",
    link: "https://www.technicpack.net/download",
    icon: "sliders",
  },
  {
    name: "Lunar Client",
    logo: "https://github.com/LunarClient.png?size=128",
    tagline: "PvP-focused client with performance mods.",
    platforms: ["Windows", "macOS", "Linux"],
    category: "PvP",
    source: "Freeware",
    account: "Microsoft account",
    features: [
      "65+ built-in PvP and utility mods",
      "FPS boosts and performance settings",
      "Windows, macOS and Linux support",
      "Free with optional cosmetics and Lunar+",
    ],
    caveat: "Closed-source and built for PvP, not heavy modpacks. Cosmetics and Lunar+ are paid extras.",
    link: "https://www.lunarclient.com/download",
    icon: "zap",
  },
  {
    name: "Badlion Client",
    logo: "https://github.com/BadlionClient.png?size=128",
    tagline: "PvP client with 100+ mods and FPS boosts.",
    platforms: ["Windows", "macOS", "Linux"],
    category: "PvP",
    source: "Freeware",
    account: "Microsoft account",
    features: [
      "100+ PvP and utility mods",
      "FPS improvements and anti-cheat",
      "Windows, macOS and Linux support",
      "Free with optional cosmetics",
    ],
    caveat: "Closed-source and limited to select Minecraft versions. Cosmetics are paid extras.",
    link: "https://www.badlion.net/minecraft-client",
    icon: "play",
  },
  {
    name: "Amethyst",
    logo: "https://github.com/AngelAuraMC.png?size=128",
    tagline: "PojavLauncher successor for Java on mobile.",
    platforms: ["Android", "iOS"],
    category: "Mobile",
    source: "Open source",
    account: "Microsoft account",
    features: [
      "Minecraft Java Edition on Android and iOS",
      "Forge and Fabric mod support",
      "Installs mods and mod loaders",
      "Actively maintained PojavLauncher successor",
    ],
    caveat: "Mobile performance and mod compatibility vary by device. The iOS build is separate.",
    link: "https://github.com/AngelAuraMC/Amethyst-Android/releases",
    icon: "smartphone",
  },
  {
    name: "Zalith Launcher 2",
    logo: "https://github.com/ZalithLauncher.png?size=128",
    tagline: "Modern Android launcher with Material 3 UI.",
    platforms: ["Android"],
    category: "Mobile",
    source: "Open source",
    account: "Microsoft account",
    features: [
      "Modern Jetpack Compose interface",
      "PojavLauncher-based game core",
      "Android 8.0+ support",
      "Actively developed replacement for Zalith 1",
    ],
    caveat: "Android only. It is a newer project, so expect bugs and missing polish.",
    link: "https://github.com/ZalithLauncher/ZalithLauncher2/releases",
    icon: "bot",
  },
  {
    name: "Fold Craft Launcher",
    logo: "https://github.com/FCL-Team.png?size=128",
    tagline: "Android launcher with mods, shaders and controls.",
    platforms: ["Android"],
    category: "Mobile",
    source: "Open source",
    account: "Microsoft account",
    features: [
      "Mods, shaders and resource packs",
      "Forge, Fabric, Quilt, LiteLoader and OptiFine",
      "Customizable controls and themes",
      "Performance options for mobile devices",
    ],
    caveat: "Android only. Performance and mod compatibility depend heavily on the device.",
    link: "https://fcl-team.github.io/pages/download.html",
    icon: "folder",
  },
  {
    name: "Mojo Launcher",
    logo: "https://github.com/MojoLauncher.png?size=128",
    tagline: "Android Java launcher with broad mod support.",
    platforms: ["Android"],
    category: "Mobile",
    source: "Open source",
    account: "Microsoft account",
    features: [
      "Java Edition on Android",
      "Forge/Fabric and .jar installer support",
      "CurseForge and Modrinth pack import",
      "Multiple renderers including Turnip and Zink",
    ],
    caveat: "Android only and still PojavLauncher-based, so some mods and renderers have issues.",
    link: "https://github.com/MojoLauncher/MojoLauncher/releases",
    icon: "puzzle",
  },
];

const categoryOptions: SelectOption[] = [
  { value: "All", label: "Category • All" },
  { value: "Official", label: "Official" },
  { value: "Modded", label: "Modded" },
  { value: "PvP", label: "PvP" },
  { value: "Mobile", label: "Mobile" },
];

export default function JavaLauncher() {
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState<PlatformFilter>("All");
  const [category, setCategory] = useState("All");

  const filtered = useMemo(() => launchers.filter((l) => {
    if (platform !== "All" && !l.platforms.includes(platform)) return false;
    if (category !== "All" && l.category !== category) return false;
    if (q) {
      const haystack = `${l.name} ${l.tagline} ${l.category} ${l.platforms.join(" ")} ${l.features.join(" ")}`.toLowerCase();
      if (!haystack.includes(q.toLowerCase())) return false;
    }
    return true;
  }), [q, platform, category]);

  const clearFilters = () => { setQ(""); setPlatform("All"); setCategory("All"); };
  const activeFilters = Number(platform !== "All") + Number(category !== "All");
  const countPlatform = (p: PlatformFilter) => p === "All" ? launchers.length : launchers.filter((l) => l.platforms.includes(p)).length;

  return (
    <div className="jl-page">
      <div className="jl-bg" aria-hidden>
        <div className="jl-bg-grad" />
        <div className="jl-bg-orb o1" />
        <div className="jl-bg-orb o2" />
      </div>
      <div className="jl-shell">
        <header className="jl-header">
          <PageHero
            variant="inline"
            icon="gamepad"
            title="Java Launcher"
            subtitle="Free launchers for Minecraft: Java Edition, from the official client to modded and mobile options. Official links and verified caveats only. Checked Oct 2026."
          />

          <div className="jl-search-wrap">
            <div className="jl-search-row">
              <SearchField
                className="jl-search"
                value={q}
                onValueChange={setQ}
                placeholder="Search launcher, feature or platform…"
                ariaLabel="Search launcher"
              />
              <FilterMenu activeCount={activeFilters}>
                <div className="jl-filters">
                  {platformFilters.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`jl-pill ${platform === p ? "active" : ""}`}
                      onClick={() => setPlatform(p)}
                    >
                      {p} <span className="jl-pill-count">{countPlatform(p)}</span>
                    </button>
                  ))}
                </div>
                <div className="jl-filter-row">
                  <Select
                    className="jl-select"
                    value={category}
                    onChange={setCategory}
                    options={categoryOptions}
                    ariaLabel="Launcher category"
                  />
                  {(q || platform !== "All" || category !== "All") && (
                    <button type="button" className="jl-filter-clear" onClick={clearFilters}>
                      Clear filters <Icon name="close" size={12} />
                    </button>
                  )}
                </div>
              </FilterMenu>
            </div>
            <div className="jl-stats"><strong>{filtered.length}</strong> of <strong>{launchers.length}</strong> launchers</div>
          </div>
        </header>

        {filtered.length === 0 ? (
          <div className="jl-empty">
            <div className="jl-empty-icon"><Icon name="search" size={26} /></div>
            <div className="jl-empty-title">No launchers match</div>
            <div className="jl-empty-text">Try a different search or clear the filters.</div>
            <button type="button" className="jl-empty-btn" onClick={clearFilters}>Clear filters</button>
          </div>
        ) : (
          <div className="launcher-list">
            {filtered.map((l) => (
              <article key={l.name} className={`launcher-card cat-${l.category.toLowerCase()}`}>
                <div className="launcher-top">
                  <BrandLogo className="launcher-logo" src={l.logo} fallback={l.icon} iconSize={28} />
                  <div className="launcher-heading">
                    <div className="launcher-name">{l.name}</div>
                    <div className="launcher-tagline">{l.tagline}</div>
                  </div>
                  <span className={`launcher-category ${l.category.toLowerCase()}`}>{l.category}</span>
                </div>

                <div className="launcher-badges">
                  {l.platforms.map((p) => (
                    <span key={p} className="launcher-badge">{p}</span>
                  ))}
                  <span className={`launcher-badge source-${l.source === "Open source" ? "open-source" : l.source.toLowerCase()}`}>{l.source}</span>
                </div>

                <ul className="launcher-features">
                  {l.features.map((feature) => (
                    <li key={feature}><Icon name="check" size={13} /><span>{feature}</span></li>
                  ))}
                </ul>

                <div className="launcher-note"><Icon name="warning" size={14} /><span>{l.caveat}</span></div>

                <div className="launcher-bottom">
                  <span className="launcher-account"><Icon name="globe" size={13} /> {l.account}</span>
                  <a className="launcher-btn" href={l.link} target="_blank" rel="noreferrer">
                    <Icon name="download" size={14} /> Download
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
