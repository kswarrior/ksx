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
        <div className="ab-card">
          <div className="ab-status-code">404</div>
          <div className="ab-status-title">Page not found</div>
          <p className="ab-status-text">The URL you visited doesn’t exist. Check the map for available pages.</p>
          <div className="ab-actions">
            <Link to="/dashboard" className="ab-btn primary">Go to Dashboard</Link>
            <Link to="/map" className="ab-btn">Browse Map</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
