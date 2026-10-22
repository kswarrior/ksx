import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Icon, { type IconName } from "../components/Icon";
import { Select, TextField, type SelectOption } from "../components/ui";
import "./SetupServer.css";

type Platform = "codesandbox" | "github" | "gitpod" | "colab" | "vps" | "vm";
type AddressProvider = "minekube" | "playit";
type RunMode = "foreground" | "screen" | "tmux";

type PlatformInfo = {
  label: string;
  description: string;
  icon: IconName;
};

const PLATFORMS: Record<Platform, PlatformInfo> = {
  codesandbox: {
    label: "CodeSandbox",
    description: "Browser container with a terminal — perfect for a quick Paper server.",
    icon: "cloud",
  },
  github: {
    label: "GitHub Codespaces",
    description: "Cloud dev container with root access and a full Linux shell.",
    icon: "terminal",
  },
  gitpod: {
    label: "Gitpod",
    description: "Ephemeral cloud workspace with root access. Stop it when you are done.",
    icon: "terminal",
  },
  colab: {
    label: "Google Colab",
    description: "Free notebook runtime — open the tutorial or the ready-made notebook.",
    icon: "play",
  },
  vps: {
    label: "VPS (IPv4)",
    description: "Root Linux server with a public IPv4 address.",
    icon: "server",
  },
  vm: {
    label: "VM (no IPv4)",
    description: "Linux VM without a public IPv4 — share it with Minekube Connect.",
    icon: "server",
  },
};

const platformOptions: SelectOption[] = (Object.keys(PLATFORMS) as Platform[]).map(
  (value) => ({ value, label: PLATFORMS[value].label })
);

const javaVersionOptions: SelectOption[] = [
  { value: "25", label: "Java 25 · latest" },
  { value: "21", label: "Java 21 · LTS" },
  { value: "17", label: "Java 17 · LTS" },
];

const javaReadyOptions: SelectOption[] = [
  { value: "install", label: "No — install Java" },
  { value: "ready", label: "Yes — already installed" },
];

const runModeOptions: SelectOption[] = [
  { value: "foreground", label: "Foreground" },
  { value: "screen", label: "screen · background" },
  { value: "tmux", label: "tmux · background" },
];

const guiOptions: SelectOption[] = [
  { value: "nogui", label: "No GUI · recommended" },
  { value: "gui", label: "GUI enabled" },
];

const addressOptions: SelectOption[] = [
  { value: "minekube", label: "Minekube Connect · custom IP" },
  { value: "playit", label: "playit.gg · free tunnel" },
];

const DEFAULT_JAR_URL =
  "https://fill-data.papermc.io/v1/objects/f3a5953094696578193b38fa2831e86db254dfbf4817b1ac6cfca55a2d18ca94/paper-26.3-211.jar";

const AIKAR_FLAGS =
  "-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=8M -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1 -Dusing.aikars.flags=https://mcflags.emc.gs -Daikars.new.flags=true";

const PLAYIT_COMMAND = `curl -fsSL https://packages.playit.gg/install.sh | bash -s -- -y
sudo systemctl enable --now playit
playit setup`;

type Step = { id: string; label: string };

type PanelProps = {
  id: string;
  number: number;
  icon: IconName;
  title: string;
  meta?: string;
  children: ReactNode;
};

function Panel({ id, number, icon, title, meta, children }: PanelProps) {
  return (
    <section className="setup-panel" id={`setup-${id}`}>
      <div className="setup-panel-head">
        <div className="setup-panel-title">
          <span className="setup-step-number">{number}</span>
          <Icon name={icon} size={15} />
          <h2>{title}</h2>
        </div>
        {meta && <span className="setup-panel-meta">{meta}</span>}
      </div>
      {children}
    </section>
  );
}

type CodeBlockProps = {
  code: string;
  copyId: string;
  copied: string | null;
  onCopy: (value: string, id: string) => void;
  label?: string;
};

