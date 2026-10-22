import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import "./KsPortal.css";

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
    text: "KS Portal is planned for Android, Windows and Linux — one experience, wherever you browse.",
  },
] as const;

export default function KsPortal() {
  return (
    <div className="portal-page">
      <div className="portal-bg" aria-hidden="true">
        <span className="portal-glow g1" />
        <span className="portal-glow g2" />
        <span className="portal-grid" />
      </div>

      <div className="portal-shell">
        <nav className="portal-crumb" aria-label="Breadcrumb">
          <Link to="/map">KS Apps</Link>
          <Icon name="chevron-right" size={12} />
          <span>Browser</span>
        </nav>

        <section className="portal-hero">
          <div className="portal-orbit" aria-hidden="true">
            <span className="po-ring r1" />
            <span className="po-ring r2" />
            <span className="po-core">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="4" stroke="#fff" strokeWidth="1.5" />
                <ellipse
                  cx="12"
                  cy="12"
                  rx="9"
                  ry="3.6"
                  transform="rotate(-24 12 12)"
                  stroke="#38bdf8"
                  strokeWidth="1.3"
                />
                <ellipse
                  cx="12"
                  cy="12"
                  rx="9"
                  ry="3.6"
                  transform="rotate(24 12 12)"
                  stroke="#a78bfa"
                  strokeWidth="1.1"
                  opacity="0.8"
                />
                <circle cx="19.2" cy="7.2" r="1.2" fill="#22c55e" />
              </svg>
            </span>
            <span className="po-sat s1" />
            <span className="po-sat s2" />
            <span className="po-sat s3" />
          </div>

          <span className="portal-badge">
            <i aria-hidden="true" />
            Coming soon
          </span>
          <h1>
            KS <span>Portal</span>
          </h1>
          <p className="portal-tagline">
            A fast, private browser built for the KS ecosystem — your gateway to
            everything KSX, in one tab.
          </p>
          <div className="portal-actions">
            <Link className="portal-btn primary" to="/dashboard">
              Explore KSX
              <Icon name="arrow-right" size={15} />
            </Link>
            <Link className="portal-btn" to="/map">
              <Icon name="map-pin" size={14} />
              View Sites Map
            </Link>
          </div>
        </section>

        <section className="portal-preview" aria-label="Preview of the KS Portal browser">
          <div className="pp-bar">
            <span className="pp-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="pp-address">
              <Icon name="globe" size={12} />
              ks://portal
            </span>
            <span className="pp-live">
              <i aria-hidden="true" />
              Soon
            </span>
          </div>
          <div className="pp-body" aria-hidden="true">
            <div className="pp-side">
              <span className="pp-pill w90" />
              <span className="pp-pill w70" />
              <span className="pp-pill w80" />
              <span className="pp-pill w60" />
            </div>
            <div className="pp-main">
              <span className="pp-line w60" />
              <span className="pp-line w40" />
              <div className="pp-tiles">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span key={i} />
                ))}
              </div>
              <div className="pp-coming">
                <Icon name="rocket" size={15} />
                <span>Coming soon</span>
              </div>
            </div>
          </div>
        </section>

        <section className="portal-cards" aria-label="KS Portal highlights">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="portal-card">
              <span className="portal-card-icon">
                <Icon name={feature.icon} size={18} />
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </section>

        <section className="portal-status">
          <span className="portal-status-icon">
            <Icon name="rocket" size={20} />
          </span>
          <div className="portal-status-text">
            <h3>In development</h3>
            <p>
              KS Portal is being built now. Android, Windows and Linux builds
              will land in KS Apps first.
            </p>
          </div>
          <Link to="/map" className="portal-status-link">
            Browse KS Apps
            <Icon name="arrow-right" size={13} />
          </Link>
        </section>
      </div>
    </div>
  );
}
