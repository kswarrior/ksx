import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import PageHero from "../components/PageHero";
import { KS_PLUGINS } from "./ksPluginsData";
import "./Store.css";
import "./KsPlugins.css";

export default function KsPlugins() {
  return (
    <div className="store-page ks-plugins-page">
      <div className="store-bg" aria-hidden>
        <div className="store-bg-glow g1" />
        <div className="store-bg-glow g2" />
        <div className="store-bg-grid" />
      </div>

      <div className="store-shell">
        <header className="store-header">
          <PageHero
            variant="inline"
            icon="puzzle"
            kicker="KS Plugins · Minecraft"
            title="KS Plugins"
            subtitle="Minecraft server plugins built by KS Warrior. Browse the catalog and open a plugin for its full details and download."
          />
        </header>

        <section className="store-catalog" aria-labelledby="ks-plugins-catalog-title">
          <div className="store-section-head">
            <h2 id="ks-plugins-catalog-title">All plugins</h2>
            <span>{KS_PLUGINS.length}</span>
          </div>

          <div className="store-grid">
            {KS_PLUGINS.map((plugin) => (
              <Link
                key={plugin.slug}
                className="store-card"
                to={`/minecraft/make-server/ks-plugins/${plugin.slug}`}
              >
                <div className="store-card-top">
                  <span className="store-card-icon ks-plugin-blank-icon" aria-hidden="true" />
                  <div className="store-card-info">
                    <h3>{plugin.name}</h3>
                    <p className="store-card-dev">{plugin.owner}</p>
                  </div>
                </div>

                <p className="ks-plugin-tagline">{plugin.tagline}</p>

                <ul className="ks-plugin-tags" aria-label="Tags">
                  {plugin.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>

                <dl className="store-card-facts">
                  {plugin.details.slice(0, 4).map((detail) => (
                    <div key={detail.label}>
                      <dt>{detail.label}</dt>
                      <dd>{detail.value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="store-card-footer">
                  <span className="store-card-downloads">
                    <Icon name="chevron-right" size={13} />
                    View details
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
