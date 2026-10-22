import Icon from "../components/Icon";
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
    title: "Built for speed",
    text: "A lightweight engine that opens instantly and keeps every page smooth, even on low-end devices.",
  },
  {
    icon: "search",
    title: "One smart bar",
    text: "Search the web and jump straight into Minecraft tools, hosting lists and KS apps from one place.",
  },
  {
    icon: "smartphone",
    title: "Every device",
    text: "Android first, with Windows and Linux to follow — one experience, wherever you browse.",
  },
] as const;

const DETAILS = [
  { icon: "package", label: "Version", value: `v${APP_VERSION}` },
  { icon: "smartphone", label: "Platform", value: "Android" },
  { icon: "satellite", label: "Channel", value: "Latest" },
  { icon: "download", label: "Format", value: "APK" },
  { icon: "rocket", label: "Status", value: "In development" },
] as const;

const ROADMAP = [
  {
    step: "01",
    title: "Android",
    text: "The first KS Portal build, shipping in KS Apps.",
    state: "active",
    label: "Shipping soon",
  },
  {
    step: "02",
    title: "Windows",
    text: "The same fast portal, built for desktop.",
    state: "",
    label: "Planned",
  },
  {
    step: "03",
    title: "Linux",
    text: "One experience across every device.",
    state: "",
    label: "Planned",
  },
] as const;

export default function KsPortal() {
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

        <div className="portal-grid">
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
            <div className="portal-list">
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

          <section className="portal-panel" aria-labelledby="portal-info-title">
            <div className="portal-panel-head">
              <h2 id="portal-info-title">
                <span className="portal-panel-icon" style={{ color: "#ff6b6b" }}>
                  <Icon name="package" size={16} />
                </span>
                App info
              </h2>
            </div>
            <div className="portal-list">
              {DETAILS.map((detail) => (
                <div key={detail.label} className="portal-list-item compact">
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
        </div>

        <section className="portal-panel" aria-labelledby="portal-roadmap-title">
          <div className="portal-panel-head">
            <h2 id="portal-roadmap-title">
              <span className="portal-panel-icon" style={{ color: "#9ecbff" }}>
                <Icon name="rocket" size={16} />
              </span>
              Roadmap
            </h2>
            <span className="portal-panel-count">In development</span>
          </div>
          <div className="portal-roadmap">
            {ROADMAP.map((item) => (
              <article
                key={item.title}
                className={`portal-step${item.state ? ` ${item.state}` : ""}`}
              >
                <div className="portal-step-top">
                  <span className="portal-step-num">{item.step}</span>
                  <span className="portal-step-state">{item.label}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
