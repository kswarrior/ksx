import { useEffect, useMemo, useState } from "react";
import { api, WebsiteHosting } from "../lib/api";
import BrandLogo from "../components/BrandLogo";
import Icon from "../components/Icon";
import FilterMenu from "../components/FilterMenu";
import PageHero from "../components/PageHero";
import { SearchField, Select, type SelectOption } from "../components/ui";
import "./WebsiteHosting.css";

const typeOptions: SelectOption[] = [
  { value: "", label: "Type • All" },
  { value: "Static & app platforms", label: "Static & app platforms" },
  { value: "PHP & shared", label: "PHP / Python & shared" },
  { value: "Website builders", label: "Website builders" },
];

const domainOptions: SelectOption[] = [
  { value: "", label: "Domain • All" },
  { value: "true", label: "Free custom domain" },
  { value: "false", label: "Provider subdomain" },
];

const sslOptions: SelectOption[] = [
  { value: "", label: "SSL • All" },
  { value: "true", label: "Free SSL" },
  { value: "false", label: "No free SSL" },
];

const groupOf = (type: string) => {
  if (type.toLowerCase().includes("builder")) return "Website builders";
  if (type.toLowerCase().includes("php") || type.toLowerCase().includes("python")) return "PHP & shared";
  return "Static & app platforms";
};

export default function WebsiteHostingPage() {
  const [list, setList] = useState<WebsiteHosting[]>([]);
  const [q, setQ] = useState("");
  const [providerType, setProviderType] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [ssl, setSsl] = useState("");
  const [noAdsOnly, setNoAdsOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .getWebsiteHosting()
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

  const filtered = useMemo(
    () =>
      list.filter((h) => {
        if (q && !h.name.toLowerCase().includes(q.toLowerCase())) return false;
        if (providerType && groupOf(h.type) !== providerType) return false;
        if (customDomain && h.customDomain !== (customDomain === "true")) return false;
        if (ssl && h.ssl !== (ssl === "true")) return false;
        if (noAdsOnly && h.ads) return false;
        return true;
      }),
    [list, q, providerType, customDomain, ssl, noAdsOnly]
  );

  const activeCount =
    [providerType, customDomain, ssl].filter(Boolean).length + (noAdsOnly ? 1 : 0);

  const clearFilters = () => {
    setQ("");
    setProviderType("");
    setCustomDomain("");
    setSsl("");
    setNoAdsOnly(false);
  };

  return (
    <div className="web-page">
      <div className="web-bg" aria-hidden>
        <div className="web-bg-grad" />
        <div className="web-bg-orb o1" />
        <div className="web-bg-orb o2" />
      </div>
      <div className="w-shell">
        <header className="w-header">
          <PageHero
            variant="inline"
            icon="globe"
            title="Free Website Hosting"
            subtitle="Free website hosts, static platforms and site builders with their real storage, traffic and domain limits. Trials, credits and paid plans are excluded. Checked Oct 2026."
          />

          <div className="w-search-wrap">
            <div className="w-search-row">
              <SearchField
                className="w-search"
                value={q}
                onValueChange={setQ}
                placeholder="Search providers by name…"
                ariaLabel="Search providers"
              />
              <FilterMenu activeCount={activeCount}>
                <div className="w-filter-fields">
                  <Select
                    className="w-select"
                    value={providerType}
                    onChange={setProviderType}
                    options={typeOptions}
                    ariaLabel="Provider type"
                  />
                  <Select
                    className="w-select"
                    value={customDomain}
                    onChange={setCustomDomain}
                    options={domainOptions}
                    ariaLabel="Custom domain support"
                  />
                  <Select
                    className="w-select"
                    value={ssl}
                    onChange={setSsl}
                    options={sslOptions}
                    ariaLabel="Free SSL support"
                  />
                  <div className="w-filter-toggles">
                    <span className="w-filter-label">Must have</span>
                    <div className="w-filter-toggle-row">
                      <button
                        type="button"
                        className={`w-filter-pill ${noAdsOnly ? "active" : ""}`}
                        aria-pressed={noAdsOnly}
                        onClick={() => setNoAdsOnly((value) => !value)}
                      >
                        No ads
                      </button>
                    </div>
                  </div>
                  {activeCount > 0 && (
                    <button type="button" className="w-filter-clear" onClick={clearFilters}>
                      Clear filters <Icon name="close" size={12} />
                    </button>
                  )}
                </div>
              </FilterMenu>
            </div>
            <div className="w-stats">
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
          <div className="w-grid">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-skel" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="w-empty">
            <div style={{ marginBottom: 8, color: "var(--w-muted)" }}>
              <Icon name="search" size={26} />
            </div>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>No providers found</div>
            <div style={{ color: "var(--w-muted)", fontSize: 13 }}>Try a different search or filters.</div>
          </div>
        ) : (
          <div className="w-grid">
            {filtered.map((host) => (
              <article key={host.name} className="w-card">
                <div className="w-card-top">
                  <div className="w-card-heading">
                    <BrandLogo className="w-logo" src={host.logo} fallback="globe" iconSize={20} />
                    <div className="w-heading-copy">
                      <span className="w-type">{host.type}</span>
                      <div className="w-card-name" title={host.name}>
                        {host.name}
                      </div>
                    </div>
                  </div>
                  <a
                    className="w-visit"
                    href={host.link}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Visit ${host.name}`}
                  >
                    <Icon name="external-link" size={12} /> Visit
                  </a>
                </div>
                <div className="w-specs">
                  <span>
                    <b>{host.storage}</b> Storage
                  </span>
                  <span>
                    <b>{host.bandwidth}</b> Traffic
                  </span>
                  <span>
                    <b>{host.sites}</b> Sites
                  </span>
                  <span>
                    <b>{host.database}</b> Data
                  </span>
                </div>
                <div className="w-facts">
                  <div className="w-fact">
                    <Icon name="smartphone" size={13} />
                    <span>
                      <b>Verification:</b> {host.verification}
                    </span>
                  </div>
                  <div className="w-fact">
                    <Icon name="warning" size={13} />
                    <span>
                      <b>Limits:</b> {host.limits}
                    </span>
                  </div>
                </div>
                <div className="w-note">
                  <Icon name="sparkles" size={14} />
                  <span>{host.notes}</span>
                </div>
                <div className="w-tags">
                  <span className={`w-pill ${host.customDomain ? "yes" : "neutral"}`}>
                    <Icon name={host.customDomain ? "check" : "close"} size={12} />{" "}
                    {host.customDomain ? "Custom domain" : "No custom domain"}
                  </span>
                  <span className={`w-pill ${host.ssl ? "yes" : "neutral"}`}>
                    <Icon name={host.ssl ? "check" : "warning"} size={12} />{" "}
                    {host.ssl ? "Free SSL" : "No free SSL"}
                  </span>
                  <span className={`w-pill ${host.ads ? "neutral" : "yes"}`}>
                    <Icon name={host.ads ? "warning" : "check"} size={12} />{" "}
                    {host.ads ? "Ads / branding" : "No ads"}
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
