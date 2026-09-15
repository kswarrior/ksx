import { Link } from "react-router-dom";
import "./About.css";

export default function NotFound() {
  return (
    <div className="about-page">
      <div className="ab-bg" aria-hidden>
        <div className="ab-bg-grad" />
        <div className="ab-bg-orb o1" />
        <div className="ab-bg-orb o2" />
      </div>
      <div className="ab-shell">
        <header className="ab-header">
          <div className="ab-kicker"><span className="ab-kicker-dot" /> 404 • NOT FOUND</div>
          <h1 className="ab-title">404</h1>
          <p className="ab-sub">Page not found — check the map for available pages.</p>
        </header>
        <div className="ab-card">
          <div style={{fontSize:40, marginBottom:8}}>🔍</div>
          <div style={{fontWeight:900, marginBottom:6}}>Oops, missing page</div>
          <p style={{color:"var(--ab-muted)", fontSize:13}}>The URL you visited doesn’t exist.</p>
          <div className="ab-actions">
            <Link to="/dashboard" className="ab-btn primary">Go to Dashboard</Link>
            <Link to="/map" className="ab-btn">Browse Map</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
