import { useEffect, useState, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { api, SearchItem } from "../lib/api";
import { FAV_KEY, LAST_PAGE_KEY, RECENT_KEY, MAX_RECENT, RecentItem, FavItem } from "../hooks/useLocalStorage";
import "./Layout.css";

export default function Layout() {
  const [sitemap, setSitemap] = useState<SearchItem[]>([]);
  const [query, setQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== "undefined" ? window.matchMedia("(min-width: 900px)").matches : false);
  const [suggestions, setSuggestions] = useState<SearchItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFav, setIsFav] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLInputElement>(null);
  const suggestRef = useRef<HTMLUListElement>(null);

  // Load sitemap flat for search
  useEffect(() => {
    api.getSitemap().then((data) => {
      const flat: SearchItem[] = [];
      data.forEach((cat) => {
        cat.sections.forEach((sec) => {
          sec.pages.forEach((p) => {
            flat.push({
              category: cat.category,
              icon: cat.icon,
              title: sec.title,
              name: p.name,
              url: p.url,
            });
          });
        });
      });
      setSitemap(flat);
    });
  }, []);

  // Persist last page + fav detection
  useEffect(() => {
    localStorage.setItem(LAST_PAGE_KEY, location.pathname);
    const checkFav = () => {
      try {
        const favs: FavItem[] = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
        const cur = location.pathname;
        setIsFav(favs.some((f) => f.url === cur || f.url === window.location.href));
      } catch {
        setIsFav(false);
      }
    };
    checkFav();
  }, [location.pathname]);

  // Filter suggestions
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }
    const matched = sitemap.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
    );
    setSuggestions(matched);
    setActiveIndex(-1);
  }, [query, sitemap]);

  const saveRecent = (name: string, url: string) => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      let recent: RecentItem[] = raw ? JSON.parse(raw) : [];
      recent = recent.filter((r) => r.url !== url);
      recent.unshift({ name, url, time: Date.now() });
      recent = recent.slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
    } catch { /* ignore */ }
  };

  // Keep sidebar always open on desktop
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 900px)");
    const onChange = (e: MediaQueryListEvent) => {
      setSidebarOpen(e.matches);
    };
    // sync on mount (in case of resize before mount)
    if (mql.matches) setSidebarOpen(true);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const isDesktop = () => typeof window !== "undefined" && window.matchMedia("(min-width: 900px)").matches;

  const handleNav = (url: string, name?: string) => {
    // normalize url: sitemap urls are like /minecraft/... -> map to react routes
    // For now navigate directly; if url starts with "/" navigate there, else dashboard
    if (!isDesktop()) setSidebarOpen(false);
    setSearchActive(false);
    setQuery("");
    if (name) saveRecent(name, url);
    // ensure leading slash
    const path = url.startsWith("/") ? url : `/${url}`;
    // if route doesn't exist, still navigate — will show iframe-like fallback or 404
    navigate(path);
  };

  const toggleFav = () => {
    const curUrl = location.pathname;
    const curName =
      sitemap.find((s) => s.url === curUrl)?.name ?? curUrl;
    try {
      const raw = localStorage.getItem(FAV_KEY);
      let favs: FavItem[] = raw ? JSON.parse(raw) : [];
      const exists = favs.some((f) => f.url === curUrl);
      if (exists) {
        favs = favs.filter((f) => f.url !== curUrl);
      } else {
        favs.unshift({ name: curName, url: curUrl, time: Date.now() });
      }
      localStorage.setItem(FAV_KEY, JSON.stringify(favs));
      setIsFav(!exists);
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
      if (activeIndex >= 0) {
        const it = suggestions[activeIndex];
        handleNav(it.url, it.name);
      }
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

  // Group suggestions for rendering like original: category → title → pages
  const grouped = (() => {
    const tree: Record<string, { icon: string; titles: Record<string, SearchItem[]> }> = {};
    suggestions.forEach((i) => {
      if (!tree[i.category]) tree[i.category] = { icon: i.icon, titles: {} };
      if (!tree[i.category].titles[i.title]) tree[i.category].titles[i.title] = [];
      tree[i.category].titles[i.title].push(i);
    });
    return tree;
  })();

  let flatIndex = -1;

  return (
    <>
      <div id="topbar" className={searchActive ? "search-active" : ""}>
        <Link to="/" className="logo">
          <img src="/image/ks-logo.webp" alt="Logo" onError={(e) => ((e.currentTarget.style.display = "none"))} />
        </Link>
        <div className="owner-name">❰🔹❰❰ 𝑲𝑺 𝑾𝒂𝒓𝒓𝒊𝒐𝒓 ❱❱🔹❱</div>

        <div
          id="favButton"
          title={isFav ? "Remove from Favorites" : "Add to Favorites"}
          onClick={toggleFav}
          className={isFav ? "filled" : ""}
          aria-label="Favorite"
        >
          {isFav ? (
            <svg className="fav-svg" width="18" height="18" fill="#F5F5F5" stroke="#F5F5F5" strokeWidth={1} viewBox="0 0 24 24">
              <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.778 1.4 8.164L12 18.897l-7.334 3.855 1.4-8.164L.132 9.21l8.2-1.192z" />
            </svg>
          ) : (
            <svg className="fav-svg" width="18" height="18" fill="none" stroke="#F5F5F5" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.778 1.4 8.164L12 18.897l-7.334 3.855 1.4-8.164L.132 9.21l8.2-1.192z" />
            </svg>
          )}
        </div>

        <div id="control-right">
          <div className="search-container">
            <div
              id="searchTrigger"
              aria-label="Search"
              onClick={(e) => {
                e.stopPropagation();
                setSearchActive(true);
                setTimeout(() => searchRef.current?.focus(), 50);
              }}
            >
              <svg className="search-svg" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="6.8" fill="none" strokeWidth={1.8} strokeLinecap="round" />
                <line x1="16.2" y1="16.2" x2="20.4" y2="20.4" strokeWidth={1.8} strokeLinecap="round" />
              </svg>
            </div>
            <input
              id="searchBox"
              ref={searchRef}
              type="text"
              placeholder="Search pages..."
              aria-label="Search pages"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => setSearchActive(true)}
            />
          </div>

          <button id="hamburger" aria-label="Menu" onClick={() => { if (!isDesktop()) setSidebarOpen((o) => !o); }}>
            <svg className="menu-svg" viewBox="0 0 24 24" aria-hidden="true">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
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
          <li style={{ padding: "12px 18px" }}>No results found</li>
        ) : (
          Object.entries(grouped).map(([category, data]) => (
            <div key={category}>
              <li className="s-category">
                <span className="s-icon" dangerouslySetInnerHTML={{ __html: data.icon }} />
                <span>{category}</span>
              </li>
              {Object.entries(data.titles).map(([title, pages]) => (
                <div key={title}>
                  <li className="s-title">{title}</li>
                  {pages.map((p) => {
                    flatIndex++;
                    const idx = flatIndex;
                    return (
                      <li
                        key={`${p.category}-${p.title}-${p.name}`}
                        className={`s-page ${idx === activeIndex ? "active" : ""}`}
                        role="option"
                        onClick={() => handleNav(p.url, p.name)}
                      >
                        {p.name}
                      </li>
                    );
                  })}
                </div>
              ))}
            </div>
          ))
        )}
      </ul>

      <nav id="sidebar" aria-label="Main navigation" className={sidebarOpen ? "open" : ""}>
        <Link to="/dashboard" onClick={() => { if (!isDesktop()) setSidebarOpen(false); }}>Dashboard</Link>
        <Link to="/map" onClick={() => { if (!isDesktop()) setSidebarOpen(false); }}>Sites Map</Link>
        <Link to="/social" onClick={() => { if (!isDesktop()) setSidebarOpen(false); }}>Social Media</Link>
        <Link to="/about" onClick={() => { if (!isDesktop()) setSidebarOpen(false); }}>About</Link>
        <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <div style={{ padding: "6px 24px", fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Minecraft
          </div>
          <Link to="/minecraft/hosting/free" onClick={() => { if (!isDesktop()) setSidebarOpen(false); }}>Free Hosting</Link>
          <Link to="/minecraft/java/launcher" onClick={() => { if (!isDesktop()) setSidebarOpen(false); }}>Java Launcher</Link>
          <Link to="/minecraft/java/downloader" onClick={() => { if (!isDesktop()) setSidebarOpen(false); }}>Mod Downloader</Link>
          <Link to="/minecraft/bedrock/ks-client" onClick={() => { if (!isDesktop()) setSidebarOpen(false); }}>KS Client</Link>
          <div style={{ padding: "6px 24px", fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 8 }}>
            VPS
          </div>
          <Link to="/vps/hosting/free" onClick={() => { if (!isDesktop()) setSidebarOpen(false); }}>Free VPS List</Link>
        </div>
      </nav>

      <div id="content" className={sidebarOpen ? "sidebar-open" : ""}>
        <Outlet />
      </div>

      {sidebarOpen && !isDesktop() && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
    </>
  );
}
