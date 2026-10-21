import { useParams, useNavigate } from "react-router-dom";
import "./About.css";

export default function GenericPlaceholder() {
  const params = useParams();
  const path = window.location.pathname;
  const navigate = useNavigate();
  return (
    <div className="about-page">
      <div className="ab-bg" aria-hidden>
        <div className="ab-bg-grad" />
        <div className="ab-bg-orb o1" />
        <div className="ab-bg-orb o2" />
      </div>
      <div className="ab-shell">
        <div className="ab-card">
          <div className="ab-status-code">Soon</div>
          <div className="ab-status-title">Coming soon</div>
          <p className="ab-status-text">
            This page <code className="ab-code">{path}</code> is being migrated to React.
          </p>
          <pre className="ab-pre">
            {JSON.stringify(params, null, 2)}
          </pre>
          <div className="ab-actions">
            <button className="ab-btn primary" onClick={() => navigate("/map")}>Browse Map</button>
            <button className="ab-btn" onClick={() => navigate("/")}>Home</button>
          </div>
        </div>
      </div>
    </div>
  );
}
