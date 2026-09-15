import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { api, SitemapCategory } from "../lib/api";
import { RECENT_KEY, MAX_RECENT } from "../hooks/useLocalStorage";
import "./MapPage.css";

type FilterCat = string; // "All" | category name

function useDebounced<T>(value: T, ms = 180) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export default function MapPage() {
  const [data, setData] = useState<SitemapCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const dq = useDebounced(query.trim().toLowerCase(), 160);
  const [activeCat, setActiveCat] = useState<FilterCat>("All");
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(() => new Set());
  const [collapsedSecs, setCollapsedSecs] = useState<Set<string>>(() => new Set());
  const searchRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // fetch
  useEffect(() => {
    let alive = true;
    api
      .getSitemap()
      .then((d) => {
        if (!alive) return;
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Failed to load map");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const categories = useMemo(() => data.map((c) => c.category), [data]);

  const totalPages = useMemo(
    () => data.reduce((acc, c) => acc + c.sections.reduce((a, s) => a + s.pages.length, 0), 0),
    [data]
  );

  const filtered = useMemo(() => {
    let out = data;
    if (activeCat !== "All") out = out.filter((c) => c.category === activeCat);
    if (!dq) return out;
    return out
      .map((cat) => ({
        ...cat,
        sections: cat.sections
          .map((sec) => ({
            ...sec,
            pages: sec.pages.filter(
              (p) =>
                p.name.toLowerCase().includes(dq) ||
                sec.title.toLowerCase().includes(dq) ||
                cat.category.toLowerCase().includes(dq)
            ),
          }))
          .filter((s) => s.pages.length > 0),
      }))
      .filter((c) => c.sections.length > 0);
  }, [data, dq, activeCat]);

  const filteredCount = useMemo(
    () => filtered.reduce((acc, c) => acc + c.sections.reduce((a, s) => a + s.pages.length, 0), 0),
    [filtered]
  );

  // reveal on scroll via IO - only after data ready
  useEffect(() => {
    if (loading) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // show all instantly
      document.querySelectorAll(".mp-category").forEach((el) => el.classList.add("in-view"));
      return;
    }
    const els = gridRef.current?.querySelectorAll<HTMLElement>(".mp-category");
    if (!els || els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [loading, filtered]);

  const toggleCat = useCallback((name: string) => {
    setCollapsedCats((prev) => {
      const n = new Set(prev);
      if (n.has(name)) n.delete(name);
      else n.add(name);
      return n;
    });
  }, []);

  const toggleSec = useCallback((key: string) => {
    setCollapsedSecs((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  }, []);

  const clearAll = useCallback(() => {
    setQuery("");
    setActiveCat("All");
    searchRef.current?.focus();
  }, []);

  const saveRecent = useCallback((name: string, url: string, logo: string, category: string, title: string) => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      let recent: { name: string; url: string; time: number; logo?: string; category?: string; title?: string }[] = raw ? JSON.parse(raw) : [];
      recent = recent.filter((r) => r.url !== url);
      recent.unshift({ name, url, time: Date.now(), logo, category, title });
      recent = recent.slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
    } catch {}
  }, []);

  if (loading) {
    return (
      <div className="map-page">
        <div className="mp-shell">
          <div className="mp-header mp-skeleton-header">
            <div className="sk sk-title" />
            <div className="sk sk-sub" />
            <div className="sk sk-search" />
            <div className="sk-pills">
              <span className="sk sk-pill" />
              <span className="sk sk-pill" />
              <span className="sk sk-pill" />
            </div>
          </div>
          <div className="mp-grid">
            {[0, 1].map((i) => (
              <div key={i} className="mp-category sk-card">
                <div className="sk sk-cat-title" />
                <div className="sk sk-sec" />
                <div className="sk-pages">
                  <span className="sk sk-chip" />
                  <span className="sk sk-chip" />
                  <span className="sk sk-chip" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-page">
        <div className="mp-shell">
          <div className="mp-error">
            <div className="mp-error-icon">⚠️</div>
            <h2>Couldn’t load map</h2>
            <p>{error}</p>
            <button className="mp-btn mp-btn-primary" onClick={() => location.reload()}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="map-page">
      {/* bg layers - no animation on reduced-motion / phone via CSS */}
      <div className="mp-bg" aria-hidden>
        <div className="mp-bg-gradient" />
        <div className="mp-bg-orb o1" />
        <div className="mp-bg-orb o2" />
        <div className="mp-bg-grid" />
      </div>

      <div className="mp-shell">
        {/* header */}
        <header className="mp-header">
          <div className="mp-kicker">
            <span className="mp-kicker-dot" />
            KS WARRIOR • SITEMAP
            <span className="mp-kicker-count">{totalPages} pages</span>
          </div>

          <h1 className="mp-title">
            Network <span>Map</span>
          </h1>
          <p className="mp-sub">
            Explore everything — Minecraft, VPS, panels & tools. Search or filter, tap any card to jump in.
          </p>

          {/* search */}
          <div className="mp-search-wrap">
            <div className="mp-search">
              <svg className="mp-search-icon" viewBox="0 0 24 24" aria-hidden>
                <circle cx="11" cy="11" r="6.5" />
                <path d="M16 16 L20 20" />
              </svg>
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages, sections, categories…"
                aria-label="Search map"
                spellCheck={false}
                autoComplete="off"
              />
              {query ? (
                <button className="mp-search-clear" onClick={() => setQuery("")} aria-label="Clear search">
                  ✕
                </button>
              ) : null}
            </div>

            <div className="mp-search-meta">
              <span className="mp-count">
                {dq || activeCat !== "All" ? (
                  <>
                    <strong>{filteredCount}</strong> of <strong>{totalPages}</strong> pages
                  </>
                ) : (
                  <>
                    <strong>{totalPages}</strong> pages • <strong>{categories.length}</strong> categories
                  </>
                )}
              </span>
              {(dq || activeCat !== "All") && (
                <button className="mp-link" onClick={clearAll}>
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* filters */}
          <div className="mp-filters" role="tablist" aria-label="Category filters">
            <button
              className={`mp-pill ${activeCat === "All" ? "active" : ""}`}
              onClick={() => setActiveCat("All")}
              role="tab"
              aria-selected={activeCat === "All"}
            >
              All <em>{totalPages}</em>
            </button>
            {data.map((c) => {
              const count = c.sections.reduce((a, s) => a + s.pages.length, 0);
              return (
                <button
                  key={c.category}
                  className={`mp-pill ${activeCat === c.category ? "active" : ""}`}
                  onClick={() => setActiveCat(c.category)}
                  role="tab"
                  aria-selected={activeCat === c.category}
                >
                  <span className="mp-pill-icon" dangerouslySetInnerHTML={{ __html: c.icon }} />
                  {c.category} <em>{count}</em>
                </button>
              );
            })}
          </div>
        </header>

        {/* results */}
        {filtered.length === 0 ? (
          <div className="mp-empty">
            <div className="mp-empty-icon">🔍</div>
            <h3>No matches</h3>
            <p>
              No pages match <strong>“{dq}”</strong>
              {activeCat !== "All" ? ` in ${activeCat}` : ""}.
            </p>
            <button className="mp-btn mp-btn-ghost" onClick={clearAll}>
              Clear search
            </button>
          </div>
        ) : (
          <div className="mp-grid" ref={gridRef}>
            {filtered.map((cat, idx) => {
              const catPages = cat.sections.reduce((a, s) => a + s.pages.length, 0);
              const isCollapsed = collapsedCats.has(cat.category);
              return (
                <section
                  key={cat.category}
                  className={`mp-category ${isCollapsed ? "collapsed" : ""}`}
                  style={{ ["--i" as string]: idx } as React.CSSProperties}
                >
                  <button className="mp-cat-head" onClick={() => toggleCat(cat.category)} aria-expanded={!isCollapsed}>
                    <span className="mp-cat-icon" dangerouslySetInnerHTML={{ __html: cat.icon }} />
                    <span className="mp-cat-text">
                      <span className="mp-cat-name">{cat.category}</span>
                      <span className="mp-cat-meta">
                        {cat.sections.length} sections • {catPages} pages
                      </span>
                    </span>
                    <span className="mp-cat-badge">{catPages}</span>
                    <span className="mp-cat-chevron" aria-hidden>
                      <svg viewBox="0 0 24 24">
                        <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </button>

                  <div className="mp-cat-body">
                    {cat.sections.map((sec) => {
                      const key = `${cat.category}::${sec.title}`;
                      const secCollapsed = collapsedSecs.has(key);
                      return (
                        <div key={sec.title} className={`mp-section ${secCollapsed ? "sec-collapsed" : ""}`}>
                          <button className="mp-sec-head" onClick={() => toggleSec(key)} aria-expanded={!secCollapsed}>
                            <span className="mp-sec-icon" dangerouslySetInnerHTML={{ __html: sec.icon }} aria-hidden />
                            <span className="mp-sec-title">{sec.title}</span>
                            <span className="mp-sec-count">{sec.pages.length}</span>
                            <span className="mp-sec-chev" aria-hidden>
                              ▾
                            </span>
                          </button>

                          <div className="mp-sec-body">
                            <div className="mp-pages">
                              {sec.pages.map((p) => (
                                <Link
                                  key={p.url}
                                  to={p.url}
                                  className="mp-page"
                                  aria-label={p.name}
                                  onClick={() => saveRecent(p.name, p.url, p.logo, cat.category, sec.title)}
                                >
                                  <span className="mp-page-icon" dangerouslySetInnerHTML={{ __html: p.logo }} />
                                  <span className="mp-page-name">{p.name}</span>
                                  <span className="mp-page-arrow" aria-hidden>
                                    ↗
                                  </span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <footer className="mp-footer">
          <span>KS Warrior • Neural Sitemap</span>
          <span className="mp-footer-dot">•</span>
          <span>{totalPages} pages indexed</span>
        </footer>
      </div>
    </div>
  );
}
