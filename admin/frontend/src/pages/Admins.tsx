import { useEffect, useMemo, useState } from "react";
import Icon from "../components/Icon";
import PageHero from "../components/PageHero";
import { api, type Admin } from "../lib/api";
import "./Admins.css";

type State =
  | { status: "loading" }
  | { status: "ready"; admins: Admin[]; source: string }
  | { status: "error"; message: string };

const FILTERS = ["all", "active", "disabled"] as const;

type Filter = (typeof FILTERS)[number];

function formatDate(value: string) {
  if (!value) return "Never";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(admin: Admin) {
  const source = admin.displayName || admin.username;
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function Admins() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;

    api
      .admins()
      .then((data) => {
        if (active) {
          setState({ status: "ready", admins: data.admins, source: data.source });
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

  const admins = state.status === "ready" ? state.admins : [];

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();

    return admins.filter((admin) => {
      if (filter !== "all" && admin.status !== filter) return false;
      if (!term) return true;

      return [admin.username, admin.displayName, admin.email, admin.role]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [admins, filter, query]);

  const activeCount = admins.filter((admin) => admin.status === "active").length;

  return (
    <div className="admins-page">
      <PageHero
        icon="users"
        kicker="Access"
        title="Admins"
        subtitle="Everyone who can sign in to the KSX control plane."
      />

      <section className="panel-3d admins-panel">
        <div className="panel-head">
          <h2>
            <span className="panel-icon">
              <Icon name="users" size={16} />
            </span>
            Admin accounts
          </h2>
          <span className="panel-count">
            {activeCount} active / {admins.length} total
          </span>
        </div>

        <div className="admins-toolbar">
          <div className="admins-filters" role="group" aria-label="Filter admins by status">
            {FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                className={`admins-filter${filter === option ? " active" : ""}`}
                aria-pressed={filter === option}
                onClick={() => setFilter(option)}
              >
                {option}
              </button>
            ))}
          </div>

          <label className="admins-search">
            <Icon name="search" size={13} />
            <input
              type="search"
              placeholder="Search admins..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        {state.status === "loading" && <p className="muted">Loading admins...</p>}
        {state.status === "error" && <p className="admins-error">{state.message}</p>}

        {state.status === "ready" && visible.length === 0 && (
          <p className="muted">No admins match this filter.</p>
        )}

        {state.status === "ready" && visible.length > 0 && (
          <div className="admins-list">
            {visible.map((admin) => (
              <article className="admin-card" key={admin.username}>
                <span className="admin-avatar" aria-hidden="true">
                  {initials(admin)}
                </span>

                <span className="admin-identity">
                  <span className="admin-name">{admin.displayName}</span>
                  <span className="admin-username">@{admin.username}</span>
                </span>

                <span className="admin-meta">
                  <span className="admin-email">{admin.email || "No email"}</span>
                  <span className="admin-role">Role: {admin.role || "unspecified"}</span>
                </span>

                <span className="admin-logins">
                  <span className="admin-login-label">Last login</span>
                  <span className="admin-login-value">{formatDate(admin.lastLogin)}</span>
                </span>

                <span
                  className={`pill ${admin.status === "active" ? "ready" : "pending"}`}
                >
                  {admin.status}
                </span>
              </article>
            ))}
          </div>
        )}

        {state.status === "ready" && (
          <p className="admins-source">
            Source: <code>{state.source}</code>
          </p>
        )}
      </section>
    </div>
  );
}
