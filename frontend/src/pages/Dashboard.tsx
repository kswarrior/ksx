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

export default function Dashboard() {
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [fav, setFav] = useState<FavItem[]>([]);
  const [newsIndex, setNewsIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"));
      setFav(JSON.parse(localStorage.getItem(FAV_KEY) || "[]"));
    } catch { /* ignore */ }
  }, []);

  const news = [
    { title: "KS Website", desc: "Optimised and modify also add new things" },
    { title: "Minecraft Hosting", desc: "Minecraft free hosting list updated & upgraded" },
    { title: "Fast Loading", desc: "Optimized dashboard responsiveness" },
  ];

  useEffect(() => {
    if (news.length <= 1) return;
    const id = setInterval(() => setNewsIndex((i) => (i + 1) % news.length), 4000);
    return () => clearInterval(id);
  }, [news.length]);

  return (
    <div className="dashboard">
      <section className="news">
        <div className="news-header">📰 Updates & News <span>NEW</span></div>
        <div className="news-slider">
          <div className="news-track" style={{ transform: `translateX(-${newsIndex * 100}%)` }}>
            {news.map((n) => (
              <div key={n.title} className="news-slide">
                <div className="news-title">{n.title}</div>
                <div className="news-desc">{n.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="news-dots">
          {news.map((_, i) => (
            <i key={i} className={i === newsIndex ? "active" : ""} />
          ))}
        </div>
      </section>

      <div className="grid">
        <section className="panel">
          <h2>Recent</h2>
          <div>
            {recent.length === 0 ? (
              <div className="empty">No data</div>
            ) : (
              recent.map((item) => (
                <div key={item.url} className="list-item" onClick={() => navigate(item.url)}>
                  <span className="name">{item.name}</span>
                  <span className="time">{timeAgo(item.time)}</span>
                </div>
              ))
            )}
          </div>
        </section>
        <section className="panel">
          <h2>Favourite</h2>
          <div>
            {fav.length === 0 ? (
              <div className="empty">No data</div>
            ) : (
              fav.map((item) => (
                <div key={item.url} className="list-item" onClick={() => navigate(item.url)}>
                  <span className="name">{item.name}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="panel">
        <h2>Highlighted</h2>
        <div className="highlight-slider">
          <div className="highlight-track">
            <div className="h-card" onClick={() => window.open("https://aixks.pages.dev", "_blank")}>
              𝑲𝑺 ∞ 𝑨𝑰<span>KS Artificial Intelligent [AI]</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
