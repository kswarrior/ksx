import { useEffect, useMemo, useState } from "react";
import { api, DatabaseHosting } from "../lib/api";
import Icon from "../components/Icon";
import FilterMenu from "../components/FilterMenu";
import PageHero from "../components/PageHero";
import { SearchField, Select, type SelectOption } from "../components/ui";
import "./DatabaseHosting.css";

const typeOrder = [
  "PostgreSQL",
  "MySQL-compatible",
  "Distributed SQL",
  "Multi-engine",
  "SQLite",
  "Document",
  "Key-value",
  "Graph",
  "Vector",
  "Time series",
  "Multi-model",
];

const cardOptions: SelectOption[] = [
  { value: "", label: "Card • Any" },
  { value: "false", label: "No card required" },
  { value: "true", label: "Card required" },
];

const backupOptions: SelectOption[] = [
  { value: "", label: "Backups • Any" },
  { value: "true", label: "Backups included" },
  { value: "false", label: "No backups" },
];

const lifetimeOptions: SelectOption[] = [
  { value: "", label: "Lifetime • Any" },
  { value: "true", label: "Free forever" },
  { value: "false", label: "Time-limited" },
];

export default function DatabaseHostingPage() {
  const [list, setList] = useState<DatabaseHosting[]>([]);
  const [q, setQ] = useState("");
  const [providerType, setProviderType] = useState("");
  const [cardRequired, setCardRequired] = useState("");
  const [backups, setBackups] = useState("");
  const [lifetime, setLifetime] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .getDatabaseHosting()
      .then((r) => {
        if (!alive) return;
        setList(r.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const typeOptions = useMemo(
    () => [
      { value: "", label: "Type • All" },
      ...Array.from(new Set(list.map((h) => h.type).filter(Boolean)))
        .sort((a, b) => {
          const ai = typeOrder.indexOf(a);
          const bi = typeOrder.indexOf(b);
          return (
            (ai === -1 ? typeOrder.length : ai) - (bi === -1 ? typeOrder.length : bi) ||
            a.localeCompare(b)
          );
        })
        .map((value) => ({ value, label: value })),
    ],
    [list]
  );

  const filtered = useMemo(
    () =>
      list.filter((h) => {
        if (q && !h.name.toLowerCase().includes(q.toLowerCase())) return false;
        if (providerType && h.type !== providerType) return false;
        if (cardRequired && h.cardRequired !== (cardRequired === "true")) return false;
        if (backups && (h.backups !== "None") !== (backups === "true")) return false;
        if (lifetime && h.alwaysFree !== (lifetime === "true")) return false;
        return true;
      }),
    [list, q, providerType, cardRequired, backups, lifetime]
  );

  const activeCount = [providerType, cardRequired, backups, lifetime].filter(Boolean).length;

  const clearFilters = () => {
    setQ("");
    setProviderType("");
    setCardRequired("");
    setBackups("");
    setLifetime("");
  };

  return (
    <div className="db-page">
      <div className="db-bg" aria-hidden>
        <div className="db-bg-grad" />
        <div className="db-bg-orb o1" />
        <div className="db-bg-orb o2" />
      </div>
      <div className="d-shell">
        <header className="d-header">
          <PageHero
            variant="inline"
            icon="database"
            title="Free Database Hosting"
            subtitle="Always-free managed databases, caches, vector stores and serverless data platforms. No trials; time-limited offers are marked. Checked Oct 2026."
          />

          <div className="d-search-wrap">
            <div className="d-search-row">
              <SearchField
                className="d-search"
                value={q}
                onValueChange={setQ}
                placeholder="Search providers by name…"
                ariaLabel="Search providers"
              />
              <FilterMenu activeCount={activeCount}>
                <div className="d-filter-fields">
                  <Select
                    className="d-select"
                    value={providerType}
                    onChange={setProviderType}
                    options={typeOptions}
                    ariaLabel="Database type"
                  />
                  <Select
                    className="d-select"
                    value={cardRequired}
                    onChange={setCardRequired}
                    options={cardOptions}
                    ariaLabel="Card requirement"
                  />
                  <Select
                    className="d-select"
                    value={backups}
                    onChange={setBackups}
                    options={backupOptions}
                    ariaLabel="Backup support"
                  />
                  <Select
                    className="d-select"
                    value={lifetime}
                    onChange={setLifetime}
                    options={lifetimeOptions}
                    ariaLabel="Free tier lifetime"
                  />
                  {activeCount > 0 && (
                    <button type="button" className="d-filter-clear" onClick={clearFilters}>
                      Clear filters <Icon name="close" size={12} />
                    </button>
                  )}
                </div>
              </FilterMenu>
            </div>
            <div className="d-stats">
              {loading ? (
                "Loading…"
              ) : (
                <>
                  <strong>{filtered.length}</strong> of <strong>{list.length}</strong> providers
                </>
              )}
            </div>
          </div>
        </header>

        {loading ? (
          <div className="d-grid">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="d-skel" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="d-empty">
            <div style={{ marginBottom: 8, color: "var(--d-muted)" }}>
              <Icon name="search" size={26} />
            </div>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>No providers found</div>
            <div style={{ color: "var(--d-muted)", fontSize: 13 }}>Try a different search or filters.</div>
          </div>
        ) : (
          <div className="d-grid">
            {filtered.map((host) => (
              <article key={host.name} className="d-card">
                <div className="d-card-top">
                  <div className="d-card-heading">
                    <span className="d-type" title={host.type}>
                      {host.type}
                    </span>
                    <div className="d-card-name" title={host.name}>
                      {host.name}
                    </div>
                  </div>
                  <a
                    className="d-visit"
                    href={host.link}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Visit ${host.name}`}
                  >
                    <Icon name="external-link" size={12} /> Visit
                  </a>
                </div>
                <div className="d-specs">
                  <span>
                    <b>{host.storage}</b> Storage
                  </span>
                  <span>
                    <b>{host.transfer}</b> Traffic
                  </span>
                  <span>
                    <b>{host.databases}</b> Databases
                  </span>
                  <span>
                    <b>{host.region}</b> Region
                  </span>
                </div>
                <div className="d-facts">
                  <div className="d-fact">
                    <Icon name="smartphone" size={13} />
                    <span>
                      <b>Verification:</b> {host.verification}
                    </span>
                  </div>
                  <div className="d-fact">
                    <Icon name="warning" size={13} />
                    <span>
                      <b>Limits:</b> {host.limits}
                    </span>
                  </div>
                </div>
                <div className="d-note">
                  <Icon name="sparkles" size={14} />
                  <span>{host.notes}</span>
                </div>
                <div className="d-tags">
                  <span className={`d-pill ${host.ssl ? "yes" : "neutral"}`}>
                    <Icon name={host.ssl ? "check" : "warning"} size={12} />{" "}
                    {host.ssl ? "TLS" : "No TLS"}
                  </span>
                  <span className={`d-pill ${host.cardRequired ? "neutral" : "yes"}`}>
                    <Icon name={host.cardRequired ? "warning" : "check"} size={12} />{" "}
                    {host.cardRequired ? "Card required" : "No card"}
                  </span>
                  <span className={`d-pill ${host.backups !== "None" ? "yes" : "neutral"}`}>
                    <Icon name={host.backups !== "None" ? "check" : "close"} size={12} />{" "}
                    {host.backups !== "None" ? "Backups" : "No backups"}
                  </span>
                  <span className={`d-pill ${host.alwaysFree ? "yes" : "neutral"}`}>
                    <Icon name={host.alwaysFree ? "check" : "warning"} size={12} />{" "}
                    {host.alwaysFree ? "Free forever" : "Time-limited"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
