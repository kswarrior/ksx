import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import FilterMenu from "../components/FilterMenu";
import Icon from "../components/Icon";
import PageHero from "../components/PageHero";
import { SearchField, Select, type SelectOption } from "../components/ui";
import { api, type AppStats, type StoreApp } from "../lib/api";
import "./Store.css";

const SORT_OPTIONS: SelectOption[] = [
  { value: "featured", label: "Sort • Featured" },
  { value: "name-asc", label: "Name • A–Z" },
  { value: "name-desc", label: "Name • Z–A" },
  { value: "version", label: "Latest version" },
];

function versionLabel(value: string): string {
  return /^v/i.test(value) ? value : `v${value}`;
}

function appPath(app: StoreApp): string {
  return app.pageUrl ?? `/apps/android/${app.slug}`;
}

function downloadsLabel(stats: AppStats | undefined): string | null {
  if (!stats || !stats.available || stats.downloads === null) return null;
  return `${stats.downloads.toLocaleString()} ${stats.downloads === 1 ? "download" : "downloads"}`;
}

export default function StorePage() {
  const [apps, setApps] = useState<StoreApp[]>([]);
  const [stats, setStats] = useState<Record<string, AppStats>>({});
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("featured");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);

    api
      .getApps()
      .then((result) => {
        if (cancelled) return;
        const androidApps = result.data.filter(
          (app) => app.platform.toLowerCase() === "android"
        );
        setApps(androidApps);
        setLoading(false);

        Promise.allSettled(androidApps.map((app) => api.getAppStats(app.slug))).then(
          (results) => {
            if (cancelled) return;
            const next: Record<string, AppStats> = {};
            results.forEach((entry, index) => {
              if (entry.status === "fulfilled") {
                next[androidApps[index].slug] = entry.value;
              }
            });
            setStats(next);
          }
        );
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reload]);

  const categoryOptions = useMemo<SelectOption[]>(() => {
    const categories = Array.from(
      new Set(apps.map((app) => app.category).filter((value): value is string => Boolean(value)))
    ).sort();
    return [
      { value: "", label: "Category • All" },
      ...categories.map((value) => ({ value, label: value })),
    ];
  }, [apps]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const result = apps.filter((app) => {
      if (query) {
        const haystack = [
          app.name,
          app.owner,
          app.category,
          app.tagline,
          app.description,
          ...(app.tags ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (category && app.category !== category) return false;
      return true;
    });

    return result.sort((a, b) => {
      if (sort === "name-asc") return a.name.localeCompare(b.name);
      if (sort === "name-desc") return b.name.localeCompare(a.name);
      if (sort === "version") {
        return b.version.localeCompare(a.version, undefined, { numeric: true });
      }
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.name.localeCompare(b.name);
    });
  }, [apps, q, category, sort]);

  const activeFilters = [category].filter(Boolean).length + (sort === "featured" ? 0 : 1);
  const clearFilters = () => {
    setQ("");
    setCategory("");
    setSort("featured");
  };

  return (
    <div className="store-page">
      <div className="store-bg" aria-hidden>
        <div className="store-bg-glow g1" />
        <div className="store-bg-glow g2" />
        <div className="store-bg-grid" />
      </div>

      <div className="store-shell">
        <header className="store-header">
          <PageHero
            variant="inline"
            icon="package"
            kicker="KS Apps · Android"
            title="KS Store"
            subtitle="Apps built by KS Warrior — fast, private and free. Browse the catalog and install the latest release."
          />

          <div className="store-search-wrap">
            <div className="store-search-row">
              <SearchField
                className="store-search"
                value={q}
                onValueChange={setQ}
                placeholder="Search apps, tools and browsers…"
                ariaLabel="Search apps"
              />
              <FilterMenu activeCount={activeFilters}>
                <div className="store-filter-fields">
                  <Select
                    className="store-select"
                    value={category}
                    onChange={setCategory}
                    options={categoryOptions}
                    ariaLabel="Category"
                  />
                  <Select
                    className="store-select"
                    value={sort}
                    onChange={setSort}
                    options={SORT_OPTIONS}
                    ariaLabel="Sort apps"
                  />
                  {activeFilters > 0 && (
                    <button type="button" className="store-filter-clear" onClick={clearFilters}>
                      Clear filters <Icon name="close" size={12} />
                    </button>
                  )}
                </div>
              </FilterMenu>
            </div>
            <div className="store-stats">
              {loading ? (
                "Loading…"
              ) : (
                <>
                  <strong>{filtered.length}</strong> of <strong>{apps.length}</strong>{" "}
                  {apps.length === 1 ? "app" : "apps"}
                </>
              )}
            </div>
          </div>
        </header>

        {loading ? (
          <div className="store-skeleton-grid">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="store-skeleton" />
            ))}
          </div>
        ) : failed ? (
          <div className="store-empty">
            <div className="store-empty-icon">
              <Icon name="warning" size={26} />
            </div>
            <div className="store-empty-title">Couldn't load the store</div>
            <div className="store-empty-text">Check your connection and try again.</div>
            <button type="button" className="store-empty-btn" onClick={() => setReload((value) => value + 1)}>
              Retry
            </button>
          </div>
        ) : (
          <>
            {featured && (
              <section className="store-featured" aria-labelledby="store-featured-title">
                <div className="store-featured-copy">
                  <span className="store-featured-kicker">
                    <Icon name="sparkles" size={12} /> Featured app
                  </span>
                  <div className="store-featured-app">
                    <BrandLogo
                      className="store-featured-icon"
                      src={featured.icon}
                      fallback="package"
                      iconSize={36}
                    />
                    <div className="store-featured-info">
                      <h2 id="store-featured-title">{featured.name}</h2>
                      <p className="store-featured-dev">{featured.owner}</p>
                      <p className="store-featured-meta">
                        {[featured.category, featured.price, featured.requires]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </div>

                  {featured.tagline && <p className="store-featured-tagline">{featured.tagline}</p>}

                  {featured.tags && featured.tags.length > 0 && (
                    <div className="store-featured-tags">
                      {featured.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="store-featured-actions">
                    <a
                      className="store-install"
                      href={featured.downloadUrl}
                      download
                      onClick={() =>
                        trackAppDownload(featured.slug, featured.version, featured.platform)
                      }
                    >
                      <Icon name="download" size={15} />
                      Install
                      <span>{versionLabel(featured.version)}</span>
                    </a>
                    <Link className="store-details-btn" to={appPath(featured)}>
                      Details <Icon name="chevron-right" size={15} />
                    </Link>
                  </div>

                  <div className="store-featured-facts">
                    {currentDownloadsLabel(stats[featured.slug]) && (
                      <span>
                        <strong>{currentDownloadsLabel(stats[featured.slug])}</strong>
                        <small>on this version</small>
                      </span>
                    )}
                    <span>
                      <strong>{versionLabel(featured.version)}</strong>
                      <small>latest version</small>
                    </span>
                    <span>
                      <strong>{featured.requires ?? featured.platform}</strong>
                      <small>requires</small>
                    </span>
                  </div>
                </div>

                {featured.screenshot && (
                  <Link
                    className="store-featured-shot"
                    to={appPath(featured)}
                    aria-label={`View ${featured.name}`}
                  >
                    <span className="store-phone">
                      <img
                        src={featured.screenshot}
                        alt={`${featured.name} screenshot`}
                        width={412}
                        height={915}
                        loading="lazy"
                        decoding="async"
                      />
                    </span>
                  </Link>
                )}
              </section>
            )}

            <section className="store-catalog" aria-labelledby="store-catalog-title">
              <div className="store-section-head">
                <h2 id="store-catalog-title">All apps</h2>
                <span>{filtered.length}</span>
              </div>

              {filtered.length === 0 ? (
                <div className="store-empty">
                  <div className="store-empty-icon">
                    <Icon name="search" size={26} />
                  </div>
                  <div className="store-empty-title">No apps found</div>
                  <div className="store-empty-text">Try a different search or category.</div>
                  <button type="button" className="store-empty-btn" onClick={clearFilters}>
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="store-grid">
                  {filtered.map((app) => {
                    const download = downloadsLabel(stats[app.slug]);
                    return (
                      <article key={app.slug} className="store-card">
                        <div className="store-card-top">
                          <BrandLogo
                            className="store-card-icon"
                            src={app.icon}
                            fallback="package"
                            iconSize={30}
                          />
                          <div className="store-card-info">
                            <div className="store-card-title">
                              <h3>{app.name}</h3>
                              {app.featured && <span className="store-badge">Featured</span>}
                            </div>
                            <p className="store-card-dev">{app.owner}</p>
                            <p className="store-card-meta">
                              {[app.category, app.price, app.requires].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                        </div>

                        <p className="store-card-tagline">{app.tagline ?? app.description}</p>

                        {app.tags && app.tags.length > 0 && (
                          <div className="store-card-tags">
                            {app.tags.map((tag) => (
                              <span key={tag}>{tag}</span>
                            ))}
                          </div>
                        )}

                        <div className="store-card-footer">
                          <span className="store-card-downloads">
                            <Icon name={download ? "download" : "sparkles"} size={13} />
                            {download ?? "New release"}
                          </span>
                          <div className="store-card-actions">
                            <Link className="store-card-details" to={appPath(app)}>
                              Details
                            </Link>
                            <a
                              className="store-card-install"
                              href={app.downloadUrl}
                              download
                              onClick={() => trackAppDownload(app.slug, app.version, app.platform)}
                            >
                              Install
                            </a>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
