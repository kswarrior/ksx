import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import Markdown from "../components/Markdown";
import lifesteadMarkdown from "./ks-lifestead.md?raw";
import pluginManagerMarkdown from "./ks-plugin-manager.md?raw";
import "./AppDashboard.css";

const LIFESTEAD_DOWNLOAD =
  "https://github.com/kswarrior/opencode/raw/refs/heads/main/ks-plugins/lifestead/release/plugin/KS-Lifestead-1.0.0.jar";
const PLUGIN_MANAGER_DOWNLOAD =
  "https://github.com/kswarrior/opencode/raw/refs/heads/main/ks-plugins/plugin-manager/release/plugin/KSPluginManager-1.0.0.jar";

export default function KsPlugins() {
  return (
    <div className="portal-page">
      <div className="portal-shell">
        <Link className="portal-back" to="/map">
          <Icon name="chevron-left" size={16} /> Back to Map
        </Link>

        <section className="portal-release" aria-labelledby="ks-plugins-title">
          <div className="portal-release-head">
            <span className="portal-release-icon" aria-hidden="true" />
            <div className="portal-release-info">
              <div className="portal-release-top">
                <span className="portal-kicker">
                  <i aria-hidden="true" />
                  Built by KS Warrior
                </span>
              </div>
              <h1 id="ks-plugins-title">
                KS Plugins <span>v1.0.0</span>
              </h1>
              <p>
                Minecraft server plugins built by KS Warrior. Each release is
                listed here with its features, supported versions and downloads.
              </p>
            </div>
          </div>
        </section>

        <section className="portal-panel" aria-labelledby="lifestead-title">
          <div className="portal-panel-head">
            <h2 id="lifestead-title">
              <span className="portal-panel-icon" style={{ color: "#ff6b6b" }}>
                <Icon name="heart" size={16} />
              </span>
              KS Lifestead
            </h2>
            <span className="portal-panel-count">v1.0.0</span>
          </div>
          <div className="portal-release-head" style={{ marginBottom: 12 }}>
            <span className="portal-release-icon" aria-hidden="true" />
            <div className="portal-release-info">
              <p>
                KS Lifestead is a Spigot-API plugin for Minecraft Java Edition
                1.21.11. It turns player deaths into a heart economy: players
                steal hearts in PvP, lose hearts on death, can withdraw and
                deposit hearts as items, and are eliminated at zero hearts until
                someone revives them.
              </p>
              <div className="portal-actions" style={{ marginTop: 12 }}>
                <a
                  className="portal-btn primary"
                  href={LIFESTEAD_DOWNLOAD}
                  download
                >
                  <Icon name="download" size={15} />
                  Download JAR
                  <span className="portal-btn-version">v1.0.0</span>
                </a>
              </div>
            </div>
          </div>
          <div className="portal-about-md">
            <Markdown source={lifesteadMarkdown} />
          </div>
        </section>

        <section className="portal-panel" aria-labelledby="plugin-manager-title">
          <div className="portal-panel-head">
            <h2 id="plugin-manager-title">
              <span className="portal-panel-icon" style={{ color: "#7dd3fc" }}>
                <Icon name="puzzle" size={16} />
              </span>
              KS Plugin Manager
            </h2>
            <span className="portal-panel-count">v1.0.0</span>
          </div>
          <div className="portal-release-head" style={{ marginBottom: 12 }}>
            <span className="portal-release-icon" aria-hidden="true" />
            <div className="portal-release-info">
              <p>
                Runtime plugin manager for Paper/Spigot/Bukkit. Load, unload,
                reload, enable, disable, download from raw URLs, check and apply
                updates, and fully remove plugins without restarting the server
                (best-effort).
              </p>
              <div className="portal-actions" style={{ marginTop: 12 }}>
                <a
                  className="portal-btn primary"
                  href={PLUGIN_MANAGER_DOWNLOAD}
                  download
                >
                  <Icon name="download" size={15} />
                  Download JAR
                  <span className="portal-btn-version">v1.0.0</span>
                </a>
              </div>
            </div>
          </div>
          <div className="portal-about-md">
            <Markdown source={pluginManagerMarkdown} />
          </div>
        </section>
      </div>
    </div>
  );
}
