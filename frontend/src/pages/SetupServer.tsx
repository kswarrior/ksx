import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import { Select, TextField, type SelectOption } from "../components/ui";
import "./SetupServer.css";

type Platform = "codesandbox" | "github" | "gitpod" | "colab" | "vps" | "vm";

type PlatformInfo = {
  label: string;
  description: string;
  icon: string;
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

type Step = { id: string; label: string; icon: string };

type PanelProps = {
  id: string;
  number: number;
  icon: string;
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
  const [mcUrl, setMcUrl] = useState("https://fill-data.papermc.io/v1/objects/f3a5953094696578193b38fa2831e86db254dfbf4817b1ac6cfca55a2d18ca94/paper-26.3-211.jar");
  const [mcCode, setMcCode] = useState("");
  const [endpointName, setEndpointName] = useState("kssmp");
  const [token, setToken] = useState("");
  const [configCode, setConfigCode] = useState("");
  const [ram, setRam] = useState("1024");
  const [startCode, setStartCode] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState("");

  const info = PLATFORMS[platform];

  const steps = useMemo<Step[]>(() => {
    if (platform === "colab") return [];
    const list: Step[] = [];
    if (platform !== "codesandbox") {
      list.push({ id: "shell", label: "Shell", icon: "terminal" });
    }
    if (platform === "vps" || platform === "vm") {
      list.push({ id: "system", label: "System", icon: "sliders" });
    }
    list.push(
      { id: "java", label: "Java", icon: "coffee" },
      { id: "jar", label: "Server JAR", icon: "package" },
      { id: "ip", label: "Address", icon: "globe" },
      { id: "start", label: "Start", icon: "rocket" }
    );
    return list;
  }, [platform]);

  useEffect(() => {
    if (steps.length === 0) return;
    setActiveStep(steps[0].id);
    const elements = steps
      .map((step) => document.getElementById(`setup-${step.id}`))
      .filter((element): element is HTMLElement => Boolean(element));
    if (elements.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveStep(visible[0].target.id.replace("setup-", ""));
        }
      },
      { rootMargin: "-15% 0px -60% 0px", threshold: 0 }
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [steps]);

  const stepNumber = (id: string) => steps.findIndex((step) => step.id === id) + 1;

  async function copy(value: string, id: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      window.setTimeout(() => setCopied((current) => (current === id ? null : current)), 1400);
    } catch {
      setCopied(null);
    }
  }

  function jumpTo(id: string) {
    document.getElementById(`setup-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function genMc() {
    const url = mcUrl.trim() || "https://fill-data.papermc.io/v1/objects/f3a5953094696578193b38fa2831e86db254dfbf4817b1ac6cfca55a2d18ca94/paper-26.3-211.jar";
    setMcCode(`mkdir mc-server && cd mc-server && echo "eula=true" > eula.txt && wget ${url} -O server.jar`);
  }

  function genConfig() {
    if (!token.trim()) {
      alert("Please paste your Minekube token first");
      return;
    }
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
              onChange={(next) => setPlatform(next as Platform)}
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

        {steps.length > 0 && (
          <nav className="setup-progress" aria-label="Setup steps">
            {steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                className={`setup-progress-step ${activeStep === step.id ? "is-active" : ""}`}
                onClick={() => jumpTo(step.id)}
              >
                <span className="setup-progress-num">{index + 1}</span>
                <b>{step.label}</b>
              </button>
            ))}
          </nav>
        )}

        <div className="setup-stage setup-anim" key={platform}>
          {platform === "colab" ? (
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
          ) : (
            <>
              {platform !== "codesandbox" && (
                <Panel
                  id="shell"
                  number={stepNumber("shell")}
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

              {(platform === "vps" || platform === "vm") && (
                <Panel
                  id="system"
                  number={stepNumber("system")}
                  icon="sliders"
                  title="Update System & Install wget"
                  meta={info.label}
                >
                  <p className="setup-hint">
                    Refresh package lists and install <code>wget</code> so the next steps can
                    download Java and the server JAR.
                  </p>
                  <CodeBlock
                    code="apt update -y && apt upgrade -y && apt install wget -y"
                    copyId="apt"
                    copied={copied}
                    onCopy={copy}
                  />
                </Panel>
              )}

              <Panel
                id="java"
                number={stepNumber("java")}
                icon="coffee"
                title="Install Latest Java"
                meta="Oracle JDK 25"
              >
                <p className="setup-hint">
                  Installs Oracle JDK 25 into the current folder and exports it for this shell.
                </p>
                <CodeBlock code={javaInstall} copyId="java" copied={copied} onCopy={copy} label="Install script" />
                <p className="setup-note">
                  Run the export lines again in a new terminal, or add them to your shell profile.
                </p>
              </Panel>

              <Panel
                id="jar"
                number={stepNumber("jar")}
                icon="package"
                title="Download MC Server JAR"
                meta="Paper"
              >
                <p className="setup-hint">
                  Default is Paper — replace the URL with any server JAR you want. The generated
                  command also accepts the EULA and creates the server folder.
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
                  </div>
                </div>
                <div className="setup-actions">
                  <button
                    className="setup-btn secondary"
                    onClick={() => window.open("/minecraft/make-server/server.jar-downloader.html", "_blank")}
                  >
                    <Icon name="external-link" size={13} /> Get Server URL
                  </button>
                  <button className="setup-btn primary" onClick={genMc}>
                    <Icon name="zap" size={13} /> Generate Command
                  </button>
                </div>
                {mcCode && (
                  <CodeBlock code={mcCode} copyId="mc" copied={copied} onCopy={copy} label="Download & prepare" />
                )}
              </Panel>

              <Panel
                id="ip"
                number={stepNumber("ip")}
                icon="globe"
                title="Setup Server IP Address"
                meta="Minekube Connect"
              >
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
                  <button className="setup-btn primary" onClick={genConfig}>
                    <Icon name="zap" size={13} /> Generate Config
                  </button>
                </div>
                {configCode && (
                  <CodeBlock code={configCode} copyId="cfg" copied={copied} onCopy={copy} label="Connect plugin config" />
                )}
              </Panel>

              <Panel
                id="start"
                number={stepNumber("start")}
                icon="rocket"
                title="Start Server"
                meta="RAM allocation"
              >
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
                </div>
                <div className="setup-actions">
                  <button className="setup-btn primary" onClick={genStart}>
                    <Icon name="zap" size={13} /> Generate Start
                  </button>
                </div>
                {startCode && (
                  <CodeBlock code={startCode} copyId="start" copied={copied} onCopy={copy} label="Start command" />
                )}
                <p className="setup-note">
                  1024 MB is enough for a small SMP. Increase it if your host has more memory
                  available.
                </p>
              </Panel>

              <section className="setup-panel setup-check-panel">
                <div className="setup-check-row">
                  <span className="setup-check-icon" aria-hidden>
                    <Icon name="globe" size={20} />
                  </span>
                  <div className="setup-check-copy">
                    <h2>Check your server</h2>
                    <p>
                      After the start command runs, open MC Statics to confirm the server responds
                      and your address resolves.
                    </p>
                  </div>
                  <button
                    className="setup-btn primary"
                    onClick={() => navigate("/minecraft/server/statics.html")}
                  >
                    <Icon name="external-link" size={14} /> Open MC Statics
                  </button>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
