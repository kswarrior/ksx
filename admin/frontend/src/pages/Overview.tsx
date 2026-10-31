import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import PageHero from "../components/PageHero";
import { api, type Health, type Hello, type Integration } from "../lib/api";
import "./Overview.css";

type OverviewData = {
  hello: Hello;
  health: Health;
  integrations: Integration[];
};

type State =
  | { status: "loading" }
  | { status: "ready"; data: OverviewData }
  | { status: "error"; message: string };

export default function Overview() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let active = true;

    Promise.all([api.hello(), api.health(), api.integrations()])
      .then(([hello, health, integrations]) => {
        if (active) {
          setState({
            status: "ready",
            data: { hello, health, integrations: integrations.integrations },
          });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const apiState =
    state.status === "ready"
      ? state.data.health.status
      : state.status === "error"
        ? "offline"
        : "checking";

  return (
    <div className="overview">
      <PageHero
        icon="gamepad"
        kicker="Dashboard"
        title="Overview"
        subtitle="A lightweight control plane for GitHub, Cloudflare, and background automation."
      />

      <section className="hello-panel">
        <span className="hello-eyebrow">KSX Admin API</span>
        <h2 className="hello-title">
          Hello, <span>world</span>.
        </h2>
        <p className="hello-text">
          The admin shell is live. The Go API is serving this React dashboard, and
          the sidebar is ready for the next integrations.
        </p>

        <div className="hello-meta">
          <span className="meta-pill">
            <span className={`meta-dot ${state.status === "error" ? "offline" : ""}`} />
            {state.status === "ready"
              ? state.data.hello.message
              : state.status === "error"
                ? "API unavailable"
                : "Connecting..."}
          </span>
          {state.status === "ready" && (
            <>
              <span className="meta-pill">
                Go API <strong>{state.data.health.version}</strong>
              </span>
              <span className="meta-pill">
                Uptime <strong>{state.data.health.uptime}</strong>
              </span>
            </>
          )}
        </div>

        {state.status === "error" && <p className="hello-error">{state.message}</p>}
      </section>

      <div className="overview-grid">
        <section className="panel-3d">
          <div className="panel-head">
            <h2>
              <span className="panel-icon">
                <Icon name="server" size={16} />
              </span>
              System
            </h2>
            <span className={`pill ${state.status === "ready" ? "ready" : "pending"}`}>
              {apiState}
            </span>
          </div>

          <div className="stat-grid">
            <div className="stat">
              <span className="stat-label">API</span>
              <strong className="stat-value">
                {state.status === "ready" ? "Online" : state.status === "error" ? "Offline" : "Checking"}
              </strong>
            </div>
            <div className="stat">
              <span className="stat-label">Version</span>
              <strong className="stat-value">
                {state.status === "ready" ? state.data.health.version : "0.1.0"}
              </strong>
            </div>
            <div className="stat">
              <span className="stat-label">Uptime</span>
              <strong className="stat-value">
                {state.status === "ready" ? state.data.health.uptime : "—"}
              </strong>
            </div>
            <div className="stat">
              <span className="stat-label">Runtime</span>
              <strong className="stat-value">Go</strong>
            </div>
          </div>
        </section>

        <section className="panel-3d">
          <div className="panel-head">
            <h2>
              <span className="panel-icon">
                <Icon name="package" size={16} />
              </span>
              Integrations
            </h2>
            <Link to="/settings" className="panel-link">
              Manage <Icon name="arrow-up-right" size={11} />
            </Link>
          </div>

          <div className="integration-list">
            {state.status === "loading" && <p className="muted">Loading integrations...</p>}
            {state.status === "error" && <p className="muted">Could not load integrations.</p>}
            {state.status === "ready" &&
              state.data.integrations.map((integration) => (
                <article className="integration-card" key={integration.name}>
                  <span className="integration-icon" aria-hidden="true">
                    <Icon
                      name={integration.name === "GitHub" ? "terminal" : "cloud"}
                      size={17}
                    />
                  </span>
                  <span className="integration-info">
                    <span className="integration-name">{integration.name}</span>
                    <span className="integration-desc">{integration.description}</span>
                  </span>
                  <span className={`pill ${integration.configured ? "ready" : "pending"}`}>
                    {integration.configured ? "Configured" : "Not set"}
                  </span>
                </article>
              ))}
          </div>
        </section>
      </div>

      <section className="panel-3d">
        <div className="panel-head">
          <h2>
            <span className="panel-icon">
              <Icon name="zap" size={16} />
            </span>
            Ready for more
          </h2>
          <span className="panel-count">3 modules</span>
        </div>

        <div className="next-grid">
          <Link to="/github" className="next-item">
            <span className="next-icon">
              <Icon name="terminal" size={16} />
            </span>
            <span className="next-text">
              <strong>GitHub actions</strong>
              <small>Repositories, Actions, releases</small>
            </span>
            <Icon name="chevron-right" size={14} />
          </Link>
          <Link to="/cloudflare" className="next-item">
            <span className="next-icon">
              <Icon name="cloud" size={16} />
            </span>
            <span className="next-text">
              <strong>Cloudflare</strong>
              <small>DNS, Workers, Pages</small>
            </span>
            <Icon name="chevron-right" size={14} />
          </Link>
          <Link to="/jobs" className="next-item">
            <span className="next-icon">
              <Icon name="zap" size={16} />
            </span>
            <span className="next-text">
              <strong>Background jobs</strong>
              <small>Scheduled Go workers</small>
            </span>
            <Icon name="chevron-right" size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
