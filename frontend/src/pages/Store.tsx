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
                    <Link key={app.slug} className="store-card" to={appPath(app)}>
                      <div className="store-card-top">
                        <BrandLogo
                          className="store-card-icon"
                          src={app.icon}
                          fallback="package"
                          iconSize={30}
                        />
                        <div className="store-card-info">
                          <h3>{app.name}</h3>
                          <p className="store-card-dev">{app.owner}</p>
                        </div>
                      </div>

                      <dl className="store-card-facts">
                        <div>
                          <dt>Price</dt>
                          <dd>{app.price ?? "Free"}</dd>
                        </div>
                        <div>
                          <dt>Version</dt>
                          <dd>{versionLabel(app.version)}</dd>
                        </div>
                        <div>
                          <dt>Android</dt>
                          <dd>{app.requires ?? "—"}</dd>
                        </div>
                        <div>
                          <dt>Size</dt>
                          <dd>{app.size ?? "—"}</dd>
                        </div>
                      </dl>

                      <div className="store-card-footer">
                        <span className="store-card-downloads">
                          <Icon name="download" size={13} />
                          {download ?? "0 downloads"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
