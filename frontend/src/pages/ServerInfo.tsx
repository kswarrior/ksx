import { useEffect, useRef, useState, type CSSProperties } from "react";
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

const MC_COLORS: Record<string, string> = {
  "0": "#000000",
  "1": "#0000aa",
  "2": "#00aa00",
  "3": "#00aaaa",
  "4": "#aa0000",
  "5": "#aa00aa",
  "6": "#ffaa00",
  "7": "#aaaaaa",
  "8": "#555555",
  "9": "#5555ff",
  a: "#55ff55",
  b: "#55ffff",
  c: "#ff5555",
  d: "#ff55ff",
  e: "#ffff55",
  f: "#ffffff",
};

type MotdSegment = {
  text: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  obfuscated?: boolean;
};

function parseMotd(line: string): MotdSegment[] {
  const segments: MotdSegment[] = [];
  let style: Omit<MotdSegment, "text"> = {};
  let buffer = "";

  const push = () => {
    if (!buffer) return;
    segments.push({ text: buffer, ...style });
    buffer = "";
  };

  const format = (key: "bold" | "italic" | "underline" | "strikethrough" | "obfuscated") => {
    push();
    style = { ...style, [key]: true };
  };

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char !== "§") {
      buffer += char;
      continue;
    }

    const code = line[i + 1]?.toLowerCase();

    if (line[i + 1] === "#") {
      const hex = line.slice(i + 2, i + 8);
      if (/^[0-9a-fA-F]{6}$/.test(hex)) {
        push();
        style = { color: `#${hex}` };
        i += 7;
        continue;
      }
    }

    if (code === "x" && line[i + 2] === "§") {
      let hex = "";
      let cursor = i + 2;
      let valid = true;
      for (let part = 0; part < 6; part += 1) {
        const digit = line[cursor + 1];
        if (line[cursor] !== "§" || !digit || !/^[0-9a-fA-F]$/.test(digit)) {
          valid = false;
          break;
        }
        hex += digit;
        cursor += 2;
      }
      if (valid) {
        push();
        style = { color: `#${hex}` };
        i = cursor - 1;
        continue;
      }
    }

    if (code && MC_COLORS[code]) {
      push();
      style = { color: MC_COLORS[code] };
      i += 1;
      continue;
    }

    if (code === "l") format("bold");
    else if (code === "o") format("italic");
    else if (code === "n") format("underline");
    else if (code === "m") format("strikethrough");
    else if (code === "k") format("obfuscated");
    else if (code === "r") {
      push();
      style = {};
    }
    i += 1;
  }

  push();
  return segments;
}

function motdSegmentStyle(segment: MotdSegment): CSSProperties {
  const decoration = [segment.underline ? "underline" : "", segment.strikethrough ? "line-through" : ""]
    .filter(Boolean)
    .join(" ");
  return {
    color: segment.color,
    fontWeight: segment.bold ? 800 : undefined,
    fontStyle: segment.italic ? "italic" : undefined,
    textDecoration: decoration || undefined,
  };
}

function Obfuscated({ text }: { text: string }) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    const id = window.setInterval(() => {
      setDisplay(
        Array.from(text, (char) => (char === " " ? " " : glyphs[Math.floor(Math.random() * glyphs.length)]))
          .join("")
      );
    }, 90);
    return () => window.clearInterval(id);
  }, [text]);

  return <>{display}</>;
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
  const lastAutoChecked = useRef("");
  const requestId = useRef(0);

  async function fetchInfo(target?: string) {
    const value = (target ?? ip).trim();
    if (!value) {
      setError("Please enter a server IP.");
      setData(null);
      return;
    }
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(value)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as McStatus;
      if (currentRequest !== requestId.current) return;
      setData(json);
    } catch {
      if (currentRequest !== requestId.current) return;
      setError("Failed to fetch server information. Try again in a moment.");
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }

  useEffect(() => {
    if (!initialIp || lastAutoChecked.current === initialIp) return;
    lastAutoChecked.current = initialIp;
    setIp(initialIp);
    void fetchInfo(initialIp);
  }, [initialIp]);

  const online = data ? Boolean(data.online) : false;
  const name = data?.hostname || data?.ip || ip.trim() || "Minecraft Server";
  const icon = data?.icon?.startsWith("data:image/") ? data.icon : null;
  const motdLines = (data?.motd?.raw?.length ? data.motd.raw : data?.motd?.clean ?? []).map((line) =>
    parseMotd(decodeMotd(line))
  );
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
                            <span className="si-motd-line" key={index}>
                              {line.length > 0
                                ? line.map((segment, segmentIndex) => (
                                    <span key={segmentIndex} style={motdSegmentStyle(segment)}>
                                      {segment.obfuscated ? <Obfuscated text={segment.text} /> : segment.text}
                                    </span>
                                  ))
                                : "\u00A0"}
                            </span>
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
