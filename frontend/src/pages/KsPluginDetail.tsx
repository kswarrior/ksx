import { Link, useParams } from "react-router-dom";
import Icon from "../components/Icon";
import Markdown from "../components/Markdown";
import { getKsPlugin } from "./ksPluginsData";
import "./AppDashboard.css";

export default function KsPluginDetail() {
  const params = useParams();
  const slug = params.slug?.replace(/\.html$/, "");
  const plugin = getKsPlugin(slug);

  if (!plugin) {
    return (
      <div className="portal-page">
        <div className="portal-shell">
          <Link className="portal-back" to="/minecraft/make-server/ks-plugins">
            <Icon name="chevron-left" size={16} /> Back to KS Plugins
          </Link>
          <section className="portal-panel">
            <div className="portal-panel-head">
              <h2>
                <span className="portal-panel-icon" style={{ color: "#ff6b6b" }}>
                  <Icon name="warning" size={16} />
                </span>
                Plugin not found
              </h2>
            </div>
            <p style={{ color: "#a0a0a0", margin: 0 }}>
              The plugin you are looking for is not in the KS Plugins catalog.
            </p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-page">
      <div className="portal-shell">
        <Link className="portal-back" to="/minecraft/make-server/ks-plugins">
          <Icon name="chevron-left" size={16} /> Back to KS Plugins
        </Link>

        <section className="portal-release" aria-labelledby="ks-plugin-title">
          <div className="portal-release-head">
            <span className="portal-release-icon" aria-hidden="true" />
            <div className="portal-release-info">
              <div className="portal-release-top">
                <span className="portal-kicker">
                  <i aria-hidden="true" />
                  Latest release
                </span>
              </div>
              <h1 id="ks-plugin-title">
                {plugin.name} <span>v{plugin.version}</span>
              </h1>
              <p>{plugin.tagline}</p>
            </div>
          </div>

          <div className="portal-actions">
            <a
              className="portal-btn primary"
              href={plugin.downloadUrl}
              download
            >
              <Icon name="download" size={15} />
              {plugin.downloadLabel}
              <span className="portal-btn-version">v{plugin.version}</span>
            </a>
          </div>
        </section>

        <section className="portal-panel" aria-labelledby="ks-plugin-info-title">
          <div className="portal-panel-head">
            <h2 id="ks-plugin-info-title">
              <span className="portal-panel-icon" style={{ color: "#ff6b6b" }}>
                <Icon name="package" size={16} />
              </span>
              Plugin info
            </h2>
            <span className="portal-panel-count">{plugin.version}</span>
          </div>
          <div className="portal-info-grid">
            {plugin.details.map((detail) => (
              <div key={detail.label} className="portal-info-tile">
                <span className="portal-item-icon small">
                  <Icon name={detail.icon} size={14} />
                </span>
                <span className="portal-item-text">
                  <span className="name">{detail.label}</span>
                </span>
                <span className="portal-item-value">{detail.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="portal-panel portal-about" aria-labelledby="ks-plugin-about-title">
          <div className="portal-panel-head">
            <h2 id="ks-plugin-about-title">
              <span className="portal-panel-icon" style={{ color: "#86efac" }}>
                <Icon name="heart" size={16} />
              </span>
              About {plugin.name}
            </h2>
            <span className="portal-panel-count">v{plugin.version}</span>
          </div>
          <div className="portal-about-md">
            <Markdown source={plugin.markdown} />
          </div>
        </section>
      </div>
    </div>
  );
}
