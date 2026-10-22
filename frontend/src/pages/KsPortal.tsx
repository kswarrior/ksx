import { useEffect, useState } from "react";
import Icon from "../components/Icon";
import Markdown from "../components/Markdown";
import { api } from "../lib/api";
import portalMarkdown from "./ks-portal.md?raw";
import "./KsPortal.css";

const APP_SLUG = "ks-portal";
const APP_VERSION = "1.4.0";
const DOWNLOAD_URL =
  "https://github.com/kswarrior/opencode/raw/refs/heads/main/ks-apps/browser/android/release/ks-portal_1.4.0.apk";

function trackDownload() {
  const payload = JSON.stringify({ version: APP_VERSION, platform: "android" });
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
    title: "Fast and minimal",
    text: "A lightweight WebView browser that opens quickly and keeps the interface out of your way.",
  },
  {
    icon: "check",
    title: "Private by design",
    text: "Incognito tabs, Do Not Track, Safe Browsing and HTTPS-first connections are built in.",
  },
  {
    icon: "bot",
    title: "AI Mode built in",
    text: "Open Google AI Mode, ChatGPT, Gemini, Claude, Perplexity, Copilot, Grok or DeepSeek in one tap.",
  },
  {
    icon: "download",
    title: "Downloads and tabs",
    text: "Pause, resume, rename and organize downloads, with tab groups, pinned tabs and private tabs.",
  },
] as const;

const DETAILS = [
  { icon: "package", label: "Version", value: `v${APP_VERSION}` },
  { icon: "smartphone", label: "Platform", value: "Android" },
  { icon: "satellite", label: "Channel", value: "Latest" },
  { icon: "download", label: "Format", value: "APK" },
  { icon: "rocket", label: "Status", value: "In development" },
] as const;

const GALLERY = [
  {
    src: "/image/ks-portal/home.png",
    alt: "KS Portal home screen with top sites, bookmarks and recent sites",
  },
  {
    src: "/image/ks-portal/bookmarks.png",
    alt: "Adding a bookmark in KS Portal",
  },
  {
    src: "/image/ks-portal/ai-mode.png",
    alt: "KS Portal AI Mode with an ocean background",
  },
  {
    src: "/image/ks-portal/private.png",
    alt: "KS Portal Incognito mode with a nebula background",
  },
] as const;

export default function KsPortal() {
  const [downloads, setDownloads] = useState<number | null>(null);
  const [downloadsLoaded, setDownloadsLoaded] = useState(false);
  const [downloadsAvailable, setDownloadsAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getAppStats(APP_SLUG)
      .then((stats) => {
        if (cancelled) return;
        setDownloads(stats.downloads);
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
        <section className="portal-release" aria-labelledby="portal-release-title">
          <div className="portal-release-head">
            <span className="portal-release-icon">
              <img src="/portal.png" alt="" width={64} height={64} />
            </span>
            <div className="portal-release-info">
              <div className="portal-release-top">
                <span className="portal-kicker">
                  <i aria-hidden="true" />
                  Latest release
                </span>
              </div>
              <h1 id="portal-release-title">
                KS Portal <span>v{APP_VERSION}</span>
              </h1>
              <p>
                A fast, private browser built for the KS ecosystem — your gateway
                to everything KSX, in one tab.
              </p>
            </div>
          </div>

          <div className="portal-actions">
            <a
              className="portal-btn primary"
              href={DOWNLOAD_URL}
              download
              onClick={trackDownload}
            >
              <Icon name="download" size={15} />
              Download APK
              <span className="portal-btn-version">v{APP_VERSION}</span>
            </a>
          </div>
        </section>

        <section className="portal-panel portal-gallery" aria-labelledby="portal-gallery-title">
          <div className="portal-panel-head">
            <h2 id="portal-gallery-title">
              <span className="portal-panel-icon" style={{ color: "#7dd3fc" }}>
                <Icon name="smartphone" size={16} />
              </span>
              Gallery
            </h2>
            <span className="portal-panel-count">{GALLERY.length} screens</span>
          </div>
          <div className="portal-gallery-track">
            {GALLERY.map((shot) => (
              <a
                key={shot.src}
                className="portal-shot"
                href={shot.src}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src={shot.src}
                  alt={shot.alt}
                  width={412}
                  height={915}
                  loading="lazy"
                  decoding="async"
                />
              </a>
            ))}
          </div>
        </section>

        <section className="portal-panel" aria-labelledby="portal-info-title">
          <div className="portal-panel-head">
            <h2 id="portal-info-title">
              <span className="portal-panel-icon" style={{ color: "#ff6b6b" }}>
                <Icon name="package" size={16} />
              </span>
              App info
            </h2>
            <span className="portal-panel-count">Android</span>
          </div>
          <div className="portal-info-grid">
            <div
              className="portal-info-tile downloads"
              title={
                downloadsAvailable
                  ? "Total downloads recorded in D1"
                  : "Download count is available on the live site"
              }
            >
              <span className="portal-item-icon small">
                <Icon name="download" size={14} />
              </span>
              <span className="portal-item-text">
                <span className="name">Downloads</span>
                <span className="sub">Total from D1</span>
              </span>
              <span className="portal-item-value">{downloadLabel}</span>
            </div>
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

        <section className="portal-panel" aria-labelledby="portal-highlights-title">
          <div className="portal-panel-head">
            <h2 id="portal-highlights-title">
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

        <section className="portal-panel portal-about" aria-labelledby="portal-about-title">
          <div className="portal-panel-head">
            <h2 id="portal-about-title">
              <span className="portal-panel-icon" style={{ color: "#86efac" }}>
                <Icon name="heart" size={16} />
              </span>
              About KS Portal
            </h2>
            <span className="portal-panel-count">v{APP_VERSION}</span>
          </div>
          <div className="portal-about-md">
            <Markdown source={portalMarkdown} />
          </div>
        </section>
      </div>
    </div>
  );
}
