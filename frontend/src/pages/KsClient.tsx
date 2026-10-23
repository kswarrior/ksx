import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import Markdown from "../components/Markdown";
import { api } from "../lib/api";
import clientMarkdown from "./ks-client.md?raw";
import "./AppDashboard.css";

const APP_SLUG = "ks-client";
const APP_VERSION = "V3";
const DOWNLOAD_URL =
  "https://www.mediafire.com/file/o78xzmld09b5nw9/KS_Client_V3.mcpack/file";

function trackDownload() {
  const payload = JSON.stringify({ version: APP_VERSION, platform: "bedrock" });
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon(`/api/apps/${APP_SLUG}/download`, blob)) return;
    }
  } catch {
    /* fall through to fetch */
  }
  void fetch(`/api/apps/${APP_SLUG}/download`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

const FEATURES = [
  {
    icon: "zap",
    title: "Smoother gameplay",
    text: "Tuned to reduce lag and improve Minecraft Bedrock performance on lower-end devices.",
  },
  {
    icon: "gem",
    title: "3D details",
    text: "A 3D Mace, shield front and side views, bow, crossbow and player-skin totem.",
  },
  {
    icon: "smartphone",
    title: "Modern HUD",
    text: "Armor and offhand indicators, player health and item durability at a glance.",
  },
  {
    icon: "sparkles",
    title: "Cleaner visuals",
    text: "Brighter textures, clearer water and a low fire effect that keeps your view open.",
  },
] as const;

const DETAILS = [
  { icon: "package", label: "Version", value: APP_VERSION },
  { icon: "gamepad", label: "Platform", value: "Bedrock" },
  { icon: "puzzle", label: "Type", value: "Resource pack" },
  { icon: "download", label: "Format", value: ".mcpack" },
  { icon: "rocket", label: "Status", value: "Available" },
] as const;

export default function KsClient() {
  const [downloads, setDownloads] = useState<number | null>(null);
  const [downloadsLoaded, setDownloadsLoaded] = useState(false);
  const [downloadsAvailable, setDownloadsAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getAppStats(APP_SLUG)
      .then((stats) => {
        if (cancelled) return;
        setDownloads(stats.currentDownloads ?? stats.downloads);
        setDownloadsAvailable(stats.available);
        setDownloadsLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setDownloadsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const downloadLabel = !downloadsLoaded
    ? "…"
    : downloads === null
      ? "—"
      : downloads.toLocaleString();

  return (
    <div className="portal-page">
      <div className="portal-shell">
        <section className="portal-release" aria-labelledby="client-release-title">
          <div className="portal-release-head">
            <span className="portal-release-icon">
              <img
                src="/minecraft/bedrock/pack_icon.webp"
                alt=""
                width={64}
                height={64}
              />
            </span>
            <div className="portal-release-info">
              <div className="portal-release-top">
                <span className="portal-kicker">
                  <i aria-hidden="true" />
                  Latest release
                </span>
              </div>
              <h1 id="client-release-title">
                KS Client <span>{APP_VERSION}</span>
              </h1>
              <p>
                A performance and visual upgrade for Minecraft Bedrock — smoother
                gameplay, a modern HUD and 3D models in one pack.
              </p>
            </div>
          </div>

          <div className="portal-actions">
            <a
              className="portal-btn primary"
              href={DOWNLOAD_URL}
              target="_blank"
              rel="noreferrer"
              onClick={trackDownload}
            >
              <Icon name="download" size={15} />
              Download .mcpack
              <span className="portal-btn-version">{APP_VERSION}</span>
            </a>
          </div>
        </section>

        <section className="portal-panel" aria-labelledby="client-info-title">
          <div className="portal-panel-head">
            <h2 id="client-info-title">
              <span className="portal-panel-icon" style={{ color: "#ff6b6b" }}>
                <Icon name="package" size={16} />
              </span>
              Resource pack info
            </h2>
            <span className="portal-panel-count">Bedrock</span>
          </div>
          <div className="portal-info-grid">
            <Link
              className="portal-info-tile downloads"
              to="/minecraft/bedrock/ks-client/downloads"
              aria-label="View downloads by version"
              title={
                downloadsAvailable
                  ? `Downloads for ${APP_VERSION} (current version)`
                  : "Download count is available on the live site"
              }
            >
              <span className="portal-item-icon small">
                <Icon name="download" size={14} />
              </span>
              <span className="portal-item-text">
                <span className="name">Downloads</span>
                <span className="sub">This version</span>
              </span>
              <span className="portal-item-value">{downloadLabel}</span>
            </Link>
            {DETAILS.map((detail) => (
              <div key={detail.label} className="portal-info-tile">
                <span className="portal-item-icon small">
                  <Icon name={detail.icon} size={14} />
                </span>
                <span className="portal-item-text">
                  <span className="name">{detail.label}</span>
                </span>
                <span className="portal-item-value">{detail.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="portal-panel" aria-labelledby="client-highlights-title">
          <div className="portal-panel-head">
            <h2 id="client-highlights-title">
              <span className="portal-panel-icon" style={{ color: "#f2c94c" }}>
                <Icon name="sparkles" size={16} />
              </span>
              Highlights
            </h2>
            <span className="portal-panel-count">{FEATURES.length}</span>
          </div>
          <div className="portal-highlights-grid">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="portal-list-item">
                <span className="portal-item-icon">
                  <Icon name={feature.icon} size={16} />
                </span>
                <span className="portal-item-text">
                  <span className="name">{feature.title}</span>
                  <span className="sub">{feature.text}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="portal-panel portal-about" aria-labelledby="client-about-title">
          <div className="portal-panel-head">
            <h2 id="client-about-title">
              <span className="portal-panel-icon" style={{ color: "#86efac" }}>
                <Icon name="heart" size={16} />
              </span>
              About KS Client
            </h2>
            <span className="portal-panel-count">{APP_VERSION}</span>
          </div>
          <div className="portal-about-md">
            <Markdown source={clientMarkdown} />
          </div>
        </section>
      </div>
    </div>
  );
}
