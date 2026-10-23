import { Suspense, useCallback, useEffect, useLayoutEffect, useState, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { api, SearchItem } from "../lib/api";
import { flattenSitemap, searchItems } from "../lib/search";
import BrandLogo from "./BrandLogo";
import HighlightedText from "./HighlightedText";
import Icon from "./Icon";
import KsLoader from "./KsLoader";
import { TextField } from "./ui";
import { PIN_KEY, LAST_PAGE_KEY, RECENT_KEY, MAX_RECENT, RecentItem, PinItem, readPins } from "../hooks/useLocalStorage";
import "./Layout.css";

export default function Layout() {
  const [sitemap, setSitemap] = useState<SearchItem[]>([]);
  const [query, setQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== "undefined" ? window.matchMedia("(min-width: 900px)").matches : false);
  const [suggestions, setSuggestions] = useState<SearchItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isPinned, setIsPinned] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLInputElement>(null);
  const suggestRef = useRef<HTMLUListElement>(null);
  const lastPathRef = useRef(location.pathname);

  // Defer sitemap loading so it never competes with first paint
  const sitemapRequested = useRef(false);
  const loadSitemap = useCallback(() => {
    if (sitemapRequested.current) return;
    sitemapRequested.current = true;
    api
      .getSitemap()
      .then((data) => {
        const flat: SearchItem[] = flattenSitemap(data);
        setSitemap(flat);
        const logoByUrl = new Map(
          flat.filter((item) => item.logoUrl).map((item) => [item.url, item.logoUrl!])
        );
        try {
          const recentRaw = localStorage.getItem(RECENT_KEY);
          if (recentRaw) {
            const recent: RecentItem[] = JSON.parse(recentRaw);
            let changed = false;
            const next = recent.map((item) => {
              const logoUrl = logoByUrl.get(item.url);
              if (logoUrl && item.logoUrl !== logoUrl) {
                changed = true;
                return { ...item, logoUrl };
              }
              return item;
            });
            if (changed) localStorage.setItem(RECENT_KEY, JSON.stringify(next));
          }
          const pins = readPins();
          let pinsChanged = false;
          const nextPins = pins.map((item) => {
            const logoUrl = logoByUrl.get(item.url);
            if (logoUrl && item.logoUrl !== logoUrl) {
              pinsChanged = true;
              return { ...item, logoUrl };
            }
            return item;
          });
          if (pinsChanged) localStorage.setItem(PIN_KEY, JSON.stringify(nextPins));
        } catch {
          /* ignore */
        }
        window.dispatchEvent(new Event("ks-sitemap-ready"));
      })
      .catch(() => {
        sitemapRequested.current = false;
      });
  }, []);

  useEffect(() => {
    const id = window.setTimeout(loadSitemap, 1200);
    return () => window.clearTimeout(id);
  }, [loadSitemap]);

  // Persist last page + pin detection
  useEffect(() => {
    localStorage.setItem(LAST_PAGE_KEY, location.pathname);
    const cur = location.pathname;
    setIsPinned(readPins().some((p) => p.url === cur || p.url === window.location.href));
    setMenuOpen(false);
  }, [location.pathname]);

  // Minimum 1s loader for in-app navigation (initial load is handled by the boot screen)
  useLayoutEffect(() => {
    if (lastPathRef.current === location.pathname) return;
    lastPathRef.current = location.pathname;
    setRouteLoading(true);
    const id = window.setTimeout(() => setRouteLoading(false), 1000);
    return () => window.clearTimeout(id);
  }, [location.pathname]);

  // Close the 3-dot menu on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as Element).closest("#moreWrap")) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Rank suggestions across names, descriptions, keywords, sections and categories
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }
    setSuggestions(searchItems(sitemap, query));
    setActiveIndex(-1);
  }, [query, sitemap]);

  useEffect(() => {
    if (activeIndex < 0) return;
    suggestRef.current
      ?.querySelector(".s-page.active")
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const saveRecent = (item: SearchItem | { name: string; url: string; logo?: string; logoUrl?: string; category?: string; title?: string }) => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      let recent: RecentItem[] = raw ? JSON.parse(raw) : [];
      recent = recent.filter((r) => r.url !== item.url);
      recent.unshift({
        name: item.name,
        url: item.url,
        time: Date.now(),
        logo: (item as SearchItem).logo,
        logoUrl: (item as SearchItem).logoUrl,
        category: (item as SearchItem).category,
        title: (item as SearchItem).title,
      });
      recent = recent.slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
    } catch { /* ignore */ }
  };

  // Close the drawer when switching to mobile; desktop keeps user's toggle
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 900px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (!e.matches) setSidebarOpen(false);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const isDesktop = () => typeof window !== "undefined" && window.matchMedia("(min-width: 900px)").matches;

  const handleNav = (url: string, name?: string, logo?: string, logoUrl?: string) => {
    if (!isDesktop()) setSidebarOpen(false);
    setSearchActive(false);
    setQuery("");
    // find full item for logo
    const full = sitemap.find((s) => s.url === url);
    if (name) {
      saveRecent(
        full ?? { name, url, logo, logoUrl }
      );
    }
    const path = url.startsWith("/") ? url : `/${url}`;
    navigate(path);
  };

  const handleNavItem = (it: SearchItem) => {
    handleNav(it.url, it.name, it.logo, it.logoUrl);
  };

  const openFullSearch = () => {
    const q = query.trim();
    if (!q) return;
    setSearchActive(false);
    setQuery("");
    navigate(`/map?q=${encodeURIComponent(q)}`);
  };

  const isSidebarPage = location.pathname === "/" || /^\/(dashboard|map|social|about)(\/|$)/.test(location.pathname);

  const togglePin = () => {
    loadSitemap();
    const curUrl = location.pathname;
    const cur = sitemap.find((s) => s.url === curUrl);
    const curName = cur?.name ?? curUrl;
    try {
      const pins: PinItem[] = readPins();
      const exists = pins.some((p) => p.url === curUrl);
      const next = exists
        ? pins.filter((p) => p.url !== curUrl)
        : [{
            name: curName,
            url: curUrl,
            time: Date.now(),
            logo: cur?.logo,
            logoUrl: cur?.logoUrl,
            category: cur?.category,
            title: cur?.title,
          }, ...pins];
      localStorage.setItem(PIN_KEY, JSON.stringify(next));
      setIsPinned(!exists);
    } catch { /* ignore */ }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = suggestions[activeIndex] ?? suggestions[0];
      if (it) handleNavItem(it);
    } else if (e.key === "Escape") {
      setSearchActive(false);
      setQuery("");
    }
  };

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("#topbar") && !t.closest("#suggestBox")) {
        setSearchActive(false);
      }
      if (!t.closest("#sidebar") && !t.closest("#hamburger")) {
        // keep sidebar closed on mobile after outside click
        // but don't auto-close on desktop if user clicks content
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return (
    <>
      <div id="topbar" className={searchActive ? "search-active" : ""}>
        <button id="hamburger" aria-label="Menu" onClick={() => setSidebarOpen((o) => !o)}>
          <svg className="menu-svg" viewBox="0 0 24 24" aria-hidden="true">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>

        <div id="control-right">
          {!isSidebarPage && (
            <div
              id="pinButton"
              title={isPinned ? "Unpin page" : "Pin page"}
              onClick={togglePin}
              className={isPinned ? "pinned" : ""}
              aria-label={isPinned ? "Unpin page" : "Pin page"}
            >
              <svg className="pin-svg" width="18" height="18" viewBox="0 0 24 24" fill={isPinned ? "#F5F5F5" : "none"} stroke="#F5F5F5" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 17v5" />
                <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
              </svg>
            </div>
          )}

          <div className="search-container">
            <div
              id="searchTrigger"
              aria-label="Search"
              onClick={(e) => {
                e.stopPropagation();
                setSearchActive(true);
                loadSitemap();
                requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true }));
              }}
            >
              <svg className="search-svg" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="6.8" fill="none" strokeWidth={1.8} strokeLinecap="round" />
                <line x1="16.2" y1="16.2" x2="20.4" y2="20.4" strokeWidth={1.8} strokeLinecap="round" />
              </svg>
            </div>
            <TextField
              id="searchBox"
              ref={searchRef}
              type="text"
              placeholder="Search pages..."
              aria-label="Search pages"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => { setSearchActive(true); loadSitemap(); }}
            />
          </div>

          <div id="moreWrap">
            <button
              id="moreButton"
              aria-label="More options"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                <circle cx="12" cy="5" r="1.7" />
                <circle cx="12" cy="12" r="1.7" />
                <circle cx="12" cy="19" r="1.7" />
              </svg>
            </button>
            {menuOpen && (
              <div id="moreMenu" role="menu">
                <div className="more-title">Menu</div>
                <button className="more-item" type="button" role="menuitem">
                  <span className="more-item-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="3.5" />
                      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
                    </svg>
                  </span>
                  <span className="more-item-label">Account</span>
                </button>
                <button className="more-item danger" type="button" role="menuitem">
                  <span className="more-item-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <path d="M16 17l5-5-5-5" />
                      <path d="M21 12H9" />
                    </svg>
                  </span>
                  <span className="more-item-label">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ul
        id="suggestBox"
        ref={suggestRef}
        role="listbox"
        style={{ display: searchActive && query.trim() ? "block" : "none" }}
        onClick={(e) => e.stopPropagation()}
      >
        {suggestions.length === 0 && query.trim() ? (
          <li className="s-empty">
            <span className="s-empty-title">No results for “{query.trim()}”</span>
            <span className="s-empty-text">Try a broader search or one of these:</span>
            <span className="s-empty-chips">
              {["free hosting", "paid plugins", "java downloader", "custom ip"].map((term) => (
                <button
                  key={term}
                  type="button"
                  className="s-chip"
                  onClick={() => setQuery(term)}
                >
                  {term}
                </button>
              ))}
            </span>
          </li>
        ) : (
          <>
            <li className="s-results-head" role="presentation">
              <span>
                {suggestions.length} result{suggestions.length === 1 ? "" : "s"} for “{query.trim()}”
              </span>
              <span className="s-results-hint">
                <kbd>↑</kbd><kbd>↓</kbd> to move
              </span>
            </li>
            {suggestions.map((p, idx) => (
              <li
                key={`${p.category}-${p.title}-${p.url}`}
                className={`s-page ${idx === activeIndex ? "active" : ""}`}
                role="option"
                aria-selected={idx === activeIndex}
                onClick={() => handleNavItem(p)}
              >
                {p.logoUrl ? (
                  <BrandLogo className="s-page-logo" src={p.logoUrl} fallback="link" iconSize={18} />
                ) : (
                  <span className="s-page-logo" dangerouslySetInnerHTML={{ __html: p.logo }} />
                )}
                <span className="s-page-info">
                  <span className="s-page-name">
                    <HighlightedText text={p.name} query={query} />
                    {p.soon && <span className="s-soon-pill">Soon</span>}
                  </span>
                  <span className="s-page-path">
                    <span className="s-page-cat">{p.category}</span>
                    <span className="s-page-sep">›</span>
                    {p.title}
                  </span>
                  {p.description && (
                    <span className="s-page-desc">
                      <HighlightedText text={p.description} query={query} />
                    </span>
                  )}
                </span>
                <span className="s-page-go" aria-hidden><Icon name="external-link" size={12} /></span>
              </li>
            ))}
            <li className="s-search-footer" role="presentation">
              <span className="s-kbd-hint">
                <kbd>↵</kbd> open <kbd>esc</kbd> close
              </span>
              <button type="button" className="s-all-btn" onClick={openFullSearch}>
                View all results
                <Icon name="arrow-up-right" size={11} />
              </button>
            </li>
          </>
        )}
      </ul>

      <nav id="sidebar" aria-label="Main navigation" className={sidebarOpen ? "open" : ""}>
        <div className="sb-nav">
          <Link
            to="/dashboard"
            onClick={() => { if (!isDesktop()) setSidebarOpen(false); }}
            className={`sb-link ${(location.pathname === "/" || location.pathname === "/dashboard" || location.pathname.startsWith("/dashboard")) ? "active" : ""}`}
            style={{ ["--i" as string]: 0 } as React.CSSProperties}
          >
            <span className="sb-icon sb-icon-dash" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.6" /><rect x="14" y="3" width="7" height="7" rx="1.6" /><rect x="3" y="14" width="7" height="7" rx="1.6" /><rect x="14" y="14" width="7" height="7" rx="1.6" />
              </svg>
            </span>
            <span className="sb-label">Dashboard</span>
          </Link>

          <Link
            to="/map"
            onClick={() => { if (!isDesktop()) setSidebarOpen(false); }}
            className={`sb-link ${location.pathname.startsWith("/map") ? "active" : ""}`}
            style={{ ["--i" as string]: 1 } as React.CSSProperties}
          >
            <span className="sb-icon sb-icon-map" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 6l7-3 7 3 7-3v14l-7 3-7-3-7 3z" /><path d="M8 3v14M15 6v14" />
              </svg>
            </span>
            <span className="sb-label">Sites Map</span>
          </Link>

          <Link
            to="/social"
            onClick={() => { if (!isDesktop()) setSidebarOpen(false); }}
            className={`sb-link ${location.pathname.startsWith("/social") ? "active" : ""}`}
            style={{ ["--i" as string]: 2 } as React.CSSProperties}
          >
            <span className="sb-icon sb-icon-social" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 10.7L15.4 6.8M8.6 13.3L15.4 17.2" />
              </svg>
            </span>
            <span className="sb-label">Social Media</span>
          </Link>

          <Link
            to="/about"
            onClick={() => { if (!isDesktop()) setSidebarOpen(false); }}
            className={`sb-link ${location.pathname.startsWith("/about") ? "active" : ""}`}
            style={{ ["--i" as string]: 3 } as React.CSSProperties}
          >
            <span className="sb-icon sb-icon-about" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" /><path d="M12 11.5v5M12 8.5h.01" />
              </svg>
            </span>
            <span className="sb-label">About</span>
          </Link>
        </div>
      </nav>

      <div id="content" className={sidebarOpen ? "sidebar-open" : ""}>
        <Suspense fallback={<KsLoader label="Loading KS" />}>
          <Outlet />
        </Suspense>
        {routeLoading && (
          <div className="route-loader">
            <KsLoader label="Loading KS" />
          </div>
        )}
      </div>

      {sidebarOpen && !isDesktop() && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
    </>
  );
}
