import type { IconName } from "../components/Icon";
import lifesteadMarkdown from "./ks-lifestead.md?raw";
import pluginManagerMarkdown from "./ks-plugin-manager.md?raw";

export type KsPluginDetail = {
  icon: IconName;
  label: string;
  value: string;
};

export type KsPlugin = {
  slug: string;
  name: string;
  owner: string;
  version: string;
  tagline: string;
  tags: string[];
  downloadUrl: string;
  downloadLabel: string;
  details: KsPluginDetail[];
  markdown: string;
};

export const KS_PLUGINS: KsPlugin[] = [
  {
    slug: "lifestead",
    name: "KS Lifestead",
    owner: "KS Warrior",
    version: "1.0.0",
    tagline:
      "A heart economy for Minecraft Java: steal hearts in PvP, lose hearts on death, withdraw and deposit hearts, and revive eliminated players.",
    tags: ["Heart economy", "PvP", "Revive", "PlaceholderAPI"],
    downloadUrl:
      "https://github.com/kswarrior/opencode/raw/refs/heads/main/ks-plugins/lifestead/release/plugin/KS-Lifestead-1.0.0.jar",
    downloadLabel: "Download JAR",
    details: [
      { icon: "package", label: "Version", value: "1.0.0" },
      { icon: "server", label: "Platform", value: "Paper · Spigot · Bukkit · Purpur" },
      { icon: "puzzle", label: "Type", value: "Spigot plugin" },
      { icon: "gamepad", label: "Minecraft", value: "Java 1.21.11" },
      { icon: "check", label: "Optional", value: "PlaceholderAPI 2.12.3+" },
    ],
    markdown: lifesteadMarkdown,
  },
  {
    slug: "plugin-manager",
    name: "KS Plugin Manager",
    owner: "KS Warrior",
    version: "1.0.0",
    tagline:
      "A runtime plugin manager for Paper, Spigot and Bukkit: load, unload, reload, enable, disable, update and remove plugins without restarting.",
    tags: ["Plugin manager", "Load / unload", "Updates", "Remove plugins"],
    downloadUrl:
      "https://github.com/kswarrior/opencode/raw/refs/heads/main/ks-plugins/plugin-manager/release/plugin/KSPluginManager-1.0.0.jar",
    downloadLabel: "Download JAR",
    details: [
      { icon: "package", label: "Version", value: "1.0.0" },
      { icon: "server", label: "Platform", value: "Paper · Spigot · Bukkit" },
      { icon: "puzzle", label: "Type", value: "Runtime plugin manager" },
      { icon: "check", label: "Permission", value: "kspluginmanager.use (default OP)" },
    ],
    markdown: pluginManagerMarkdown,
  },
];

export function getKsPlugin(slug: string | undefined): KsPlugin | undefined {
  return KS_PLUGINS.find((plugin) => plugin.slug === slug);
}
