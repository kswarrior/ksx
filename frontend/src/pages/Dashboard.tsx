import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FAV_KEY, RECENT_KEY, RecentItem, FavItem } from "../hooks/useLocalStorage";
import "./Dashboard.css";

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "Now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  if (s < 2592000) return Math.floor(s / 86400) + "d ago";
  return Math.floor(s / 2592000) + "mo ago";
}

type NewsItem = { title: string; desc: string; icon: string; gradient: string };
type Feature = { icon: string; title: string; desc: string; href: string; external?: boolean; gradient: string; badge?: string };

export default function Dashboard() {
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [fav, setFav] = useState<FavItem[]>([]);
  const [newsIndex, setNewsIndex] = useState(0);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"));
      setFav(JSON.parse(localStorage.getItem(FAV_KEY) || "[]"));
    } catch {}
  }, []);

  // 3D mouse parallax for hero
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 18;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * -18;
      setMouse({ x, y });
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  const news: NewsItem[] = [
    { title: "KS Website 3.0", desc: "Next-gen glass UI, instant search & 3D experience shipped.", icon: "✨", gradient: "linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%)" },
    { title: "Free Hosting Upgraded", desc: "Paper 1.21.1 • Purpur • Fabric — one click deploy.", icon: "🚀", gradient: "linear-gradient(135deg,#06b6d4 0%,#3b82f6 100%)" },
    { title: "KS Infinity AI Live", desc: "Ask AI for plugins, configs & server optimization.", icon: "🤖", gradient: "linear-gradient(135deg,#ec4899 0%,#8b5cf6 100%)" },
  ];

  const features: Feature[] = [
    { icon: "⛏️", title: "Free MC Hosting", desc: "Paper, Spigot, Fabric, Forge — deploy in seconds.", href: "/minecraft/hosting/free", gradient: "linear-gradient(135deg,#3b82f6,#8b5cf6)", badge: "Popular" },
    { icon: "⚙️", title: "Pterodactyl Panel", desc: "Industry panel with KS optimized eggs & flags.", href: "/minecraft/make-hosting/pterodactyl", gradient: "linear-gradient(135deg,#06b6d4,#6366f1)" },
    { icon: "🛰️", title: "Free VPS List", desc: "Curated free VPS nodes for your network.", href: "/vps/hosting/free", gradient: "linear-gradient(135deg,#f59e0b,#ef4444)" },
    { icon: "☕", title: "Java Launcher", desc: "Lightweight • All versions • Mods & shaders.", href: "/minecraft/java/launcher", gradient: "linear-gradient(135deg,#10b981,#06b6d4)" },
    { icon: "📦", title: "Mod Downloader", desc: "One-click Fabric/Forge mod & plugin fetcher.", href: "/minecraft/java/downloader", gradient: "linear-gradient(135deg,#ec4899,#8b5cf6)" },
    { icon: "🧠", title: "KS Infinity AI", desc: "Your Minecraft DevOps copilot — 24/7.", href: "https://aixks.pages.dev", external: true, gradient: "linear-gradient(135deg,#6366f1,#ec4899)", badge: "New" },
  ];

  const stats = [
    { k: "50K+", v: "Servers Deployed", sub: "and counting", icon: "🖥️" },
    { k: "120K+", v: "Daily Players", sub: "global network", icon: "🌍" },
    { k: "99.95%", v: "Uptime SLA", sub: "monitored", icon: "⚡" },
    { k: "4.9★", v: "Community Love", sub: "12k reviews", icon: "💎" },
  ];

  useEffect(() => {
    if (news.length <= 1) return;
    const id = setInterval(() => setNewsIndex((i) => (i + 1) % news.length), 4200);
    return () => clearInterval(id);
  }, [news.length]);

  const handleTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rx = ((y / rect.height) - 0.5) * -10;
    const ry = ((x / rect.width) - 0.5) * 12;
    el.style.setProperty("--rx", `${rx}deg`);
    el.style.setProperty("--ry", `${ry}deg`);
    el.style.setProperty("--mx", `${(x / rect.width) * 100}%`);
    el.style.setProperty("--my", `${(y / rect.height) * 100}%`);
  };
  const resetTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty("--rx", "0deg");
    e.currentTarget.style.setProperty("--ry", "0deg");
  };

  const handleFeatureClick = (f: Feature) => {
    if (f.external) window.open(f.href, "_blank");
    else navigate(f.href);
  };

  return (
    <div className="dashboard">
      {/* ================= HERO 3D ================= */}
      <section className="hero" ref={heroRef}>
        <div className="hero-bg" aria-hidden>
          <div className="hero-gradient" />
          <div className="orb orb1" style={{ transform: `translate3d(${mouse.x * 0.6}px, ${mouse.y * 0.6}px, 0)` }} />
          <div className="orb orb2" style={{ transform: `translate3d(${mouse.x * -0.4}px, ${mouse.y * -0.4}px, 0)` }} />
          <div className="orb orb3" style={{ transform: `translate3d(${mouse.x * 0.3}px, ${mouse.y * 0.3}px, 0)` }} />
          <div className="grid-floor" />
          <div className="stars" />
          {/* CSS 3D Cubes */}
          <div className="cube cube-1" style={{ transform: `translate3d(${mouse.x * 0.8}px, ${mouse.y * 0.5}px, 0) rotateX(${mouse.y * 0.2}deg) rotateY(${mouse.x * 0.2}deg)` }}>
            <div className="cube-face front" />
            <div className="cube-face back" />
            <div className="cube-face right" />
            <div className="cube-face left" />
            <div className="cube-face top" />
            <div className="cube-face bottom" />
          </div>
          <div className="cube cube-2" style={{ transform: `translate3d(${mouse.x * -0.5}px, ${mouse.y * -0.3}px, 0) rotateX(${mouse.y * -0.15}deg) rotateY(${mouse.x * -0.15}deg)` }}>
            <div className="cube-face front" />
            <div className="cube-face back" />
            <div className="cube-face right" />
            <div className="cube-face left" />
            <div className="cube-face top" />
            <div className="cube-face bottom" />
          </div>
          <div className="cube cube-3">
            <div className="cube-face front" />
            <div className="cube-face back" />
            <div className="cube-face right" />
            <div className="cube-face left" />
            <div className="cube-face top" />
            <div className="cube-face bottom" />
          </div>
        </div>

        <div className="hero-content">
          <div className="hero-left">
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              KS WARRIOR • MINECRAFT ECOSYSTEM
              <span className="eyebrow-pulse">LIVE</span>
            </div>

            <h1 className="hero-title">
              <span className="t1">Build Your</span>
              <span className="t2">Minecraft</span>
              <span className="t3">Universe</span>
              <span className="t-glow" aria-hidden>Universe</span>
            </h1>

            <p className="hero-subtitle">
              Free hosting, pro VPS, Java tools & AI — everything you need to launch, scale and monetize your server. Crafted for creators, optimized for performance.
            </p>

            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => navigate("/minecraft/hosting/free")}>
                <span>Explore Hosting</span>
                <i>→</i>
              </button>
              <button className="btn btn-glass" onClick={() => navigate("/minecraft/java/launcher")}>
                <span>☕</span> Get Launcher
              </button>
              <button className="btn btn-ghost" onClick={() => navigate("/map")}>
                Sites Map
              </button>
            </div>

            <div className="hero-badges">
              <div className="badge"><span className="badge-icon">🛡️</span> DDoS Protected</div>
              <div className="badge"><span className="badge-icon">⚡</span> Instant Deploy</div>
              <div className="badge"><span className="badge-icon">💜</span> Loved by 50K+ Admins</div>
            </div>
          </div>

          <div className="hero-stage-wrap">
            <div
              className="hero-stage"
              style={{ transform: `perspective(1200px) rotateY(${mouse.x * 0.45}deg) rotateX(${mouse.y * 0.45}deg)` }}
              onMouseMove={handleTilt}
              onMouseLeave={resetTilt}
            >
              <div className="stage-card stage-main">
                <div className="stage-tag">PTERODACTYL • KS-01</div>
                <div className="stage-head">
                  <div className="stage-icon">⛏️</div>
                  <div>
                    <div className="stage-title">survival.ks warrior.net</div>
                    <div className="stage-sub">Paper 1.21.1 • 8GB • 64ms</div>
                  </div>
                  <span className="stage-live">● LIVE</span>
                </div>
                <div className="stage-bars">
                  <div className="bar"><span style={{ width: "78%" }} /></div>
                  <div className="bar"><span style={{ width: "54%" }} /></div>
                  <div className="bar"><span style={{ width: "92%" }} /></div>
                </div>
                <div className="stage-players">
                  <div className="avatars">
                    <i style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)" }}>A</i>
                    <i style={{ background: "linear-gradient(135deg,#ec4899,#f59e0b)" }}>K</i>
                    <i style={{ background: "linear-gradient(135deg,#10b981,#06b6d4)" }}>S</i>
                    <span>+2.4k</span>
                  </div>
                  <div className="stage-cta">Join Server →</div>
                </div>
                <div className="stage-glow" />
              </div>

              <div className="stage-card stage-secondary s1">
                <div className="s-icon" style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>⚡</div>
                <div>
                  <div className="s-title">VPS Turbo</div>
                  <div className="s-sub">AMD EPYC • 16GB</div>
                </div>
                <span className="s-arrow">↗</span>
              </div>

              <div className="stage-card stage-secondary s2">
                <div className="s-icon" style={{ background: "linear-gradient(135deg,#ec4899,#8b5cf6)" }}>🤖</div>
                <div>
                  <div className="s-title">KS AI Assistant</div>
                  <div className="s-sub">Ask anything</div>
                </div>
                <span className="s-arrow">↗</span>
              </div>

              <div className="stage-floating">
                <div className="float-pill"><span>⬢</span> 127 Plugins Ready</div>
                <div className="float-pill secondary"><span>⬣</span> Java 8-21</div>
              </div>
            </div>

            <div className="stage-shadow" />
          </div>
        </div>

        <div className="hero-scroll" aria-hidden>
          <span>SCROLL</span><i />
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="stats-strip">
        {stats.map((s) => (
          <div key={s.v} className="stat" onMouseMove={handleTilt} onMouseLeave={resetTilt}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-body">
              <div className="stat-k">{s.k}</div>
              <div className="stat-v">{s.v}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </section>

      {/* ================= FEATURES ================= */}
      <section className="section-head">
        <div>
          <div className="section-kicker">EXPLORE ECOSYSTEM</div>
          <h2 className="section-title">Everything to <span>power your world</span></h2>
        </div>
        <p className="section-desc">From free hosting to pro VPS and AI — pick what you need, scale when you grow.</p>
      </section>

      <section className="features">
        {features.map((f) => (
          <div
            key={f.title}
            className="feature-card"
            onClick={() => handleFeatureClick(f)}
            onMouseMove={handleTilt}
            onMouseLeave={resetTilt}
          >
            {f.badge && <span className="f-badge">{f.badge}</span>}
            <div className="f-icon" style={{ background: f.gradient }}>{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
            <span className="f-arrow">Explore →</span>
            <div className="f-glow" style={{ background: f.gradient }} />
            <div className="f-shine" />
          </div>
        ))}
      </section>

      {/* ================= NEWS 3D ================= */}
      <section className="news news-3d">
        <div className="news-head">
          <div className="news-left">
            <h2>📰 Updates & News</h2>
            <span>NEW</span>
            <p>Changelog • Features • Drops</p>
          </div>
          <div className="news-controls">
            <button aria-label="Prev" onClick={() => setNewsIndex((i) => (i - 1 + news.length) % news.length)}>‹</button>
            <button aria-label="Next" onClick={() => setNewsIndex((i) => (i + 1) % news.length)}>›</button>
          </div>
        </div>

        <div className="news-viewport">
          <div className="news-track" style={{ transform: `translateX(-${newsIndex * 100}%)` }}>
            {news.map((n) => (
              <div key={n.title} className="news-slide" style={{ ["--g" as string]: n.gradient } as React.CSSProperties}>
                <div className="news-icon" style={{ background: n.gradient }}>{n.icon}</div>
                <div className="news-body">
                  <div className="news-title">{n.title}</div>
                  <div className="news-desc">{n.desc}</div>
                </div>
                <div className="news-glow" style={{ background: n.gradient }} />
              </div>
            ))}
          </div>
        </div>

        <div className="news-footer">
          <div className="news-dots">
            {news.map((_, i) => (
              <button key={i} className={i === newsIndex ? "active" : ""} onClick={() => setNewsIndex(i)} aria-label={`Go to ${i}`} />
            ))}
          </div>
          <div className="news-progress">
            <i style={{ width: `${((newsIndex + 1) / news.length) * 100}%` }} />
          </div>
        </div>
      </section>

      {/* ================= RECENT & FAV ================= */}
      <div className="grid">
        <section className="panel panel-3d" onMouseMove={handleTilt} onMouseLeave={resetTilt}>
          <div className="panel-head">
            <h2><span className="panel-icon">🕒</span> Recent</h2>
            <span className="panel-count">{recent.length}</span>
          </div>
          <div className="panel-body">
            {recent.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">◌</div>
                <div className="empty-title">No recent pages</div>
                <div className="empty-sub">Pages you visit will appear here instantly</div>
                <button className="empty-cta" onClick={() => navigate("/map")}>Browse Map</button>
              </div>
            ) : (
              recent.map((item) => (
                <div key={item.url} className="list-item" onClick={() => navigate(item.url)}>
                  <span className="li-dot" />
                  <span className="name">{item.name}</span>
                  <span className="time">{timeAgo(item.time)}</span>
                  <span className="li-arrow">→</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="panel panel-3d" onMouseMove={handleTilt} onMouseLeave={resetTilt}>
          <div className="panel-head">
            <h2><span className="panel-icon">⭐</span> Favourite</h2>
            <span className="panel-count">{fav.length}</span>
          </div>
          <div className="panel-body">
            {fav.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">☆</div>
                <div className="empty-title">No favourites yet</div>
                <div className="empty-sub">Tap the ☆ on any page to pin it here</div>
                <button className="empty-cta" onClick={() => navigate("/minecraft/hosting/free")}>Explore Hosting</button>
              </div>
            ) : (
              fav.map((item) => (
                <div key={item.url} className="list-item" onClick={() => navigate(item.url)}>
                  <span className="li-star">★</span>
                  <span className="name">{item.name}</span>
                  <span className="li-arrow">→</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* ================= HIGHLIGHT ================= */}
      <section className="highlight-showcase" onMouseMove={handleTilt} onMouseLeave={resetTilt}>
        <div className="hs-bg" />
        <div className="hs-orb" />
        <div className="hs-content">
          <div className="hs-left">
            <div className="hs-badge"><span>✦</span> FEATURED • KS INFINITY</div>
            <h2>Meet <em>KS ∞ AI</em> — your Minecraft copilot</h2>
            <p>Generate configs, debug plugins, optimize TPS, write Skripts — all via chat. Trained on the KS ecosystem.</p>
            <div className="hs-actions">
              <button className="btn btn-primary" onClick={() => window.open("https://aixks.pages.dev", "_blank")}>
                <span>Launch KS AI</span> <i>↗</i>
              </button>
              <span className="hs-hint">Free • No signup • Instant</span>
            </div>
          </div>
          <div className="hs-visual">
            <div className="hs-card">
              <div className="hs-card-head">
                <i /><i /><i />
                <span>aixks.pages.dev</span>
              </div>
              <div className="hs-lines">
                <span style={{ width: "88%" }} />
                <span style={{ width: "64%" }} />
                <span style={{ width: "92%" }} className="accent" />
                <span style={{ width: "72%" }} />
              </div>
              <div className="hs-bubble">
                <span>How to reduce MSPT on Paper 1.21?</span>
              </div>
              <div className="hs-bubble reply">
                <span>Enable chunk system tweaks & use this spark profile...</span>
              </div>
            </div>
            <div className="hs-glow" />
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="cta-final" onMouseMove={handleTilt} onMouseLeave={resetTilt}>
        <div className="cta-bg" />
        <h2>Ready to launch your world?</h2>
        <p>Join thousands of creators running on KS Warrior. Free to start, pro when you need it.</p>
        <div className="cta-actions">
          <button className="btn btn-primary btn-lg" onClick={() => navigate("/minecraft/hosting/free")}>Start Hosting Free <i>→</i></button>
          <button className="btn btn-glass" onClick={() => navigate("/vps/hosting/free")}>View VPS List</button>
        </div>
      </section>
    </div>
  );
}
