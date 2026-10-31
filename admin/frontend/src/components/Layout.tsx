import { useEffect, useState, type CSSProperties } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import Icon, { type IconName } from "./Icon";
import "./Layout.css";

type NavItem = {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Overview", icon: "gamepad", end: true },
  { to: "/github", label: "GitHub", icon: "terminal" },
  { to: "/cloudflare", label: "Cloudflare", icon: "cloud" },
  { to: "/jobs", label: "Jobs", icon: "zap" },
  { to: "/settings", label: "Settings", icon: "sliders" },
];

function isDesktopViewport() {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 900px)").matches;
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(isDesktopViewport);
  const [online, setOnline] = useState<boolean | null>(null);
  const location = useLocation();
  const { state, logout } = useAuth();
  const username = state.status === "authenticated" ? state.username : "";

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    fetch("/api/health", { signal: controller.signal })
      .then((response) => {
        if (active) setOnline(response.ok);
      })
      .catch(() => {
        if (active) setOnline(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!isDesktopViewport()) setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 900px)");
    const onChange = (event: MediaQueryListEvent) => {
      if (!event.matches) setSidebarOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

  const statusLabel =
    online === null ? "Checking API" : online ? "API online" : "API offline";

  return (
    <>
      <header id="topbar">
        <button
          id="hamburger"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={sidebarOpen}
          aria-controls="sidebar"
          onClick={() => setSidebarOpen((open) => !open)}
        >
          <svg className="menu-svg" viewBox="0 0 24 24" aria-hidden="true">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>

        <Link to="/" className="topbar-brand">
          <span className="topbar-brand-mark">KSX</span>
          <span className="topbar-brand-text">Admin</span>
        </Link>

        <div className="topbar-right">
          <span
            className={`topbar-status ${
              online === false ? "offline" : online === null ? "checking" : ""
            }`}
          >
            <i aria-hidden="true" />
            <span className="topbar-status-label">{statusLabel}</span>
          </span>
          <span className="topbar-version">v0.1.0</span>
        </div>
      </header>

      <nav id="sidebar" className={sidebarOpen ? "open" : ""} aria-label="Admin navigation">
        <div className="sb-head">
          <span className="sb-logo-wrap" aria-hidden="true">
            <span className="sb-logo">KSX</span>
          </span>
          <span className="sb-brand">
            <span className="sb-brand-name">Admin</span>
            <span className="sb-brand-sub">Control plane</span>
          </span>
          <span className={`sb-live ${online === false ? "offline" : ""}`}>
            <i aria-hidden="true" />
            {online === false ? "OFF" : "LIVE"}
          </span>
        </div>

        <div className="sb-divider" />

        <div className="sb-nav">
          {NAV_ITEMS.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}
              style={{ ["--i" as string]: index } as CSSProperties}
              onClick={() => {
                if (!isDesktopViewport()) setSidebarOpen(false);
              }}
            >
              <span className="sb-icon" aria-hidden="true">
                <Icon name={item.icon} size={16} />
              </span>
              <span className="sb-label">{item.label}</span>
              <span className="sb-arrow" aria-hidden="true">
                <Icon name="chevron-right" size={12} />
              </span>
            </NavLink>
          ))}
        </div>

        <div className="sb-foot">
          <Link
            to="/settings"
            className="sb-foot-card"
            onClick={() => {
              if (!isDesktopViewport()) setSidebarOpen(false);
            }}
          >
            <span className="sb-foot-icon" aria-hidden="true">
              <Icon name="sliders" size={15} />
            </span>
            <span className="sb-foot-text">
              <strong>Environment</strong>
              <small>Tokens &amp; config</small>
            </span>
            <span className="sb-foot-arrow" aria-hidden="true">
              <Icon name="arrow-up-right" size={11} />
            </span>
          </Link>
          <button
            type="button"
            className="sb-signout"
            onClick={() => {
              void logout();
            }}
          >
            <Icon name="arrow-right" size={13} />
            Sign out
          </button>
          <div className="sb-copy">
            {username ? `Signed in as ${username}` : "KSX Admin · v0.1.0"}
          </div>
        </div>
      </nav>

      <main id="content" className={sidebarOpen ? "sidebar-open" : ""}>
        <Outlet />
      </main>

      {sidebarOpen && !isDesktopViewport() && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
