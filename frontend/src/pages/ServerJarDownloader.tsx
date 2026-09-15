import { useState } from "react";
import "./ServerJarDownloader.css";

const API = {
  PAPER: "https://api.papermc.io/v2/projects",
  PURPUR: "https://api.purpurmc.org/v2/purpur",
};

export default function ServerJarDownloader() {
  const [type, setType] = useState("paper");
  const [version, setVersion] = useState("");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<{ text: string; kind: "loading" | "success" | "error" } | null>(null);
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  function updatePlaceholder() {
    if (type === "spigot") return "Not required";
    if (type === "velocity" || type === "fabric" || type === "quilt") return "optional";
    return "required";
  }

  async function getPaperLike(project: string, ver: string): Promise<string> {
    const r = await fetch(`${API.PAPER}/${project}/versions/${ver}`);
    if (!r.ok) throw new Error("Version not found");
    const d = await r.json();
    const build = Math.max(...d.builds);
    return `${API.PAPER}/${project}/versions/${ver}/builds/${build}/downloads/${project}-${ver}-${build}.jar`;
  }

  async function startFetch() {
    const v = version.trim();
    setShow(true);
    setUrl("");
    setStatus({ text: "Fetching download link…", kind: "loading" });
    try {
      let downloadUrl = "";
      if (["paper", "folia", "velocity", "waterfall"].includes(type)) {
        if (!v) throw new Error("Version required");
        downloadUrl = await getPaperLike(type, v);
      } else if (type === "purpur") {
        if (!v) throw new Error("Version required");
        const r = await fetch(`${API.PURPUR}/versions/${v}`);
        if (!r.ok) throw new Error("Version not found");
        const d = await r.json();
        const build = d.builds?.latest;
        if (!build) throw new Error("Build not found");
        downloadUrl = `${API.PURPUR}/versions/${v}/builds/${build}/download`;
      } else if (type === "vanilla") {
        if (!v) throw new Error("Version required");
        const r = await fetch("https://launchermeta.mojang.com/mc/game/version_manifest.json");
        const d = await r.json();
        const verInfo = d.versions.find((x: { id: string }) => x.id === v);
        if (!verInfo) throw new Error("Version not found");
        const vr = await fetch(verInfo.url);
        const vj = await vr.json();
        downloadUrl = vj.downloads.server.url;
      } else if (type === "spigot") {
        downloadUrl = "https://download.getbukkit.org/spigot/spigot.jar";
      } else if (type === "fabric") {
        const ver = v || "1.21.1";
        const r = await fetch(`https://meta.fabricmc.net/v2/versions/loader/${ver}`);
        const d = await r.json();
        if (!d[0]) throw new Error("Fabric not found");
        const loader = d[0].loader.version;
        downloadUrl = `https://meta.fabricmc.net/v2/versions/loader/${ver}/${loader}/server/jar`;
      } else if (type === "forge") {
        throw new Error("Forge requires manual download from files.minecraftforge.net");
      } else {
        throw new Error("Unsupported type");
      }
      setUrl(downloadUrl);
      setStatus({ text: "Found! Ready to download.", kind: "success" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus({ text: msg, kind: "error" });
    }
  }

  function downloadJar() {
    if (url) window.open(url, "_blank");
  }
  function copyURL() {
    if (url) { navigator.clipboard.writeText(url); setCopied(true); setTimeout(()=>setCopied(false),1200); }
  }

  return (
    <div className="jar-page">
      <div className="jar-bg" aria-hidden>
        <div className="jar-bg-grad" />
        <div className="jar-bg-orb o1" />
        <div className="jar-bg-orb o2" />
      </div>
      <div className="jar-shell">
        <header className="jar-header">
          <div className="jar-kicker"><span className="jar-kicker-dot" /> MAKE SERVER • JAR</div>
          <h1 className="jar-title">MC Server<span>.jar</span> Downloader</h1>
          <p className="jar-sub">Fast, clean & direct server downloads — Paper, Purpur, Vanilla & more.</p>
        </header>

        <div className="jar-card">
          <div className="jar-row">
            <div className="jar-group">
              <label>Server Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="paper">Paper</option>
                <option value="folia">Folia</option>
                <option value="purpur">Purpur</option>
                <option value="velocity">Velocity</option>
                <option value="waterfall">Waterfall</option>
                <option value="vanilla">Vanilla</option>
                <option value="fabric">Fabric</option>
                <option value="quilt">Quilt</option>
                <option value="forge">Forge</option>
                <option value="neoforge">NeoForge (Not complete)</option>
                <option value="spigot">Spigot</option>
              </select>
            </div>
            <div className="jar-group">
              <label>Version</label>
              <input placeholder={updatePlaceholder()} value={version} onChange={(e) => setVersion(e.target.value)} />
            </div>
          </div>
          <button className="jar-btn" onClick={startFetch}>🔍 Find Server.jar</button>

          {show && (
            <div className="jar-result">
              {status && <div className={`jar-status ${status.kind}`}>{status.text}</div>}
              <input className="jar-url" readOnly value={url} placeholder="https://..." />
              {url && (
                <div className="jar-actions">
                  <button className="jar-btn" onClick={downloadJar}>⬇ Download</button>
                  <button className="jar-btn secondary" onClick={copyURL}>{copied ? "Copied ✓" : "⎘ Copy URL"}</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
