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

  function copy(text: string) {
    navigator.clipboard.writeText(text);
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
      <h1>MC Server Without Hosting</h1>
      <div className="subtitle">By KS Warrior | Permanent Free IP | Easy setup</div>
      <select className="platform-select" value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
        <option value="codesandbox">CodeSandbox</option>
        <option value="github">GitHub</option>
        <option value="gitpod">Gitpod</option>
        <option value="colab">Google Colab</option>
        <option value="vps">VPS (IPV4)</option>
        <option value="vm">VM (not IPV4)</option>
      </select>

      {(platform === "codesandbox" || platform === "github" || platform === "gitpod" || platform === "vps" || platform === "vm") && (
        <div className="section active">
          <h2>{platform === "codesandbox" ? "Codes for CodeSandbox" : platform === "github" ? "MC Server in GitHub" : platform === "gitpod" ? "MC Server in Gitpod" : platform === "vps" ? "MC Server in VPS (IPV4)" : "MC Server in VM (not IPV4)"}</h2>
          {(platform === "github" || platform === "gitpod" || platform === "vps" || platform === "vm") && (
            <div className="card">
              <p>Root Folder (if needed)</p>
              <pre className="code">sudo su</pre>
              <button className="btn" onClick={() => copy("sudo su")}>Copy Code</button>
            </div>
          )}
          {(platform === "vps" || platform === "vm") && (
            <div className="card">
              <p>Update System & Install wget (if needed)</p>
              <pre className="code">apt update -y && apt upgrade -y && apt install wget -y</pre>
              <button className="btn" onClick={() => copy("apt update -y && apt upgrade -y && apt install wget -y")}>Copy Code</button>
            </div>
          )}
          <div className="card">
            <p>Install Latest Java (Oracle JDK 25) via URL</p>
            <pre className="code">{javaInstall}</pre>
            <button className="btn" onClick={() => copy(javaInstall)}>Copy Code</button>
          </div>
          <div className="card">
            <p>Download MC Server - Enter URL below (default latest Paper 1.21.1)</p>
            <button className="btn" onClick={() => window.open("https://ksx.pages.dev/minecraft/make-server/server.jar-downloader.html", "_blank")}>Get Server URL</button>
            <label>Minecraft Server JAR URL:</label>
            <input value={mcUrl} onChange={(e) => setMcUrl(e.target.value)} />
            <button className="btn" onClick={genMc}>Generate Code</button>
            {mcCode && <pre className="code">{mcCode}</pre>}
            {mcCode && <button className="btn" onClick={() => copy(mcCode)}>Copy Code</button>}
          </div>
          <div className="card">
            <p>Setup MC Server IP Address</p>
            <p>Sign up at <a href="https://app.minekube.com/" target="_blank" rel="noreferrer">app.minekube.com</a> (free), create an Endpoint, get name and token.</p>
            <label>Endpoint Name (e.g., kssmp):</label>
            <input value={endpointName} onChange={(e) => setEndpointName(e.target.value)} />
            <label>Endpoint Token:</label>
            <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste token here" />
            <button className="btn" onClick={genConfig}>Generate Config Code</button>
            {configCode && <pre className="code">{configCode}</pre>}
            {configCode && <button className="btn" onClick={() => copy(configCode)}>Copy Config Code</button>}
          </div>
          <div className="card">
            <p>Start Server - Enter RAM in MB (default 1024)</p>
            <label>RAM Allocation (MB):</label>
            <input type="number" value={ram} onChange={(e) => setRam(e.target.value)} />
            <button className="btn" onClick={genStart}>Generate Code</button>
            {startCode && <pre className="code">{startCode}</pre>}
            {startCode && <button className="btn" onClick={() => copy(startCode)}>Copy Code</button>}
          </div>
        </div>
      )}

      {platform === "colab" && (
        <div className="section active">
          <h2>MC Server in Google Colab</h2>
          <button className="btn btn-primary" onClick={() => window.open("https://youtu.be/jjJZocmN_uI", "_blank")}>YouTube Tutorial</button>
          <button className="btn btn-primary" onClick={() => window.open("https://www.mediafire.com/file/u94f47r4v3s0dnd/mc_server_ks_warrior.ipynb/file", "_blank")}>Download Notebook</button>
          <button className="btn btn-primary" onClick={() => window.open("https://colab.research.google.com/", "_blank")}>Open Colab</button>
        </div>
      )}
    </div>
  );
}
