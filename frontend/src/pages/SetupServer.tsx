import { useState } from "react";
import Icon from "../components/Icon";
import { Select, TextField, type SelectOption } from "../components/ui";
import "./SetupServer.css";

type Platform = "codesandbox" | "github" | "gitpod" | "colab" | "vps" | "vm";

const platformOptions: SelectOption[] = [
  { value: "codesandbox", label: "CodeSandbox" },
  { value: "github", label: "GitHub Codespaces" },
  { value: "gitpod", label: "Gitpod" },
  { value: "colab", label: "Google Colab" },
  { value: "vps", label: "VPS (IPV4)" },
  { value: "vm", label: "VM (not IPV4)" },
];

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
          <Select
            className="setup-select"
            value={platform}
            onChange={(next) => setPlatform(next as Platform)}
            options={platformOptions}
            ariaLabel="Platform"
          />
        </header>

        <div className="setup-section">
          {platform === "colab" ? (
            <div className="setup-card" style={{textAlign:"center"}}>
              <h3>MC Server in Google Colab</h3>
              <p>Run Paper/Fabric in Colab notebooks — free GPU runtime, auto-restart.</p>
              <div className="setup-actions">
                <button className="setup-btn primary" onClick={() => window.open("https://youtu.be/jjJZocmN_uI", "_blank")}><Icon name="play" size={13} /> YouTube Tutorial</button>
                <button className="setup-btn primary" onClick={() => window.open("https://www.mediafire.com/file/u94f47r4v3s0dnd/mc_server_ks_warrior.ipynb/file", "_blank")}><Icon name="download" size={14} /> Download Notebook</button>
                <button className="setup-btn" onClick={() => window.open("https://colab.research.google.com/", "_blank")}><Icon name="external-link" size={13} /> Open Colab</button>
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
                  <button className="setup-btn" onClick={() => copy("sudo su","su")}><><Icon name={copied==="su" ? "check" : "copy"} size={13} /> {copied==="su" ? "Copied" : "Copy"}</></button>
                </div>
              )}
              {(platform === "vps" || platform === "vm") && (
                <div className="setup-card">
                  <h3>Update System & Install wget</h3>
                  <pre className="setup-code">apt update -y && apt upgrade -y && apt install wget -y</pre>
                  <button className="setup-btn" onClick={() => copy("apt update -y && apt upgrade -y && apt install wget -y","apt")}><><Icon name={copied==="apt" ? "check" : "copy"} size={13} /> {copied==="apt" ? "Copied" : "Copy"}</></button>
                </div>
              )}
              <div className="setup-card">
                <h3><Icon name="coffee" size={15} /> Install Latest Java (Oracle JDK 25)</h3>
                <pre className="setup-code">{javaInstall}</pre>
                <button className="setup-btn" onClick={() => copy(javaInstall,"java")}><><Icon name={copied==="java" ? "check" : "copy"} size={13} /> {copied==="java" ? "Copied" : "Copy"}</></button>
              </div>
              <div className="setup-card">
                <h3><Icon name="package" size={15} /> Download MC Server JAR</h3>
                <p>Default Paper 1.21.1 — replace URL if needed.</p>
                <button className="setup-btn" onClick={() => window.open("/minecraft/make-server/server.jar-downloader.html", "_blank")}><Icon name="external-link" size={13} /> Get Server URL</button>
                <label>Minecraft Server JAR URL</label>
                <TextField value={mcUrl} onChange={(e) => setMcUrl(e.target.value)} placeholder="https://..." />
                <button className="setup-btn primary" onClick={genMc}><Icon name="zap" size={13} /> Generate Command</button>
                {mcCode && <pre className="setup-code">{mcCode}</pre>}
                {mcCode && <button className="setup-btn" onClick={() => copy(mcCode,"mc")}><><Icon name={copied==="mc" ? "check" : "copy"} size={13} /> {copied==="mc" ? "Copied" : "Copy"}</></button>}
              </div>
              <div className="setup-card">
                <h3><Icon name="globe" size={15} /> Setup MC Server IP Address</h3>
                <p>Sign up at <a href="https://app.minekube.com/" target="_blank" rel="noreferrer" style={{color:"#f5f5f5", fontWeight:800}}>app.minekube.com</a> (free), create Endpoint, get name + token.</p>
                <label>Endpoint Name (e.g., kssmp)</label>
                <TextField value={endpointName} onChange={(e) => setEndpointName(e.target.value)} />
                <label>Endpoint Token</label>
                <TextField value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste token here" />
                <button className="setup-btn primary" onClick={genConfig}><Icon name="zap" size={13} /> Generate Config</button>
                {configCode && <pre className="setup-code">{configCode}</pre>}
                {configCode && <button className="setup-btn" onClick={() => copy(configCode,"cfg")}><><Icon name={copied==="cfg" ? "check" : "copy"} size={13} /> {copied==="cfg" ? "Copied" : "Copy"}</></button>}
              </div>
              <div className="setup-card">
                <h3><Icon name="rocket" size={15} /> Start Server</h3>
                <label>RAM Allocation (MB)</label>
                <TextField type="text" inputMode="numeric" value={ram} onChange={(e) => setRam(e.target.value)} />
                <button className="setup-btn primary" onClick={genStart}><Icon name="zap" size={13} /> Generate Start</button>
                {startCode && <pre className="setup-code">{startCode}</pre>}
                {startCode && <button className="setup-btn" onClick={() => copy(startCode,"start")}><><Icon name={copied==="start" ? "check" : "copy"} size={13} /> {copied==="start" ? "Copied" : "Copy"}</></button>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
