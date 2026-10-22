import { API_BASE } from "./api";

export type ServerSoftwareId =
  | "paper"
  | "purpur"
  | "folia"
  | "spigot"
  | "vanilla"
  | "fabric"
  | "quilt"
  | "forge"
  | "neoforge"
  | "velocity"
  | "waterfall";

export type ServerSoftware = {
  id: ServerSoftwareId;
  name: string;
  summary: string;
  supportsPre: boolean;
  installer: boolean;
};

export const SERVER_SOFTWARE: ServerSoftware[] = [
  { id: "paper", name: "Paper", summary: "Plugin server with performance patches.", supportsPre: true, installer: false },
  { id: "purpur", name: "Purpur", summary: "Paper fork with extra configuration options.", supportsPre: false, installer: false },
  { id: "folia", name: "Folia", summary: "Multithreaded Paper fork for regionized servers.", supportsPre: true, installer: false },
  { id: "spigot", name: "Spigot", summary: "Classic plugin server.", supportsPre: false, installer: false },
  { id: "vanilla", name: "Vanilla", summary: "Official Mojang server.", supportsPre: true, installer: false },
  { id: "fabric", name: "Fabric", summary: "Lightweight mod loader.", supportsPre: true, installer: false },
  { id: "quilt", name: "Quilt", summary: "Fabric-compatible mod loader.", supportsPre: true, installer: true },
  { id: "forge", name: "Forge", summary: "Modded server loader.", supportsPre: true, installer: true },
  { id: "neoforge", name: "NeoForge", summary: "Modern Forge-compatible loader.", supportsPre: true, installer: true },
  { id: "velocity", name: "Velocity", summary: "Modern proxy for multiple servers.", supportsPre: true, installer: false },
  { id: "waterfall", name: "Waterfall", summary: "Legacy BungeeCord-compatible proxy.", supportsPre: false, installer: false },
];

export type VersionInfo = {
  id: string;
  stable: boolean;
  note?: string;
};

export type BuildInfo = {
  id: string;
  label: string;
  note?: string;
};

export type LoaderInfo = {
  id: string;
  label: string;
  stable: boolean;
};

export type ServerJarInfo = {
  software: ServerSoftwareId;
  version: string;
  build?: string;
  loader?: string;
  kind: "server" | "installer";
  fileName: string;
  url: string;
  size?: number;
  sha1?: string;
  sha256?: string;
  md5?: string;
  channel?: string;
  releasedAt?: string;
  java?: number;
  installCommand?: string;
};

const FILL_API = "https://fill.papermc.io/v3";
const PURPUR_API = "https://api.purpurmc.org/v2/purpur";
const MOJANG_MANIFEST = "https://launchermeta.mojang.com/mc/game/version_manifest.json";
const FABRIC_META = "https://meta.fabricmc.net/v2";
const QUILT_META = "https://meta.quiltmc.org/v3";
const FORGE_MAVEN = "https://maven.minecraftforge.net/net/minecraftforge/forge";
const NEOFORGE_MAVEN = "https://maven.neoforged.net/releases/net/neoforged/neoforge";
const NEOFORGE_VERSIONS = "https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge";
const SPIGOT_API = "https://getbukkit.org/api/jars/spigot";
const SPIGOT_DOWNLOAD = "https://download.getbukkit.org";

const jsonCache = new Map<string, Promise<unknown>>();
const textCache = new Map<string, Promise<string>>();

function proxyUrl(url: string): string {
  return `${API_BASE}/api/server-jars/proxy?url=${encodeURIComponent(url)}`;
}

