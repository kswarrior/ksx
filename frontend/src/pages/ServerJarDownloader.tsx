import { useEffect, useRef, useState } from "react";
import Icon from "../components/Icon";
import { Select, type SelectOption } from "../components/ui";
import {
  SERVER_SOFTWARE,
  fetchArtifact,
  fetchBuilds,
  fetchLoaders,
  fetchVersions,
  type BuildInfo,
  type LoaderInfo,
  type ServerJarInfo,
  type ServerSoftwareId,
  type VersionInfo,
} from "../lib/serverJars";
import "./ServerJarDownloader.css";

type CopyTarget = "url" | "hash" | "command";

function formatBytes(bytes?: number): string {
  if (!bytes || !Number.isFinite(bytes)) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unit]}`;
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function versionLabel(version: VersionInfo): string {
  if (version.note && version.note !== "release") {
    return `${version.id} · ${version.note}`;
  }
  return version.id;
}

export default function ServerJarDownloader() {
  const [softwareId, setSoftwareId] = useState<ServerSoftwareId>("paper");
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [version, setVersion] = useState("");
  const [builds, setBuilds] = useState<BuildInfo[]>([]);
  const [build, setBuild] = useState("");
  const [loaders, setLoaders] = useState<LoaderInfo[]>([]);
  const [loader, setLoader] = useState("");
  const [includePre, setIncludePre] = useState(false);
  const [artifact, setArtifact] = useState<ServerJarInfo | null>(null);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [loadingArtifact, setLoadingArtifact] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<CopyTarget | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const requestId = useRef(0);

  const software = SERVER_SOFTWARE.find((item) => item.id === softwareId) ?? SERVER_SOFTWARE[0];

  useEffect(() => {
    let cancelled = false;
    setLoadingVersions(true);
    setError("");
    fetchVersions(softwareId, includePre)
      .then((list) => {
        if (cancelled) return;
        setVersions(list);
        setVersion((current) => (list.some((item) => item.id === current) ? current : list[0]?.id ?? ""));
      })
      .catch(() => {
        if (cancelled) return;
        setVersions([]);
        setVersion("");
        setError("Could not load versions. Check your connection and try again.");
      })
      .finally(() => {
        if (!cancelled) setLoadingVersions(false);
      });
    return () => {
      cancelled = true;
    };
  }, [softwareId, includePre, reloadKey]);

  useEffect(() => {
    if (!version) {
      setArtifact(null);
      setBuilds([]);
      setLoaders([]);
      return;
    }

    let cancelled = false;
    const currentRequest = ++requestId.current;
    setLoadingArtifact(true);
    setError("");
    setArtifact(null);

    (async () => {
      const [nextBuilds, nextLoaders] = await Promise.all([
        fetchBuilds(softwareId, version),
        fetchLoaders(softwareId, version, includePre),
      ]);
      if (cancelled) return;

      setBuilds(nextBuilds);
      setLoaders(nextLoaders);

      const nextBuild = nextBuilds.some((item) => item.id === build)
        ? build
        : nextBuilds[0]?.id ?? "";
      const nextLoader = nextLoaders.some((item) => item.id === loader)
        ? loader
        : nextLoaders[0]?.id ?? "";

      if (nextBuild !== build || nextLoader !== loader) {
        setBuild(nextBuild);
        setLoader(nextLoader);
        return;
      }

      const info = await fetchArtifact(
        softwareId,
        version,
        nextBuild || undefined,
        nextLoader || undefined
      );
      if (cancelled || currentRequest !== requestId.current) return;
      setArtifact(info);
    })()
      .catch((reason: unknown) => {
        if (cancelled || currentRequest !== requestId.current) return;
        setArtifact(null);
        setError(reason instanceof Error ? reason.message : "Could not load the download.");
      })
      .finally(() => {
        if (!cancelled && currentRequest === requestId.current) setLoadingArtifact(false);
      });

    return () => {
      cancelled = true;
    };
  }, [softwareId, version, includePre, build, loader, reloadKey]);

  const softwareOptions: SelectOption[] = SERVER_SOFTWARE.map((item) => ({
    value: item.id,
    label: item.name,
  }));

  const versionOptions: SelectOption[] = versions.map((item) => ({
    value: item.id,
    label: versionLabel(item),
    keywords: item.note,
  }));

  const buildOptions: SelectOption[] = builds.map((item) => ({
    value: item.id,
    label: item.label,
    keywords: item.note,
  }));

  const loaderOptions: SelectOption[] = loaders.map((item) => ({
    value: item.id,
    label: item.label,
  }));

  const checksum = artifact?.sha256
    ? { label: "SHA-256", value: artifact.sha256 }
    : artifact?.sha1
      ? { label: "SHA-1", value: artifact.sha1 }
      : artifact?.md5
        ? { label: "MD5", value: artifact.md5 }
        : null;

  const stats: { label: string; value: string }[] = [];
  if (artifact) {
    stats.push({ label: "Version", value: artifact.version });
    if (artifact.build) stats.push({ label: "Build", value: `#${artifact.build}` });
    if (artifact.loader) {
      stats.push({
        label: softwareId === "forge" ? "Forge" : softwareId === "neoforge" ? "NeoForge" : "Loader",
        value: artifact.loader,
      });
    }
    if (artifact.channel) stats.push({ label: "Channel", value: artifact.channel });
    if (artifact.releasedAt) stats.push({ label: "Released", value: formatDate(artifact.releasedAt) });
    if (artifact.size) stats.push({ label: "Size", value: formatBytes(artifact.size) });
    if (artifact.java) stats.push({ label: "Java", value: `${artifact.java}+` });
  }

  function changeSoftware(next: string) {
    setSoftwareId(next as ServerSoftwareId);
    setBuild("");
    setLoader("");
    setBuilds([]);
    setLoaders([]);
    setArtifact(null);
    setCopied(null);
    setError("");
  }

  async function copy(value: string, target: CopyTarget) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(target);
      window.setTimeout(() => setCopied((current) => (current === target ? null : current)), 1400);
    } catch {
      setCopied(null);
    }
  }

  function retry() {
    setError("");
    setReloadKey((key) => key + 1);
  }

  return (
    <div className="jar-page">
      <div className="jar-bg" aria-hidden>
        <div className="jar-bg-grad" />
        <div className="jar-bg-orb o1" />
        <div className="jar-bg-orb o2" />
      </div>

      <div className="jar-shell">
        <header className="jar-hero">
          <span className="jar-hero-icon" aria-hidden>
            <Icon name="package" size={22} />
          </span>
          <div className="jar-hero-text">
            <h1>Server Jar Downloader</h1>
          </div>
        </header>

        <section className="jar-panel">
          <div className="jar-fields">
            <div className="jar-field">
              <label>Software</label>
              <Select
                value={softwareId}
                onChange={changeSoftware}
                options={softwareOptions}
                ariaLabel="Server software"
              />
            </div>

            <div className="jar-field">
              <label>Version</label>
              <Select
                value={version}
                onChange={setVersion}
                options={versionOptions}
                placeholder={loadingVersions ? "Loading…" : "Select version"}
                ariaLabel="Minecraft version"
                disabled={loadingVersions || versionOptions.length === 0}
                searchable
                searchPlaceholder="Search versions…"
              />
            </div>

            {builds.length > 0 && (
              <div className="jar-field">
                <label>Build</label>
                <Select
                  value={build}
                  onChange={setBuild}
                  options={buildOptions}
                  ariaLabel="Build"
                  searchable
                  searchPlaceholder="Search builds…"
                />
              </div>
            )}

            {loaders.length > 0 && (
              <div className="jar-field">
                <label>
                  {softwareId === "forge"
                    ? "Forge version"
                    : softwareId === "neoforge"
                      ? "NeoForge version"
                      : "Loader"}
                </label>
                <Select
                  value={loader}
                  onChange={setLoader}
                  options={loaderOptions}
                  ariaLabel="Loader version"
                  searchable
                  searchPlaceholder="Search versions…"
                />
              </div>
            )}
          </div>

          <div className="jar-panel-foot">
            <span className="jar-software-summary">{software.summary}</span>
            {software.supportsPre && (
              <label className="jar-toggle">
                <input
                  type="checkbox"
                  checked={includePre}
                  onChange={(event) => setIncludePre(event.target.checked)}
                />
                <span>Include snapshots &amp; pre-releases</span>
              </label>
            )}
          </div>
        </section>

        {error && !loadingArtifact && (
          <div className="jar-state jar-state-error">
            <Icon name="warning" size={16} />
            <span>{error}</span>
            <button type="button" className="jar-retry" onClick={retry}>
              Retry
            </button>
          </div>
        )}

        {loadingArtifact && (
          <div className="jar-state jar-state-loading">
            <span className="jar-spinner" aria-hidden />
            Loading download…
          </div>
        )}

        {!loadingArtifact && !error && artifact && (
          <section className="jar-result">
            <div className="jar-result-head">
              <span className="jar-file-icon" aria-hidden>
                <Icon name={artifact.kind === "installer" ? "package" : "server"} size={20} />
              </span>
              <div className="jar-file-text">
                <h2>{artifact.fileName}</h2>
                <p>
                  {software.name} {artifact.version}
                  {artifact.loader ? ` · ${artifact.loader}` : ""}
                </p>
              </div>
              <span className={`jar-badge ${artifact.kind}`}>
                {artifact.kind === "installer" ? "Installer" : "Server JAR"}
              </span>
            </div>

            <div className="jar-stats">
              {stats.map((stat) => (
                <div className="jar-stat" key={stat.label}>
                  <span>{stat.label}</span>
                  <b title={stat.value}>{stat.value}</b>
                </div>
              ))}
            </div>

            {checksum && (
              <div className="jar-checksum">
                <div className="jar-checksum-head">
                  <span>{checksum.label}</span>
                  <button type="button" onClick={() => copy(checksum.value, "hash")}>
                    <Icon name={copied === "hash" ? "check" : "copy"} size={13} />
                    {copied === "hash" ? "Copied" : "Copy"}
                  </button>
                </div>
                <code>{checksum.value}</code>
              </div>
            )}

            {artifact.installCommand && (
              <div className="jar-command">
                <div className="jar-command-head">
                  <span>Install command</span>
                  <button type="button" onClick={() => copy(artifact.installCommand!, "command")}>
                    <Icon name={copied === "command" ? "check" : "copy"} size={13} />
                    {copied === "command" ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre>{artifact.installCommand}</pre>
              </div>
            )}

            <div className="jar-actions">
              <a
                className="jar-btn primary"
                href={artifact.url}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="download" size={15} />
                {artifact.kind === "installer" ? "Download Installer" : "Download JAR"}
              </a>
              <button
                type="button"
                className="jar-btn secondary"
                onClick={() => copy(artifact.url, "url")}
              >
                <Icon name={copied === "url" ? "check" : "link"} size={15} />
                {copied === "url" ? "Copied" : "Copy Link"}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
