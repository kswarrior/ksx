import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import { api, type AppStats } from "../lib/api";
import "./AppDashboard.css";

type AppDownloadsProps = {
  slug: string;
  name: string;
  version: string;
  platform: string;
  icon: string;
  homePath: string;
  kind?: "app" | "resource pack";
};

function versionLabel(value: string | undefined): string {
  if (!value) return "";
  return /^v/i.test(value) ? value : `v${value}`;
}

function formatCount(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : value.toLocaleString();
}

function formatDate(value: string | null): string {
  if (!value) return "";
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value)
    ? value
    : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AppDownloads({
  slug,
  name,
  version,
  platform,
  icon,
  homePath,
  kind = "app",
}: AppDownloadsProps) {
  const [stats, setStats] = useState<AppStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    api
      .getAppStats(slug)
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, reload]);

  useEffect(() => {
    const previous = document.title;
    document.title = `${name} downloads — KS Warrior`;
    return () => {
      document.title = previous;
    };
  }, [name]);

  const versions = stats?.versions ?? [];
  const current = versions.find((item) => item.current);
  const currentVersion = current?.version ?? stats?.version ?? version;
  const available = stats?.available ?? false;
  const currentDownloads = stats?.currentDownloads ?? current?.downloads;
  const totalDownloads = stats?.downloads;

  return (
    <div className="portal-page">
      <div className="portal-shell">
        <Link className="portal-back" to={homePath}>
          <Icon name="chevron-left" size={16} /> Back to {name}
        </Link>

        <section className="portal-release" aria-labelledby="app-downloads-title">
          <div className="portal-release-head">
            <span className="portal-release-icon">
              <img src={icon} alt="" width={64} height={64} />
            </span>
            <div className="portal-release-info">
              <div className="portal-release-top">
                <span className="portal-kicker">
                  <i aria-hidden="true" />
                  {kind === "resource pack" ? "Resource pack downloads" : "App downloads"}
                </span>
              </div>
              <h1 id="app-downloads-title">
                {name} <span>downloads</span>
              </h1>
              <p>
                Downloads by version. Every {kind} release starts its own count, so a
                new version does not inherit downloads from earlier versions.
              </p>
            </div>
          </div>
        </section>

        <section className="portal-panel" aria-labelledby="app-downloads-versions-title">
          <div className="portal-panel-head">
            <h2 id="app-downloads-versions-title">
              <span className="portal-panel-icon" style={{ color: "#86efac" }}>
                <Icon name="download" size={16} />
              </span>
              Downloads by version
            </h2>
            <span className="portal-panel-count">
              {loading ? platform : `${versions.length} ${versions.length === 1 ? "version" : "versions"}`}
            </span>
          </div>

          {loading && <div className="portal-download-state">Loading download history…</div>}

          {!loading && failed && (
            <div className="portal-download-state">
              <Icon name="warning" size={18} />
              <span>Couldn't load download history.</span>
              <button
                type="button"
                className="portal-download-retry"
                onClick={() => setReload((value) => value + 1)}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !failed && stats && !available && (
            <div className="portal-download-state">
              <Icon name="warning" size={18} />
              <span>
                Download history is available on the live site.
                {stats.reason ? ` ${stats.reason}` : ""}
              </span>
            </div>
          )}

          {!loading && !failed && available && (
            <>
              <div className="portal-download-summary">
                <div className="portal-download-stat current">
                  <span className="label">Current version</span>
                  <span className="value">{versionLabel(currentVersion)}</span>
                  <span className="hint">{formatCount(currentDownloads)} downloads</span>
                </div>
                <div className="portal-download-stat">
                  <span className="label">All versions</span>
                  <span className="value">{formatCount(totalDownloads)}</span>
                  <span className="hint">Previous versions kept separate</span>
                </div>
              </div>

              {versions.length === 0 ? (
                <div className="portal-download-state">No downloads recorded yet.</div>
              ) : (
                <ul className="portal-version-list">
                  {versions.map((item) => (
                    <li
                      className={`portal-version-row${item.current ? " current" : ""}`}
                      key={item.version}
                    >
                      <span className="portal-item-icon small">
                        <Icon name={item.current ? "rocket" : "package"} size={14} />
                      </span>
                      <span className="portal-item-text">
                        <span className="name">
                          {versionLabel(item.version)}
                          {item.current && <span className="portal-version-badge">Current</span>}
                        </span>
                        <span className="sub">
                          {item.lastDownloadAt
                            ? `Last download ${formatDate(item.lastDownloadAt)}`
                            : "No downloads yet"}
                        </span>
                      </span>
                      <span className="portal-version-count">
                        <strong>{formatCount(item.downloads)}</strong>
                        <span>{item.downloads === 1 ? "download" : "downloads"}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
