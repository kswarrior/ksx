import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { RECENT_KEY, RecentItem, PinItem, readPins } from "../hooks/useLocalStorage";
import "./Dashboard.css";

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "Now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  if (s < 2592000) return Math.floor(s / 86400) + "d ago";
  return Math.floor(s / 2592000) + "mo ago";
}

type IconProps = { size?: number };

function PinIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 17v5" />
      <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
    </svg>
  );
}

function ClockIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function NewsIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 5h12v14H5a1 1 0 0 1-1-1z" />
      <path d="M16 9h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-3" />
      <path d="M7 9h6M7 12h6M7 15h4" />
    </svg>
  );
}

function SparklesIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" />
    </svg>
  );
}

function GlobeIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z" />
    </svg>
  );
}

function BotIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="8" width="16" height="12" rx="2" />
      <path d="M12 8V4" />
      <circle cx="9" cy="14" r="1" />
      <circle cx="15" cy="14" r="1" />
      <path d="M2 14h2M20 14h2" />
    </svg>
  );
}

type NewsItem = { title: string; desc: string; icon: ReactNode; gradient: string; color: string };

export default function Dashboard() {
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [pins, setPins] = useState<PinItem[]>([]);
  const [newsIndex, setNewsIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"));
      setPins(readPins());
    } catch {}
  }, []);

  const news: NewsItem[] = [
    { title: "KS Website 3.0", desc: "New glass UI, faster search and a lighter build — made for the whole KS ecosystem.", icon: <SparklesIcon size={22} />, gradient: "linear-gradient(135deg,#f5f5f5 0%,#9a9a9a 100%)", color: "#f5d76e" },
    { title: "Explore Everything", desc: "Minecraft, Hosting, VPS, Website tools & AI — all in one place.", icon: <GlobeIcon size={22} />, gradient: "linear-gradient(135deg,#d4d4d4 0%,#737373 100%)", color: "#7cc4ff" },
    { title: "KS Infinity AI", desc: "Your copilot for Minecraft, hosting & builds — ask anything.", icon: <BotIcon size={22} />, gradient: "linear-gradient(135deg,#a3a3a3 0%,#525252 100%)", color: "#c4a7ff" },
  ];

  useEffect(() => {
    if (news.length <= 1) return;
    const id = setInterval(() => setNewsIndex((i) => (i + 1) % news.length), 4200);
    return () => clearInterval(id);
  }, [news.length]);

  const recentTop = recent.slice(0, 3);

  return (
    <div className="dashboard">
      <section className="news news-3d">
        <div className="news-head">
          <div className="news-left"><h2><span className="panel-icon" style={{ color: "#f2c94c" }}><NewsIcon size={16} /></span> Updates & News</h2></div>
          <div className="news-controls">
            <button aria-label="Prev" onClick={() => setNewsIndex((i) => (i - 1 + news.length) % news.length)}>‹</button>
            <button aria-label="Next" onClick={() => setNewsIndex((i) => (i + 1) % news.length)}>›</button>
          </div>
        </div>
        <div className="news-viewport">
          <div className="news-track" style={{ transform: `translateX(-${newsIndex * 100}%)` }}>
            {news.map((n) => (
              <div key={n.title} className="news-slide">
                <div className="news-icon" style={{ background: n.gradient, color: n.color }}>{n.icon}</div>
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

      <section className="panel panel-3d panel-bare">
        <div className="panel-head">
          <h2><span className="panel-icon" style={{ color: "#ff6b6b" }}><PinIcon size={16} /></span> Pin</h2>
          <span className="panel-count">{pins.length}</span>
        </div>
        <div className="panel-body pin-grid">
          {pins.length === 0 ? (
            <div className="empty">
              <div className="empty-title">No pinned yet</div>
            </div>
          ) : (
            pins.map((item) => (
              <div key={item.url} className="list-item" onClick={() => navigate(item.url)}>
                {item.logo ? (
                  <span className="li-icon pin" dangerouslySetInnerHTML={{ __html: item.logo }} />
                ) : (
                  <span className="li-pin" aria-hidden>
                    <PinIcon size={14} />
                  </span>
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

      <section className="panel panel-3d panel-bare">
        <div className="panel-head">
          <h2><span className="panel-icon" style={{ color: "#9ecbff" }}><ClockIcon size={16} /></span> Recent</h2>
          <span className="panel-count">{recentTop.length}</span>
        </div>
        <div className="panel-body">
          {recentTop.length === 0 ? (
            <div className="empty">
              <div className="empty-title">No recent yet</div>
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
    </div>
  );
}