function CodeBlock({ code, copyId, copied, onCopy, label = "Command" }: CodeBlockProps) {
  const isCopied = copied === copyId;
  return (
    <div className="setup-code-box">
      <div className="setup-code-head">
        <span>{label}</span>
        <button
          type="button"
          className="setup-mini-btn"
          onClick={() => onCopy(code, copyId)}
        >
          <Icon name={isCopied ? "check" : "copy"} size={12} />
          {isCopied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="setup-code">{code}</pre>
    </div>
  );
}

export default function SetupServer() {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<Platform>("codesandbox");
  const [stepIndex, setStepIndex] = useState(0);

  const [javaVersion, setJavaVersion] = useState("25");
  const [javaReady, setJavaReady] = useState(false);

  const [mcUrl, setMcUrl] = useState(DEFAULT_JAR_URL);
  const [jarFile, setJarFile] = useState("server.jar");

  const [addressProvider, setAddressProvider] = useState<AddressProvider>("minekube");
  const [endpointName, setEndpointName] = useState("kssmp");
  const [token, setToken] = useState("");
  const [serverPort, setServerPort] = useState("25565");

  const [ram, setRam] = useState("1024");
  const [runMode, setRunMode] = useState<RunMode>("foreground");
  const [gui, setGui] = useState("nogui");
  const [aikar, setAikar] = useState(false);
  const [autoRestart, setAutoRestart] = useState(false);

  const [copied, setCopied] = useState<string | null>(null);

  const info = PLATFORMS[platform];

  const steps = useMemo<Step[]>(() => {
    if (platform === "colab") return [{ id: "colab", label: "Guide" }];
    const list: Step[] = [];
    if (platform !== "codesandbox") {
      list.push({ id: "shell", label: "Shell" });
    }
    if (platform === "vps" || platform === "vm") {
      list.push({ id: "system", label: "System" });
    }
    list.push(
      { id: "java", label: "Java" },
      { id: "jar", label: "Download JAR" },
      { id: "start", label: "Start" },
      { id: "ip", label: "Address" }
    );
    return list;
  }, [platform]);

  const current = steps[stepIndex] ?? steps[0];
  const isLast = stepIndex >= steps.length - 1;
  const number = stepIndex + 1;

  const finalAction: { label: string; icon: IconName; onClick: () => void } =
    platform === "colab"
      ? {
          label: "Open Colab",
          icon: "external-link",
          onClick: () => window.open("https://colab.research.google.com/", "_blank"),
        }
      : {
          label: "Check Server",
          icon: "external-link",
          onClick: () => navigate("/minecraft/server/statics.html"),
        };

  const javaCommand = useMemo(() => {
    if (javaReady) return "java -version";
    return `wget https://download.oracle.com/java/${javaVersion}/latest/jdk-${javaVersion}_linux-x64_bin.tar.gz
tar -xvf jdk-${javaVersion}_linux-x64_bin.tar.gz
export JAVA_HOME=$(find "$(pwd)" -maxdepth 1 -type d -name 'jdk-*' | head -n1)
export PATH=$JAVA_HOME/bin:$PATH
java -version`;
  }, [javaReady, javaVersion]);

  const jarCommand = useMemo(() => {
    const url = mcUrl.trim() || DEFAULT_JAR_URL;
    const file = jarFile.trim() || "server.jar";
    return `mkdir -p mc-server && cd mc-server && echo "eula=true" > eula.txt && wget ${url} -O ${file}`;
  }, [mcUrl, jarFile]);

  const startCommand = useMemo(() => {
    const memory = parseInt(ram) || 1024;
    const file = jarFile.trim() || "server.jar";
    const flags = aikar ? ` ${AIKAR_FLAGS}` : "";
    const guiArg = gui === "nogui" ? " nogui" : "";
    const base = `java -Xms${memory}M -Xmx${memory}M${flags} -jar ${file}${guiArg}`;
    const inner = autoRestart
      ? `while true; do ${base}; echo "Server stopped — restarting in 5s..."; sleep 5; done`
      : base;
    if (runMode === "screen") {
      return `screen -dmS mc-server bash -c '${inner.replace(/'/g, "'\\''")}'`;
    }
    if (runMode === "tmux") {
      return `tmux new-session -d -s mc-server "${inner.replace(/"/g, '\\"')}"`;
    }
    return inner;
  }, [aikar, autoRestart, gui, jarFile, ram, runMode]);

  const addressCommand = useMemo(() => {
    if (addressProvider === "playit") return PLAYIT_COMMAND;
    if (!token.trim()) return "";
    const name = endpointName.trim() || "kssmp";
    return `mkdir -p plugins/connect && echo "endpoint: ${name}" > plugins/connect/config.yml && echo '{"token":"${token.trim()}"}' > plugins/connect/token.json && wget https://github.com/minekube/connect-java/releases/download/latest/connect-spigot.jar -O plugins/connect-spigot.jar`;
  }, [addressProvider, endpointName, token]);

  function changePlatform(next: Platform) {
    setPlatform(next);
    setStepIndex(0);
  }

  function goToStep(next: number) {
    setStepIndex(Math.max(0, Math.min(next, steps.length - 1)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function copy(value: string, id: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      window.setTimeout(() => setCopied((current) => (current === id ? null : current)), 1400);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="setup-page">
      <div className="setup-bg" aria-hidden>
        <div className="setup-bg-grad" />
        <div className="setup-bg-orb o1" />
        <div className="setup-bg-orb o2" />
      </div>

      <div className="setup-shell">
        <header className="setup-hero">
          <span className="setup-hero-icon" aria-hidden>
            <Icon name="server" size={22} />
          </span>
          <div className="setup-hero-text">
            <h1>Setup Server</h1>
            <p>Deploy Paper on a VPS, VM, container or cloud IDE — copy-ready commands, no guesswork.</p>
          </div>
          <div className="setup-hero-select">
            <span className="setup-hero-label">Platform</span>
            <Select
              className="setup-platform"
              value={platform}
              onChange={(next) => changePlatform(next as Platform)}
              options={platformOptions}
              ariaLabel="Platform"
            />
          </div>
        </header>

        <div className="setup-summary">
          <Icon name={info.icon} size={16} />
          <div>
            <b>{info.label}</b>
            <p>{info.description}</p>
          </div>
        </div>

        {steps.length > 1 && (
          <nav className="setup-progress" aria-label="Setup steps">
            {steps.map((step, index) => {
              const isActive = index === stepIndex;
              const isDone = index < stepIndex;
              return (
                <button
                  key={step.id}
                  type="button"
                  className={`setup-progress-step ${isActive ? "is-active" : ""} ${
                    isDone ? "is-done" : ""
                  }`}
                  onClick={() => goToStep(index)}
                  aria-current={isActive ? "step" : undefined}
                >
                  <span className="setup-progress-num">
                    {isDone ? <Icon name="check" size={11} /> : index + 1}
                  </span>
                  <b>{step.label}</b>
                </button>
              );
            })}
          </nav>
        )}

        <div className="setup-stage setup-anim" key={`${platform}-${current.id}`}>
          {current.id === "colab" && (
            <section className="setup-panel">
              <div className="setup-panel-head">
                <div className="setup-panel-title">
                  <span className="setup-step-number">
                    <Icon name="play" size={11} />
                  </span>
                  <h2>MC Server in Google Colab</h2>
                </div>
                <span className="setup-panel-meta">Notebook runtime</span>
              </div>
              <p className="setup-hint">
                Run Paper or Fabric in Colab notebooks with a free runtime and auto-restart. Open
                the video guide or download the ready-made notebook to begin.
              </p>
              <div className="setup-actions">
                <button
                  className="setup-btn primary"
                  onClick={() => window.open("https://youtu.be/jjJZocmN_uI", "_blank")}
                >
                  <Icon name="play" size={13} /> YouTube Tutorial
                </button>
                <button
                  className="setup-btn secondary"
                  onClick={() => window.open("https://www.mediafire.com/file/u94f47r4v3s0dnd/mc_server_ks_warrior.ipynb/file", "_blank")}
                >
                  <Icon name="download" size={14} /> Download Notebook
                </button>
                <button
                  className="setup-btn secondary"
                  onClick={() => window.open("https://colab.research.google.com/", "_blank")}
                >
                  <Icon name="external-link" size={13} /> Open Colab
                </button>
              </div>
              <p className="setup-note">
                Tip: keep the notebook tab open while the server runs. Colab sessions stop when the
                tab is closed or the runtime times out.
              </p>
            </section>
          )}

          {current.id === "shell" && (
            <Panel
              id="shell"
              number={number}
              icon="terminal"
              title="Open Root Shell"
              meta="Root access"
            >
              <p className="setup-hint">
                Most cloud IDEs and VPS accounts start as a normal user. Switch to root before
                installing packages.
              </p>
              <CodeBlock code="sudo su" copyId="su" copied={copied} onCopy={copy} />
            </Panel>
          )}

          {current.id === "system" && (
            <Panel
              id="system"
              number={number}
              icon="sliders"
              title="Update System & Install wget"
              meta={info.label}
            >
              <p className="setup-hint">
                Refresh package lists and install <code>wget</code> so the next steps can download
                Java and the server JAR.
              </p>
              <CodeBlock
                code="apt update -y && apt upgrade -y && apt install wget -y"
                copyId="apt"
                copied={copied}
                onCopy={copy}
              />
            </Panel>
          )}

          {current.id === "java" && (
            <Panel
              id="java"
              number={number}
              icon="coffee"
              title="Install Latest Java"
              meta={javaReady ? "Already installed" : `Java ${javaVersion}`}
            >
              <p className="setup-hint">
                Choose the Java version that matches your server software, then run the script in
                the folder where Java should live.
              </p>
              <div className="setup-fields">
                <div className="setup-field">
                  <label>Java version</label>
                  <Select
                    value={javaVersion}
                    onChange={setJavaVersion}
                    options={javaVersionOptions}
                    ariaLabel="Java version"
                    disabled={javaReady}
                  />
                </div>
                <div className="setup-field">
                  <label>Java installed?</label>
                  <Select
                    value={javaReady ? "ready" : "install"}
                    onChange={(next) => setJavaReady(next === "ready")}
                    options={javaReadyOptions}
                    ariaLabel="Java installed"
                  />
                </div>
              </div>
              <CodeBlock
                code={javaCommand}
                copyId="java"
                copied={copied}
                onCopy={copy}
                label={javaReady ? "Verify Java" : "Install script"}
              />
              <p className="setup-note">
                {javaReady
                  ? "Skip the download and verify the installed Java version before continuing."
                  : "The export lines only apply to the current shell. Add them to your shell profile for a permanent setup."}
              </p>
            </Panel>
          )}

          {current.id === "jar" && (
            <Panel
              id="jar"
              number={number}
              icon="package"
              title="Download MC Server JAR"
              meta="Paper"
            >
              <p className="setup-hint">
                Paste a direct JAR URL or use the downloader to find one. The command creates{" "}
                <code>mc-server</code>, accepts the EULA and saves the JAR.
              </p>
              <div className="setup-fields">
                <div className="setup-field wide">
                  <label htmlFor="setup-jar-url">Minecraft server JAR URL</label>
                  <TextField
                    id="setup-jar-url"
                    value={mcUrl}
                    onChange={(event) => setMcUrl(event.target.value)}
                    placeholder="https://..."
                    spellCheck={false}
                  />
                  <div className="setup-actions">
                    <button
                      className="setup-btn secondary"
                      onClick={() => window.open("/minecraft/make-server/server.jar-downloader.html", "_blank")}
                    >
                      <Icon name="external-link" size={13} /> Get Server URL
                    </button>
                  </div>
                </div>
                <div className="setup-field">
                  <label htmlFor="setup-jar-name">Save as</label>
                  <TextField
                    id="setup-jar-name"
                    value={jarFile}
                    onChange={(event) => setJarFile(event.target.value)}
                    placeholder="server.jar"
                    spellCheck={false}
                  />
                </div>
              </div>
              <CodeBlock
                code={jarCommand}
                copyId="jar"
                copied={copied}
                onCopy={copy}
                label="Download & prepare"
              />
              <p className="setup-note">
                Continue from inside the <code>mc-server</code> folder for the next steps.
              </p>
            </Panel>
          )}

          {current.id === "start" && (
            <Panel
              id="start"
              number={number}
              icon="rocket"
              title="Start Server"
              meta="RAM & runtime"
            >
              <p className="setup-hint">
                Tune memory, choose how the server runs and add performance flags. The command
                updates as you change options.
              </p>
              <div className="setup-fields">
                <div className="setup-field">
                  <label htmlFor="setup-ram">RAM allocation (MB)</label>
                  <TextField
                    id="setup-ram"
                    inputMode="numeric"
                    value={ram}
                    onChange={(event) => setRam(event.target.value)}
                    placeholder="1024"
                  />
                </div>
                <div className="setup-field">
                  <label htmlFor="setup-jar-file">Server JAR file</label>
                  <TextField
                    id="setup-jar-file"
                    value={jarFile}
                    onChange={(event) => setJarFile(event.target.value)}
                    placeholder="server.jar"
                    spellCheck={false}
                  />
                </div>
                <div className="setup-field">
                  <label>Run mode</label>
                  <Select
                    value={runMode}
                    onChange={(next) => setRunMode(next as RunMode)}
                    options={runModeOptions}
                    ariaLabel="Run mode"
                  />
                </div>
                <div className="setup-field">
                  <label>GUI</label>
                  <Select
                    value={gui}
                    onChange={setGui}
                    options={guiOptions}
                    ariaLabel="GUI"
                  />
                </div>
              </div>
              <div className="setup-toggle-row">
                <label className="setup-toggle">
                  <input
                    type="checkbox"
                    checked={aikar}
                    onChange={(event) => setAikar(event.target.checked)}
                  />
                  <span>Aikar&apos;s performance flags</span>
                </label>
                <label className="setup-toggle">
                  <input
                    type="checkbox"
                    checked={autoRestart}
                    onChange={(event) => setAutoRestart(event.target.checked)}
                  />
                  <span>Auto-restart</span>
                </label>
              </div>
              <CodeBlock
                code={startCommand}
                copyId="start"
                copied={copied}
                onCopy={copy}
                label="Start command"
              />
              {runMode !== "foreground" && (
                <p className="setup-note">
                  Attach later with{" "}
                  <code>{runMode === "screen" ? "screen -r mc-server" : "tmux attach -t mc-server"}</code>
                  . Stop with{" "}
                  <code>{runMode === "screen" ? 'screen -S mc-server -X quit' : "tmux kill-session -t mc-server"}</code>
                  .
                </p>
              )}
              <p className="setup-note">
                1024 MB is enough for a small SMP. Increase it if your host has more memory
                available.
              </p>
            </Panel>
          )}

          {current.id === "ip" && (
            <Panel
              id="ip"
              number={number}
              icon="globe"
              title="Setup Server Address"
              meta={addressProvider === "minekube" ? "Minekube Connect" : "playit.gg"}
            >
              <div className="setup-fields">
                <div className="setup-field wide">
                  <label>Address provider</label>
                  <Select
                    value={addressProvider}
                    onChange={(next) => setAddressProvider(next as AddressProvider)}
                    options={addressOptions}
                    ariaLabel="Address provider"
                  />
                </div>
              </div>

              {addressProvider === "minekube" ? (
                <>
                  <p className="setup-hint">
                    Sign up at{" "}
                    <a href="https://app.minekube.com/" target="_blank" rel="noreferrer">
                      app.minekube.com
                    </a>{" "}
                    (free), create an endpoint, then paste its name and token here.
                  </p>
                  <div className="setup-fields">
                    <div className="setup-field">
                      <label htmlFor="setup-endpoint">Endpoint name</label>
                      <TextField
                        id="setup-endpoint"
                        value={endpointName}
                        onChange={(event) => setEndpointName(event.target.value)}
                        placeholder="kssmp"
                        spellCheck={false}
                      />
                    </div>
                    <div className="setup-field">
                      <label htmlFor="setup-token">Endpoint token</label>
                      <TextField
                        id="setup-token"
                        value={token}
                        onChange={(event) => setToken(event.target.value)}
                        placeholder="Paste token here"
                        spellCheck={false}
                      />
                    </div>
                  </div>
                  <div className="setup-actions">
                    <a
                      className="setup-btn secondary"
                      href="https://app.minekube.com/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Icon name="external-link" size={13} /> Open Minekube
                    </a>
                  </div>
                  {addressCommand ? (
                    <CodeBlock
                      code={addressCommand}
                      copyId="minekube"
                      copied={copied}
                      onCopy={copy}
                      label="Connect plugin config"
                    />
                  ) : (
                    <p className="setup-note">Paste your endpoint token to generate the config command.</p>
                  )}
                  <p className="setup-note">
                    Restart the server after installing the plugin so the address goes live.
                  </p>
                </>
              ) : (
                <>
                  <p className="setup-hint">
                    Install the playit agent, claim it to your account and create a Minecraft Java
                    tunnel in the{" "}
                    <a href="https://playit.gg/" target="_blank" rel="noreferrer">
                      playit.gg
                    </a>{" "}
                    dashboard.
                  </p>
                  <div className="setup-fields">
                    <div className="setup-field">
                      <label htmlFor="setup-port">Server port</label>
                      <TextField
                        id="setup-port"
                        inputMode="numeric"
                        value={serverPort}
                        onChange={(event) => setServerPort(event.target.value)}
                        placeholder="25565"
                      />
                    </div>
                  </div>
                  <div className="setup-actions">
                    <a
                      className="setup-btn secondary"
                      href="https://playit.gg/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Icon name="external-link" size={13} /> Open playit.gg
                    </a>
                  </div>
                  <CodeBlock
                    code={addressCommand}
                    copyId="playit"
                    copied={copied}
                    onCopy={copy}
                    label="Install playit agent"
                  />
                  <p className="setup-note">
                    In playit.gg, create a Minecraft Java tunnel pointing to{" "}
                    <code>127.0.0.1:{serverPort || "25565"}</code>. Keep the agent running with{" "}
                    <code>sudo systemctl status playit</code>.
                  </p>
                </>
              )}
            </Panel>
          )}
        </div>

        <div className="setup-nav">
          {stepIndex > 0 && (
            <button className="setup-btn secondary" onClick={() => goToStep(stepIndex - 1)}>
              <Icon name="arrow-left" size={14} /> Back
            </button>
          )}
          {!isLast ? (
            <button className="setup-btn primary setup-nav-next" onClick={() => goToStep(stepIndex + 1)}>
              Next <Icon name="arrow-right" size={14} />
            </button>
          ) : (
            <button className="setup-btn primary setup-nav-next" onClick={finalAction.onClick}>
              <Icon name={finalAction.icon} size={14} /> {finalAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
