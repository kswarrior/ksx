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

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches) return;
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
    { title: "KS Website 3.0", desc: "New glass UI, 3D hero, faster search — built for the whole KS ecosystem.", icon: "✨", gradient: "linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%)" },
    { title: "Explore Everything", desc: "Minecraft, Hosting, VPS, Website tools & AI — all in one place.", icon: "🌐", gradient: "linear-gradient(135deg,#06b6d4 0%,#3b82f6 100%)" },
    { title: "KS Infinity AI", desc: "Your copilot for Minecraft, hosting & builds — ask anything.", icon: "🤖", gradient: "linear-gradient(135deg,#ec4899 0%,#8b5cf6 100%)" },
  ];

  useEffect(() => {
    if (news.length <= 1) return;
    const id = setInterval(() => setNewsIndex((i) => (i + 1) % news.length), 4200);
    return () => clearInterval(id);
  }, [news.length]);

  const handleTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches) return;
    e.currentTarget.style.setProperty("--rx", "0deg");
    e.currentTarget.style.setProperty("--ry", "0deg");
  };

  const ecosystem = [
    { icon: "⛏️", title: "Minecraft", desc: "Hosting, launchers, mods & tools", href: "/minecraft/hosting/free", gradient: "linear-gradient(135deg,#3b82f6,#8b5cf6)" },
    { icon: "🌐", title: "Website", desc: "Guides, builds & resources", href: "/map", gradient: "linear-gradient(135deg,#06b6d4,#6366f1)" },
    { icon: "☁️", title: "Hosting", desc: "Free hosting for your projects", href: "/minecraft/hosting/free", gradient: "linear-gradient(135deg,#f59e0b,#ef4444)" },
    { icon: "🖥️", title: "VPS", desc: "Free VPS lists & setup help", href: "/vps/hosting/free", gradient: "linear-gradient(135deg,#10b981,#06b6d4)" },
    { icon: "🤖", title: "KS AI", desc: "Ask anything, build faster", href: "https://aixks.pages.dev", external: true, gradient: "linear-gradient(135deg,#6366f1,#ec4899)" },
  ];

  return (
    <div className="dashboard">
      {/* HERO - generic KS Warrior */}
      <section className="hero" ref={heroRef}>
        <div className="hero-bg" aria-hidden>
          <div className="hero-gradient" />
          <div className="orb orb1" style={{ transform: `translate3d(${mouse.x * 0.6}px, ${mouse.y * 0.6}px, 0)` }} />
          <div className="orb orb2" style={{ transform: `translate3d(${mouse.x * -0.4}px, ${mouse.y * -0.4}px, 0)` }} />
          <div className="orb orb3" style={{ transform: `translate3d(${mouse.x * 0.3}px, ${mouse.y * 0.3}px, 0)` }} />
          <div className="grid-floor" />
          <div className="stars" />
          <div className="cube cube-1" style={{ transform: `translate3d(${mouse.x * 0.8}px, ${mouse.y * 0.5}px, 0) rotateX(${mouse.y * 0.2}deg) rotateY(${mouse.x * 0.2}deg)` }}>
            <div className="cube-face front" /><div className="cube-face back" /><div className="cube-face right" /><div className="cube-face left" /><div className="cube-face top" /><div className="cube-face bottom" />
          </div>
          <div className="cube cube-2" style={{ transform: `translate3d(${mouse.x * -0.5}px, ${mouse.y * -0.3}px, 0) rotateX(${mouse.y * -0.15}deg) rotateY(${mouse.x * -0.15}deg)` }}>
            <div className="cube-face front" /><div className="cube-face back" /><div className="cube-face right" /><div className="cube-face left" /><div className="cube-face top" /><div className="cube-face bottom" />
          </div>
          <div className="cube cube-3"><div className="cube-face front" /><div className="cube-face back" /><div className="cube-face right" /><div className="cube-face left" /><div className="cube-face top" /><div className="cube-face bottom" /></div>
        </div>

        <div className="hero-content">
          <div className="hero-left">
            <div className="eyebrow"><span className="eyebrow-dot" />KS WARRIOR • CREATOR • HOSTING • VPS • AI<span className="eyebrow-pulse">LIVE</span></div>
            <h1 className="hero-title">
              <span className="t1">I am</span>
              <span className="t2">KS Warrior</span>
              <span className="t3">I Build Many Things</span>
              <span className="t-glow" aria-hidden>Many Things</span>
            </h1>
            <p className="hero-subtitle">
              Minecraft • Website • Hosting • VPS • AI — many builds, many tools, one place. Explore the whole KS ecosystem, not just servers.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => navigate("/map")}><span>Explore My Builds</span><i>→</i></button>
              <button className="btn btn-glass" onClick={() => window.open("https://aixks.pages.dev", "_blank")}><span>🤖</span> Try KS AI</button>
              <button className="btn btn-ghost" onClick={() => navigate("/about")}>About Me</button>
            </div>
            <div className="hero-badges">
              <div className="badge"><span className="badge-icon">⛏️</span> Minecraft</div>
              <div className="badge"><span className="badge-icon">🌐</span> Website</div>
              <div className="badge"><span className="badge-icon">☁️</span> Hosting</div>
              <div className="badge"><span className="badge-icon">🖥️</span> VPS</div>
              <div className="badge"><span className="badge-icon">🤖</span> AI</div>
            </div>
          </div>

          <div className="hero-stage-wrap">
            <div className="hero-stage" style={{ transform: `perspective(1200px) rotateY(${mouse.x * 0.45}deg) rotateX(${mouse.y * 0.45}deg)` }} onMouseMove={handleTilt} onMouseLeave={resetTilt}>
              <div className="stage-card stage-main" style={{ textAlign: "center", padding: "22px" }}>
                <div className="stage-tag">KS WARRIOR • WHOLE WEBSITE</div>
                <div style={{ fontSize: 32, margin: "10px 0" }}>🌌</div>
                <div className="stage-title" style={{ justifyContent: "center", fontSize: 15 }}>Minecraft • Website • Hosting • VPS • AI</div>
                <div className="stage-sub" style={{ justifyContent: "center", marginTop: 6 }}>Many builds, many tools — one KS hub</div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
                  <span style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", padding: "6px 10px", borderRadius: 999, fontSize: 11, fontWeight: 800 }}>⛏️ Minecraft</span>
                  <span style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", padding: "6px 10px", borderRadius: 999, fontSize: 11, fontWeight: 800 }}>🤖 AI</span>
                  <span style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)", padding: "6px 10px", borderRadius: 999, fontSize: 11, fontWeight: 800 }}>☁️ Hosting</span>
                </div>
                <div className="stage-glow" />
              </div>

              <div className="stage-card stage-secondary s1" onClick={() => navigate("/map")} style={{ cursor: "pointer" }}>
                <div className="s-icon" style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>🗺️</div>
                <div><div className="s-title">Explore Map</div><div className="s-sub">All my builds</div></div>
                <span className="s-arrow">↗</span>
              </div>

              <div className="stage-card stage-secondary s2" onClick={() => window.open("https://aixks.pages.dev", "_blank")} style={{ cursor: "pointer" }}>
                <div className="s-icon" style={{ background: "linear-gradient(135deg,#ec4899,#8b5cf6)" }}>✨</div>
                <div><div className="s-title">KS AI Hub</div><div className="s-sub">Build faster</div></div>
                <span className="s-arrow">↗</span>
              </div>

              <div className="stage-floating">
                <div className="float-pill"><span>⬢</span> Many Builds</div>
                <div className="float-pill secondary"><span>⬣</span> One Hub</div>
              </div>
            </div>
            <div className="stage-shadow" />
          </div>
        </div>
        <div className="hero-scroll" aria-hidden><span>SCROLL</span><i /></div>
      </section>

      {/* ECOSYSTEM - whole website, not server-specific */}
      <section className="section-head">
        <div>
          <div className="section-kicker">WHOLE WEBSITE</div>
          <h2 className="section-title">What I <span>Build & Share</span></h2>
        </div>
        <p className="section-desc">Not just Minecraft servers — website, hosting, VPS, AI and more. Pick what you need.</p>
      </section>

      <section className="features">
        {ecosystem.map((f) => (
          <div key={f.title} className="feature-card" onClick={() => (f as any).external ? window.open(f.href, "_blank") : navigate(f.href)} onMouseMove={handleTilt} onMouseLeave={resetTilt}>
            <div className="f-icon" style={{ background: f.gradient }}>{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
            <span className="f-arrow">Explore →</span>
            <div className="f-glow" style={{ background: f.gradient }} />
            <div className="f-shine" />
          </div>
        ))}
      </section>

      {/* NEWS - kept */}
      <section className="news news-3d">
        <div className="news-head">
          <div className="news-left"><h2>📰 News & Updates</h2><span>NEW</span><p>For the whole KS website</p></div>
          <div className="news-controls">
            <button aria-label="Prev" onClick={() => setNewsIndex((i) => (i - 1 + news.length) % news.length)}>‹</button>
            <button aria-label="Next" onClick={() => setNewsIndex((i) => (i + 1) % news.length)}>›</button>
          </div>
        </div>
        <div className="news-viewport">
          <div className="news-track" style={{ transform: `translateX(-${newsIndex * 100}%)` }}>
            {news.map((n) => (
              <div key={n.title} className="news-slide">
                <div className="news-icon" style={{ background: n.gradient }}>{n.icon}</div>
                <div className="news-body"><div className="news-title">{n.title}</div><div className="news-desc">{n.desc}</div></div>
                <div className="news-glow" style={{ background: n.gradient }} />
              </div>
            ))}
          </div>
        </div>
        <div className="news-footer">
          <div className="news-dots">{news.map((_, i) => (<button key={i} className={i === newsIndex ? "active" : ""} onClick={() => setNewsIndex(i)} aria-label={`Go to ${i}`} />))}</div>
          <div className="news-progress"><i style={{ width: `${((newsIndex + 1) / news.length) * 100}%` }} /></div>
        </div>
      </section>

      {/* RECENT & FAV - kept as user said ok */}
      <div className="grid">
        <section className="panel panel-3d" onMouseMove={handleTilt} onMouseLeave={resetTilt}>
          <div className="panel-head"><h2><span className="panel-icon">🕒</span> Recent</h2><span className="panel-count">{recent.length}</span></div>
          <div className="panel-body">
            {recent.length === 0 ? (
              <div className="empty"><div className="empty-icon">◌</div><div className="empty-title">No recent pages</div><div className="empty-sub">Pages you visit will appear here instantly</div><button className="empty-cta" onClick={() => navigate("/map")}>Browse Map</button></div>
            ) : (
              recent.map((item) => (
                <div key={item.url} className="list-item" onClick={() => navigate(item.url)}>
                  <span className="li-dot" /><span className="name">{item.name}</span><span className="time">{timeAgo(item.time)}</span><span className="li-arrow">→</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="panel panel-3d" onMouseMove={handleTilt} onMouseLeave={resetTilt}>
          <div className="panel-head"><h2><span className="panel-icon">⭐</span> Favourite</h2><span className="panel-count">{fav.length}</span></div>
          <div className="panel-body">
            {fav.length === 0 ? (
              <div className="empty"><div className="empty-icon">☆</div><div className="empty-title">No favourites yet</div><div className="empty-sub">Tap the ☆ on any page to pin it here</div><button className="empty-cta" onClick={() => navigate("/map")}>Explore Map</button></div>
            ) : (
              fav.map((item) => (
                <div key={item.url} className="list-item" onClick={() => navigate(item.url)}>
                  <span className="li-star">★</span><span className="name">{item.name}</span><span className="li-arrow">→</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* HIGHLIGHT - whole website, not server */}
      <section className="highlight-showcase" onMouseMove={handleTilt} onMouseLeave={resetTilt}>
        <div className="hs-bg" /><div className="hs-orb" />
        <div className="hs-content">
          <div className="hs-left">
            <div className="hs-badge"><span>✦</span> HIGHLIGHT • WHOLE WEBSITE</div>
            <h2>Everything from <em>KS Warrior</em> in one hub</h2>
            <p>Minecraft, website guides, hosting, VPS and AI — all my builds in one 3D home. Pick your path and start.</p>
            <div className="hs-actions">
              <button className="btn btn-primary" onClick={() => navigate("/map")}><span>Browse All Builds</span> <i>↗</i></button>
              <span className="hs-hint">Minecraft • Website • Hosting • VPS • AI</span>
            </div>
          </div>
          <div className="hs-visual">
            <div className="hs-card">
              <div className="hs-card-head"><i /><i /><i /><span>ks warrior hub</span></div>
              <div className="hs-lines"><span style={{ width: "88%" }} /><span style={{ width: "64%" }} /><span style={{ width: "92%" }} className="accent" /><span style={{ width: "72%" }} /></div>
              <div className="hs-bubble"><span>What did KS build today?</span></div>
              <div className="hs-bubble reply"><span>New hosting guide + AI update live!</span></div>
            </div>
            <div className="hs-glow" />
          </div>
        </div>
      </section>

      {/* FINAL CTA - generic */}
      <section className="cta-final" onMouseMove={handleTilt} onMouseLeave={resetTilt}>
        <div className="cta-bg" />
        <h2>Welcome to the KS Warrior hub</h2>
        <p>Many things, many builds — Minecraft, website, hosting, VPS & AI. This dashboard is your home.</p>
        <div className="cta-actions">
          <button className="btn btn-primary btn-lg" onClick={() => navigate("/map")}>Explore Builds <i>→</i></button>
          <button className="btn btn-glass" onClick={() => navigate("/about")}>About KS</button>
        </div>
      </section>
    </div>
  );
}
