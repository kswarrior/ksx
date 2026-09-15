import { useState } from "react";
import "./SetupServer.css";

type Platform = "codesandbox" | "github" | "gitpod" | "colab" | "vps" | "vm";

export default function SetupServer() {
  const [platform, setPlatform] = useState<Platform>("codesandbox");
  const [mcUrl, setMcUrl] = useState("https://api.papermc.io/v2/projects/paper/versions/1.21.1/builds/113/downloads/paper-1.21.1-113.jar");
  const [mcCode, setMcCode] = useState("");
  const [endpointName, setEndpointName] = useState("kssmp");
  const [token, setToken] = useState("");
  const [configCode, setConfigCode] = useState("");
  const [ram, setRam] = useState("1024");
  const [startCode, setStartCode] = useState("");
  const [copied, setCopied] = useState<string|null>(null);

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(()=>setCopied(null),1200);
  }

  function genMc() {
    const url = mcUrl.trim() || "https://api.papermc.io/v2/projects/paper/versions/1.21.1/builds/113/downloads/paper-1.21.1-113.jar";
    setMcCode(`mkdir mc-server && cd mc-server && echo "eula=true" > eula.txt && wget ${url} -O server.jar`);
  }
  function genConfig() {
    if (!token.trim()) { alert("Please paste your Minekube token first"); return; }
    const name = endpointName.trim() || "kssmp";
    setConfigCode(`echo "endpoint: ${name}" > plugins/connect/config.yml\necho '{"token":"${token}"}' > plugins/connect/token.json\nmkdir plugins && cd plugins && wget https://github.com/minekube/connect-java/releases/download/latest/connect-spigot.jar`);
  }
  function genStart() {
    const r = parseInt(ram) || 1024;
    setStartCode(`java -Xmx${r}M -Xms${r}M -jar server.jar nogui`);
  }

  const javaInstall = `wget https://download.oracle.com/java/25/latest/jdk-25_linux-x64_bin.tar.gz\ntar -xvf jdk-25_linux-x64_bin.tar.gz\nexport JAVA_HOME=$(pwd)/jdk-25.0.2\nexport PATH=$JAVA_HOME/bin:$PATH\njava -version`;

  return (
    <div className="setup-page">
      <div className="setup-bg" aria-hidden>
        <div className="setup-bg-grad" />
        <div className="setup-bg-orb o1" />
        <div className="setup-bg-orb o2" />
      </div>
      <div className="setup-shell">
        <header className="setup-header">
          <div className="setup-kicker"><span className="setup-kicker-dot" /> MAKE SERVER • VPS</div>
          <h1 className="setup-title">MC Server <span>Without Hosting</span></h1>
          <p className="setup-sub">By KS Warrior • Permanent Free IP • Choose platform, copy commands & deploy. Lag-less steps.</p>
          <select className="setup-select" value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
            <option value="codesandbox">CodeSandbox</option>
            <option value="github">GitHub Codespaces</option>
            <option value="gitpod">Gitpod</option>
            <option value="colab">Google Colab</option>
            <option value="vps">VPS (IPV4)</option>
            <option value="vm">VM (not IPV4)</option>
          </select>
        </header>

        <div className="setup-section">
          {platform === "colab" ? (
            <div className="setup-card" style={{textAlign:"center"}}>
              <h3>MC Server in Google Colab</h3>
              <p>Run Paper/Fabric in Colab notebooks — free GPU runtime, auto-restart.</p>
              <div className="setup-actions">
                <button className="setup-btn primary" onClick={() => window.open("https://youtu.be/jjJZocmN_uI", "_blank")}>▶ YouTube Tutorial</button>
                <button className="setup-btn primary" onClick={() => window.open("https://www.mediafire.com/file/u94f47r4v3s0dnd/mc_server_ks_warrior.ipynb/file", "_blank")}>⬇ Download Notebook</button>
                <button className="setup-btn" onClick={() => window.open("https://colab.research.google.com/", "_blank")}>Open Colab ↗</button>
              </div>
            </div>
          ) : (
            <>
              <div className="setup-card">
                <h3>{platform === "codesandbox" ? "Codes for CodeSandbox" : platform === "github" ? "MC Server in GitHub" : platform === "gitpod" ? "MC Server in Gitpod" : platform === "vps" ? "MC Server in VPS (IPV4)" : "MC Server in VM (not IPV4)"}</h3>
                <p>Follow steps in order. Each code block is copy-ready.</p>
              </div>

              {(platform === "github" || platform === "gitpod" || platform === "vps" || platform === "vm") && (
                <div className="setup-card">
                  <h3>Root Folder (if needed)</h3>
                  <pre className="setup-code">sudo su</pre>
                  <button className="setup-btn" onClick={() => copy("sudo su","su")}>{copied==="su"?"Copied ✓":"⎘ Copy"}</button>
                </div>
              )}
              {(platform === "vps" || platform === "vm") && (
                <div className="setup-card">
                  <h3>Update System & Install wget</h3>
                  <pre className="setup-code">apt update -y && apt upgrade -y && apt install wget -y</pre>
                  <button className="setup-btn" onClick={() => copy("apt update -y && apt upgrade -y && apt install wget -y","apt")}>{copied==="apt"?"Copied ✓":"⎘ Copy"}</button>
                </div>
              )}
              <div className="setup-card">
                <h3>☕ Install Latest Java (Oracle JDK 25)</h3>
                <pre className="setup-code">{javaInstall}</pre>
                <button className="setup-btn" onClick={() => copy(javaInstall,"java")}>{copied==="java"?"Copied ✓":"⎘ Copy"}</button>
              </div>
              <div className="setup-card">
                <h3>📦 Download MC Server JAR</h3>
                <p>Default Paper 1.21.1 — replace URL if needed.</p>
                <button className="setup-btn" onClick={() => window.open("/minecraft/make-server/server.jar-downloader.html", "_blank")}>Get Server URL ↗</button>
                <label>Minecraft Server JAR URL</label>
                <input value={mcUrl} onChange={(e) => setMcUrl(e.target.value)} placeholder="https://..." />
                <button className="setup-btn primary" onClick={genMc}>⚡ Generate Command</button>
                {mcCode && <pre className="setup-code">{mcCode}</pre>}
                {mcCode && <button className="setup-btn" onClick={() => copy(mcCode,"mc")}>{copied==="mc"?"Copied ✓":"⎘ Copy"}</button>}
              </div>
              <div className="setup-card">
                <h3>🌐 Setup MC Server IP Address</h3>
                <p>Sign up at <a href="https://app.minekube.com/" target="_blank" rel="noreferrer" style={{color:"#a78bfa", fontWeight:800}}>app.minekube.com</a> (free), create Endpoint, get name + token.</p>
                <label>Endpoint Name (e.g., kssmp)</label>
                <input value={endpointName} onChange={(e) => setEndpointName(e.target.value)} />
                <label>Endpoint Token</label>
                <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste token here" />
                <button className="setup-btn primary" onClick={genConfig}>⚡ Generate Config</button>
                {configCode && <pre className="setup-code">{configCode}</pre>}
                {configCode && <button className="setup-btn" onClick={() => copy(configCode,"cfg")}>{copied==="cfg"?"Copied ✓":"⎘ Copy"}</button>}
              </div>
              <div className="setup-card">
                <h3>🚀 Start Server</h3>
                <label>RAM Allocation (MB)</label>
                <input type="number" value={ram} onChange={(e) => setRam(e.target.value)} />
                <button className="setup-btn primary" onClick={genStart}>⚡ Generate Start</button>
                {startCode && <pre className="setup-code">{startCode}</pre>}
                {startCode && <button className="setup-btn" onClick={() => copy(startCode,"start")}>{copied==="start"?"Copied ✓":"⎘ Copy"}</button>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
