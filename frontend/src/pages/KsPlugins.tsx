import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import "./About.css";

export default function KsPlugins() {
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
            icon="puzzle"
            logoSrc="/image/ks-logo.webp"
            kicker="Built by KS Warrior"
            title="KS Plugins"
            className="ab-page-hero"
          />
          <p className="ab-status-text">
            KS Plugins is the home for Minecraft server plugins made by KS
            Warrior himself. Each release will be listed here with its features,
            supported versions and a direct download once it is ready.
          </p>
          <div className="ab-actions">
            <Link to="/map" className="ab-btn primary">
              Browse Map
            </Link>
            <Link
              to="/minecraft/make-server/paid-plugin-free.html"
              className="ab-btn"
            >
              Free Paid Plugins
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
