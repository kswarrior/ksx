import { useEffect, useState } from "react";
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
  const navigate = useNavigate();

  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"));
      setFav(JSON.parse(localStorage.getItem(FAV_KEY) || "[]"));
    } catch {}
  }, []);

  const news: NewsItem[] = [
    { title: "KS Website 3.0", desc: "New glass UI, faster search and a lighter build — made for the whole KS ecosystem.", icon: "✨", gradient: "linear-gradient(135deg,#f5f5f5 0%,#9a9a9a 100%)" },
    { title: "Explore Everything", desc: "Minecraft, Hosting, VPS, Website tools & AI — all in one place.", icon: "🌐", gradient: "linear-gradient(135deg,#d4d4d4 0%,#737373 100%)" },
    { title: "KS Infinity AI", desc: "Your copilot for Minecraft, hosting & builds — ask anything.", icon: "🤖", gradient: "linear-gradient(135deg,#a3a3a3 0%,#525252 100%)" },
  ];

  useEffect(() => {
    if (news.length <= 1) return;
    const id = setInterval(() => setNewsIndex((i) => (i + 1) % news.length), 4200);
    return () => clearInterval(id);
  }, [news.length]);

  const recentTop = recent.slice(0, 3);

  return (
    <div className="dashboard">
      <div className="grid">
        <section className="panel panel-3d">
          <div className="panel-head">
            <h2><span className="panel-icon">🕒</span> Recent</h2>
            <span className="panel-count">{recentTop.length}</span>
          </div>
          <div className="panel-body">
            {recentTop.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">◌</div>
                <div className="empty-title">No recent pages</div>
                <div className="empty-sub">Pages you visit will appear here instantly</div>
                <button className="empty-cta" onClick={() => navigate("/map")}>Browse Map</button>
              </div>
            ) : (
              recentTop.map((item) => (
                <div key={item.url} className="list-item" onClick={() => navigate(item.url)}>
                  {item.logo ? (
                    <span className="li-icon" dangerouslySetInnerHTML={{ __html: item.logo }} />
                  ) : (
                    <span className="li-dot" />
                  )}
                  <span className="li-text">
                    <span className="name">{item.name}</span>
                    {(item.title || item.category) && (
                      <span className="li-sub">{[item.title, item.category].filter(Boolean).join(" • ")}</span>
                    )}
                  </span>
                  <span className="time">{timeAgo(item.time)}</span>
                  <span className="li-arrow">→</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="panel panel-3d">
          <div className="panel-head">
            <h2><span className="panel-icon">⭐</span> Pin</h2>
            <span className="panel-count">{fav.length}</span>
          </div>
          <div className="panel-body">
            {fav.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">☆</div>
                <div className="empty-title">No pinned pages</div>
                <div className="empty-sub">Tap the ☆ on any page to pin it here</div>
                <button className="empty-cta" onClick={() => navigate("/map")}>Explore Map</button>
              </div>
            ) : (
              fav.map((item) => (
                <div key={item.url} className="list-item" onClick={() => navigate(item.url)}>
                  {item.logo ? (
                    <span className="li-icon fav" dangerouslySetInnerHTML={{ __html: item.logo }} />
                  ) : (
                    <span className="li-star">★</span>
                  )}
                  <span className="li-text">
                    <span className="name">{item.name}</span>
                    {(item.title || item.category) && (
                      <span className="li-sub">{[item.title, item.category].filter(Boolean).join(" • ")}</span>
                    )}
                  </span>
                  <span className="li-arrow">→</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="news news-3d">
        <div className="news-head">
          <div className="news-left"><h2>📰 Updates & News</h2><span>NEW</span><p>For the whole KS website</p></div>
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

      <section className="highlight-showcase highlight-fixed">
        <div className="hs-bg" /><div className="hs-orb" />
        <div className="hs-content">
          <div className="hs-left">
            <div className="hs-badge"><span>✦</span> HIGHLIGHT • WHOLE WEBSITE</div>
            <h2>Everything from <em>KS Warrior</em> in one hub</h2>
            <p>Minecraft, website guides, hosting, VPS and AI — all my builds in one place. Pick your path and start.</p>
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
    </div>
  );
}
