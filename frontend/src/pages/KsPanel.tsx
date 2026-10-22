import { useNavigate } from "react-router-dom";
import PageHero from "../components/PageHero";
import "./About.css";

export default function KsPanel() {
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
          <PageHero
            variant="inline"
            icon="server"
            logoSrc="/image/ks-logo.webp"
            title="KS Panel"
            className="ab-page-hero"
          />
          <p className="ab-status-text">
            KS Panel is in development. This page will become the setup and
            usage guide once the panel is ready.
          </p>
          <div className="ab-actions">
            <button className="ab-btn primary" onClick={() => navigate("/map")}>
              Browse Map
            </button>
            <button
              className="ab-btn"
              onClick={() =>
                navigate("/minecraft/make-hosting/pterodactyl.html")
              }
            >
              Other Panel Guides
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