async function getJson<T>(url: string): Promise<T> {
  let cached = jsonCache.get(url) as Promise<T> | undefined;
  if (!cached) {
    cached = fetch(proxyUrl(url), { headers: { Accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return (await response.json()) as T;
      })
      .catch((error) => {
        jsonCache.delete(url);
        throw error;
      });
    jsonCache.set(url, cached);
  }
  return cached;
}

async function getText(url: string): Promise<string> {
  let cached = textCache.get(url);
  if (!cached) {
    cached = fetch(proxyUrl(url), { headers: { Accept: "text/plain, application/xml" } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .catch((error) => {
        textCache.delete(url);
        throw error;
      });
    textCache.set(url, cached);
  }
  return cached;
}

async function headInfo(url: string): Promise<{ size?: number; releasedAt?: string }> {
  try {
    const response = await fetch(proxyUrl(url), { method: "HEAD" });
    if (!response.ok) return {};
    const length = response.headers.get("content-length");
    const modified = response.headers.get("last-modified");
    return {
      size: length ? Number(length) : undefined,
      releasedAt: modified ? new Date(modified).toISOString() : undefined,
    };
  } catch {
    return {};
  }
}

function isPreRelease(version: string): boolean {
  return /(?:^|[-.])(pre|rc|snapshot|alpha|beta)/i.test(version);
}

function versionCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function javaForVersion(version: string): number | undefined {
  const match = version.match(/^(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!match) return undefined;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3] ?? 0);
  if (major >= 26) return 25;
  if (major !== 1) return undefined;
  if (minor >= 21) return 21;
  if (minor === 20) return patch >= 5 ? 21 : 17;
  if (minor >= 18) return 17;
  if (minor === 17) return 16;
  return 8;
}

type FillVersionProject = {
  project: { id: string; name: string };
  versions: Record<string, string[]>;
};

type FillBuild = {
  id: number;
  time: string;
  channel: string;
  commits?: { message?: string }[];
  downloads: Record<string, {
    name: string;
    checksums?: { sha256?: string };
    size: number;
    url: string;
  }>;
};

type PurpurProject = {
  versions: string[];
};

type PurpurBuilds = {
  builds: { latest: string; all: string[] };
};

type PurpurBuild = {
  build: string;
  result?: string;
  timestamp?: number;
  md5?: string;
};

type VanillaManifest = {
  latest: { release: string; snapshot: string };
  versions: {
    id: string;
    type: "release" | "snapshot" | string;
    url: string;
    time: string;
    releaseTime: string;
  }[];
};

type VanillaVersion = {
  id: string;
  downloads: {
    server?: { sha1?: string; size?: number; url: string };
  };
  javaVersion?: { majorVersion?: number };
};

type FabricGameVersion = { version: string; stable: boolean };
type FabricLoaderEntry = { loader: { version: string; stable: boolean } };
type FabricInstaller = { url: string; version: string; stable: boolean; file_size?: number; hashes?: { sha256?: string } };

type QuiltGameVersion = { version: string; stable: boolean };
type QuiltInstaller = { url: string; version: string; file_size?: number; hashes?: { sha256?: string } };

type SpigotJar = {
  type: string;
  version: string;
  fileName: string;
  size: number;
  builtAt: string;
  sha256: string;
  downloadUrl: string;
};

const PAPER_FAMILY: ServerSoftwareId[] = ["paper", "folia", "velocity", "waterfall"];
const PROXIES: ServerSoftwareId[] = ["velocity", "waterfall"];

async function fillProject(software: ServerSoftwareId): Promise<FillVersionProject> {
  return getJson<FillVersionProject>(`${FILL_API}/projects/${software}`);
}

async function fillBuilds(software: ServerSoftwareId, version: string): Promise<FillBuild[]> {
  return getJson<FillBuild[]>(
    `${FILL_API}/projects/${software}/versions/${encodeURIComponent(version)}/builds`
  );
}

async function purpurProject(): Promise<PurpurProject> {
  return getJson<PurpurProject>(PURPUR_API);
}

async function purpurBuilds(version: string): Promise<PurpurBuilds> {
  return getJson<PurpurBuilds>(`${PURPUR_API}/${encodeURIComponent(version)}`);
}

async function vanillaManifest(): Promise<VanillaManifest> {
  return getJson<VanillaManifest>(MOJANG_MANIFEST);
}

async function fabricGameVersions(): Promise<FabricGameVersion[]> {
  return getJson<FabricGameVersion[]>(`${FABRIC_META}/versions/game`);
}

async function fabricLoaders(version: string): Promise<FabricLoaderEntry[]> {
  return getJson<FabricLoaderEntry[]>(
    `${FABRIC_META}/versions/loader/${encodeURIComponent(version)}`
  );
}

async function fabricInstaller(): Promise<FabricInstaller> {
  const list = await getJson<FabricInstaller[]>(`${FABRIC_META}/versions/installer`);
  return list.find((item) => item.stable) ?? list[0];
}

async function quiltGameVersions(): Promise<QuiltGameVersion[]> {
  return getJson<QuiltGameVersion[]>(`${QUILT_META}/versions/game`);
}

async function quiltInstaller(): Promise<QuiltInstaller> {
  return getJson<QuiltInstaller[]>(`${QUILT_META}/versions/installer`).then(
    (list) => list[0]
  );
}

type ForgeCatalog = Map<string, string[]>;

async function forgeCatalog(): Promise<ForgeCatalog> {
  const xml = await getText(`${FORGE_MAVEN}/maven-metadata.xml`);
  const catalog: ForgeCatalog = new Map();
  for (const match of xml.matchAll(/<version>([^<]+)<\/version>/g)) {
    const full = match[1];
    const split = full.indexOf("-");
    if (split <= 0) continue;
    const minecraft = full.slice(0, split);
    const forge = full.slice(split + 1);
    if (!minecraft || !forge) continue;
    const releases = catalog.get(minecraft) ?? [];
    releases.push(forge);
    catalog.set(minecraft, releases);
  }
  return catalog;
}

type NeoForgeCatalog = Map<string, string[]>;

function neoforgeMinecraftVersion(version: string): string | null {
  const match = version.match(/^(\d+)\.(\d+)\./);
  if (!match) return null;
  const major = match[1];
  const minor = match[2];
  if (major === "20") return `1.20.${minor}`;
  if (major === "21") return minor === "0" ? "1.21" : `1.21.${minor}`;
  return `${major}.${minor}`;
}

async function neoforgeCatalog(): Promise<NeoForgeCatalog> {
  const data = await getJson<{ versions: string[] }>(NEOFORGE_VERSIONS);
  const catalog: NeoForgeCatalog = new Map();
  for (const version of data.versions) {
    const minecraft = neoforgeMinecraftVersion(version);
    if (!minecraft) continue;
    const releases = catalog.get(minecraft) ?? [];
    releases.push(version);
    catalog.set(minecraft, releases);
  }
  return catalog;
}

export async function fetchVersions(
  software: ServerSoftwareId,
  includePre: boolean
): Promise<VersionInfo[]> {
  if (PAPER_FAMILY.includes(software)) {
    const project = await fillProject(software);
    return Object.values(project.versions)
      .flat()
      .filter((version) => includePre || !isPreRelease(version))
      .map((version) => ({ id: version, stable: !isPreRelease(version) }));
  }

  if (software === "purpur") {
    const project = await purpurProject();
    return [...project.versions].reverse().map((version) => ({ id: version, stable: true }));
  }

  if (software === "vanilla") {
    const manifest = await vanillaManifest();
    return manifest.versions
      .filter((version) => includePre || version.type === "release")
      .map((version) => ({
        id: version.id,
        stable: version.type === "release",
        note: version.type,
      }));
  }

  if (software === "fabric") {
    const versions = await fabricGameVersions();
    return versions
      .filter((version) => includePre || version.stable)
      .map((version) => ({ id: version.version, stable: version.stable }));
  }

  if (software === "quilt") {
    const versions = await quiltGameVersions();
    return versions
      .filter((version) => includePre || version.stable)
      .map((version) => ({ id: version.version, stable: version.stable }));
  }

  if (software === "forge") {
    const catalog = await forgeCatalog();
    return [...catalog.keys()]
      .sort((a, b) => versionCompare(b, a))
      .map((version) => ({ id: version, stable: true }));
  }

  if (software === "neoforge") {
    const catalog = await neoforgeCatalog();
    return [...catalog.keys()]
      .sort((a, b) => versionCompare(b, a))
      .map((version) => ({ id: version, stable: true }));
  }

  if (software === "spigot") {
    const jars = await getJson<SpigotJar[]>(SPIGOT_API);
    return jars.map((jar) => ({ id: jar.version, stable: true }));
  }

  return [];
}

export async function fetchBuilds(
  software: ServerSoftwareId,
  version: string
): Promise<BuildInfo[]> {
  if (PAPER_FAMILY.includes(software)) {
    const builds = await fillBuilds(software, version);
    return builds.map((build) => ({
      id: String(build.id),
      label: `#${build.id} · ${build.channel}`,
      note: build.channel,
    }));
  }

  if (software === "purpur") {
    const data = await purpurBuilds(version);
    return [...data.builds.all].reverse().map((build) => ({
      id: build,
      label: `#${build}${build === data.builds.latest ? " · Latest" : ""}`,
    }));
  }

  return [];
}

export async function fetchLoaders(
  software: ServerSoftwareId,
  version: string,
  includePre: boolean
): Promise<LoaderInfo[]> {
  if (software === "fabric") {
    const loaders = await fabricLoaders(version);
    const options = loaders.map((entry) => ({
      id: entry.loader.version,
      label: `${entry.loader.version}${entry.loader.stable ? " · Stable" : ""}`,
      stable: entry.loader.stable,
    }));
    const stable = options.filter((option) => option.stable);
    if (stable.length === 0) return options;
    return includePre ? [...stable, ...options.filter((option) => !option.stable)] : stable;
  }

  if (software === "forge") {
    const catalog = await forgeCatalog();
    return [...(catalog.get(version) ?? [])]
      .sort((a, b) => versionCompare(b, a))
      .map((forge) => ({ id: forge, label: forge, stable: true }));
  }

  if (software === "neoforge") {
    const catalog = await neoforgeCatalog();
    const options = [...(catalog.get(version) ?? [])]
      .sort((a, b) => versionCompare(b, a))
      .map((neoforge) => ({
        id: neoforge,
        label: isPreRelease(neoforge) ? `${neoforge} · Beta` : neoforge,
        stable: !isPreRelease(neoforge),
      }));
    const stable = options.filter((option) => option.stable);
    if (stable.length === 0) return options;
    return includePre ? [...stable, ...options.filter((option) => !option.stable)] : stable;
  }

  return [];
}

function fileNameFromUrl(url: string): string {
  try {
    return decodeURIComponent(new URL(url).pathname.split("/").filter(Boolean).pop() ?? "server.jar");
  } catch {
    return "server.jar";
  }
}

export async function fetchArtifact(
  software: ServerSoftwareId,
  version: string,
  build?: string,
  loader?: string
): Promise<ServerJarInfo> {
  if (PAPER_FAMILY.includes(software)) {
    const builds = await fillBuilds(software, version);
    const selected = builds.find((entry) => String(entry.id) === build) ?? builds[0];
    if (!selected) throw new Error("No builds are available for this version.");
    const download =
      selected.downloads["server:default"] ?? Object.values(selected.downloads)[0];
    if (!download) throw new Error("No download is available for this build.");
    return {
      software,
      version,
      build: String(selected.id),
      kind: "server",
      fileName: download.name,
      url: download.url,
      size: download.size,
      sha256: download.checksums?.sha256,
      channel: selected.channel,
      releasedAt: selected.time,
      java: PROXIES.includes(software) ? undefined : javaForVersion(version),
    };
  }

  if (software === "purpur") {
    const builds = await purpurBuilds(version);
    const selected = build && builds.builds.all.includes(build) ? build : builds.builds.latest;
    const detail = await getJson<PurpurBuild>(
      `${PURPUR_API}/${encodeURIComponent(version)}/${encodeURIComponent(selected)}`
    );
    const url = `${PURPUR_API}/versions/${encodeURIComponent(version)}/builds/${encodeURIComponent(selected)}/download`;
    const info = await headInfo(url);
    return {
      software,
      version,
      build: selected,
      kind: "server",
      fileName: `purpur-${version}-${selected}.jar`,
      url,
      size: info.size,
      md5: detail.md5,
      channel: detail.result,
      releasedAt: detail.timestamp ? new Date(detail.timestamp).toISOString() : info.releasedAt,
      java: javaForVersion(version),
    };
  }

  if (software === "vanilla") {
    const manifest = await vanillaManifest();
    const entry = manifest.versions.find((item) => item.id === version);
    if (!entry) throw new Error("Version not found.");
    const detail = await getJson<VanillaVersion>(entry.url);
    const server = detail.downloads.server;
    if (!server) throw new Error("No server download is available for this version.");
    return {
      software,
      version,
      kind: "server",
      fileName: `server-${version}.jar`,
      url: server.url,
      size: server.size,
      sha1: server.sha1,
      channel: entry.type === "release" ? "RELEASE" : "SNAPSHOT",
      releasedAt: entry.releaseTime,
      java: detail.javaVersion?.majorVersion,
    };
  }

  if (software === "fabric") {
    const installers = await getJson<FabricInstaller[]>(`${FABRIC_META}/versions/installer`);
    const installer = installers.find((item) => item.stable) ?? installers[0];
    if (!loader) throw new Error("Select a loader version.");
    if (!installer) throw new Error("No installer version is available.");
    const url = `${FABRIC_META}/versions/loader/${encodeURIComponent(version)}/${encodeURIComponent(loader)}/${encodeURIComponent(installer.version)}/server/jar`;
    const info = await headInfo(url);
    return {
      software,
      version,
      loader,
      kind: "server",
      fileName: `fabric-server-mc.${version}-loader.${loader}-launcher.${installer.version}.jar`,
      url,
      size: info.size,
      releasedAt: info.releasedAt,
      java: javaForVersion(version),
    };
  }

  if (software === "quilt") {
    const installer = await quiltInstaller();
    if (!installer) throw new Error("No installer version is available.");
    const info = await headInfo(installer.url);
    const fileName = fileNameFromUrl(installer.url);
    return {
      software,
      version,
      kind: "installer",
      fileName,
      url: installer.url,
      size: installer.file_size ?? info.size,
      sha256: installer.hashes?.sha256,
      releasedAt: info.releasedAt,
      java: javaForVersion(version),
      installCommand: `java -jar ${fileName} install server ${version} --download-server`,
    };
  }

  if (software === "forge") {
    if (!loader) throw new Error("Select a Forge version.");
    const full = `${version}-${loader}`;
    const url = `${FORGE_MAVEN}/${full}/forge-${full}-installer.jar`;
    const info = await headInfo(url);
    const fileName = `forge-${full}-installer.jar`;
    return {
      software,
      version,
      loader,
      kind: "installer",
      fileName,
      url,
      size: info.size,
      releasedAt: info.releasedAt,
      java: javaForVersion(version),
      installCommand: `java -jar ${fileName} --installServer`,
    };
  }

  if (software === "neoforge") {
    if (!loader) throw new Error("Select a NeoForge version.");
    const url = `${NEOFORGE_MAVEN}/${loader}/neoforge-${loader}-installer.jar`;
    const info = await headInfo(url);
    const fileName = `neoforge-${loader}-installer.jar`;
    return {
      software,
      version,
      loader,
      kind: "installer",
      fileName,
      url,
      size: info.size,
      releasedAt: info.releasedAt,
      java: javaForVersion(version),
      installCommand: `java -jar ${fileName} --installServer`,
    };
  }

  if (software === "spigot") {
    const jars = await getJson<SpigotJar[]>(SPIGOT_API);
    const jar = jars.find((entry) => entry.version === version);
    if (!jar) throw new Error("Version not found.");
    return {
      software,
      version,
      kind: "server",
      fileName: jar.fileName,
      url: `${SPIGOT_DOWNLOAD}${jar.downloadUrl}`,
      size: jar.size,
      sha256: jar.sha256,
      channel: "STABLE",
      releasedAt: jar.builtAt,
      java: javaForVersion(version),
    };
  }

  throw new Error("Unsupported server software.");
}
