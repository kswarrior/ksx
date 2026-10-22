import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Icon from "../components/Icon";
import { TextField } from "../components/ui";
import "./ServerInfo.css";

type McStatus = {
  online?: boolean;
  ip?: string;
  port?: number;
  hostname?: string;
  version?: string;
  protocol?: { version?: number; name?: string };
  players?: { online?: number; max?: number; list?: string[] };
  motd?: { clean?: string[]; raw?: string[] };
  icon?: string;
  software?: string;
  plugins?: unknown[];
  mods?: unknown[];
  eula_blocked?: boolean;
  debug?: { query?: boolean; bedrock?: boolean; srv?: boolean };
};

function decodeMotd(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/g, "'");
}

function buildStats(data: McStatus) {
  const stats: { label: string; value: string }[] = [];
  const players = data.players;
  if (players?.online !== undefined || players?.max !== undefined) {
    stats.push({ label: "Players", value: `${players?.online ?? "—"} / ${players?.max ?? "—"}` });
  }
  const version = data.version || data.protocol?.name;
  if (version) stats.push({ label: "Version", value: version });
  if (data.protocol?.version !== undefined && data.protocol.version !== -1) {
    stats.push({ label: "Protocol", value: String(data.protocol.version) });
  }
  if (data.ip) stats.push({ label: "IP", value: data.ip });
  if (data.port !== undefined) stats.push({ label: "Port", value: String(data.port) });
  if (data.hostname) stats.push({ label: "Hostname", value: data.hostname });
  if (data.software) stats.push({ label: "Software", value: data.software });
  if (data.plugins?.length) stats.push({ label: "Plugins", value: String(data.plugins.length) });
  if (data.mods?.length) stats.push({ label: "Mods", value: String(data.mods.length) });
  if (data.debug?.bedrock) stats.push({ label: "Edition", value: "Bedrock" });
  if (data.eula_blocked !== undefined) {
    stats.push({ label: "EULA Blocked", value: data.eula_blocked ? "Yes" : "No" });
  }
  return stats;
}

export default function ServerInfo() {
  const [searchParams] = useSearchParams();
  const initialIp = (searchParams.get("ip") ?? "").trim();
  const [ip, setIp] = useState(initialIp);
  const [data, setData] = useState<McStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoChecked = useRef(false);

  async function fetchInfo(target?: string) {
    const value = (target ?? ip).trim();
    if (!value) {
      setError("Please enter a server IP.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(value)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as McStatus;
      setData(json);
    } catch {
      setError("Failed to fetch server information. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (autoChecked.current || !initialIp) return;
    autoChecked.current = true;
    void fetchInfo(initialIp);
  }, [initialIp]);

  const online = data ? Boolean(data.online) : false;
  const name = data?.hostname || data?.ip || ip.trim() || "Minecraft Server";
  const icon = data?.icon?.startsWith("data:image/") ? data.icon : null;
  const motdLines = (data?.motd?.clean ?? []).map(decodeMotd);
  const stats = data ? buildStats(data) : [];

  return (
    <div className="si-page">
      <div className="si-bg" aria-hidden>
        <div className="si-bg-grad" />
        <div className="si-bg-orb o1" />
        <div className="si-bg-orb o2" />
      </div>
      <div className="si-shell">
        <header className="si-header">
          <div className="si-search">
            <TextField className="si-input" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="Enter server IP (e.g. play.hypixel.net)" aria-label="Server IP" onKeyDown={(e)=> e.key==="Enter" && fetchInfo()} />
            <button className="si-btn" onClick={() => fetchInfo()}><Icon name="search" size={14} /> {loading ? "Checking…" : "Search"}</button>
          </div>
        </header>

        {error && !loading && (
          <div className="si-card si-state si-error"><Icon name="warning" size={16} /> {error}</div>
        )}

        {data && (
          <>
            <section className={`si-server-card ${online ? "is-online" : "is-offline"}`}>
              <div className="si-server-top">
                <div className="si-avatar">
                  {icon ? <img src={icon} alt={`${name} icon`} /> : <span>{name.slice(0, 2).toUpperCase()}</span>}
                </div>
                <div className="si-server-scroll">
                  <div className="si-identity">
                    <div className="si-name-row">
                      <h2 className="si-name" title={name}>{name}</h2>
                      <span className="si-badge">{online ? "Online" : "Offline"}</span>
                    </div>
                    <div className="si-motd">
                      {motdLines.length > 0
                        ? motdLines.map((line, index) => (
                            <span className="si-motd-line" key={index}>{line || "\u00A0"}</span>
                          ))
                        : <span className="si-motd-line si-motd-empty">No MOTD available</span>}
                    </div>
                  </div>
                </div>
              </div>
              {!online && (
                <p className="si-offline-note"><Icon name="warning" size={13} /> This server is offline or unreachable right now.</p>
              )}
            </section>

            {stats.length > 0 && (
              <section className="si-info">
                <h3 className="si-section-title"><Icon name="sliders" size={14} /> Server Information</h3>
                <div className="si-grid">
                  {stats.map((stat) => (
                    <div className="si-stat" key={stat.label}>
                      <b>{stat.label}</b>
                      <span title={stat.value}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {!data && !loading && !error && (
          <div className="si-card si-state">
            <div className="si-state-icon"><Icon name="search" size={22} /></div>
            <div className="si-state-title">No query yet</div>
            <div>Enter a server IP above to see live stats. Example: play.cubecraft.net</div>
          </div>
        )}

        {loading && !data && (
          <div className="si-card si-state">
            <div className="si-state-icon"><Icon name="search" size={22} /></div>
            <div className="si-state-title">Checking server…</div>
            <div>Fetching live status, MOTD and player counts.</div>
          </div>
        )}
      </div>
    </div>
  );
}
