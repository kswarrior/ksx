import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Icon, { type IconName } from "../components/Icon";
import { Select, TextField, type SelectOption } from "../components/ui";
import "./SetupServer.css";
import "./PufferPanel.css";

type InstallMethod = "host" | "docker";

const METHOD_OPTIONS: SelectOption[] = [
  { value: "host", label: "Host package · VPS / VM" },
  { value: "docker", label: "Docker container" },
];

const STEPS: { id: string; label: string; icon: IconName }[] = [
  { id: "requirements", label: "Requirements", icon: "sliders" },
  { id: "install", label: "Install", icon: "download" },
  { id: "admin", label: "Admin & Start", icon: "server" },
  { id: "docker", label: "Docker", icon: "package" },
  { id: "node", label: "Node", icon: "satellite" },
  { id: "server", label: "Minecraft", icon: "gamepad" },
  { id: "import", label: "Import", icon: "folder" },
  { id: "connect", label: "Connect", icon: "globe" },
];

const HOST_INSTALL = `sudo apt-get update
sudo apt-get install -y curl gnupg apt-transport-https

curl -fsSL https://packagecloud.io/pufferpanel/pufferpanel/gpgkey | gpg --dearmor | sudo tee /etc/apt/keyrings/pufferpanel.gpg > /dev/null

echo "X-Repolib-Name: PufferPanel
Types: deb
URIs: https://packagecloud.io/pufferpanel/pufferpanel/any/
Suites: any
Components: main
Signed-By: /etc/apt/keyrings/pufferpanel.gpg" | sudo tee /etc/apt/sources.list.d/pufferpanel.sources > /dev/null

sudo apt update
sudo apt-get install -y pufferpanel`;

const DOCKER_INSTALL = [
  "curl -fsSL https://get.docker.com | sudo sh",
  "sudo systemctl enable --now docker",
  "",
  "docker volume create pufferpanel-config",
  "docker volume create pufferpanel-servers",
  "",
  "docker create --name pufferpanel \\",
  "  -p 8080:8080 -p 5657:5657 \\",
  "  -v pufferpanel-config:/etc/pufferpanel \\",
  "  -v pufferpanel-servers:/var/lib/pufferpanel:z \\",
  "  -v /var/run/docker.sock:/var/run/docker.sock \\",
  "  --restart=on-failure \\",
  "  pufferpanel/pufferpanel:latest",
].join("\n");

const DOCKER_SETUP = `curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable --now docker
sudo groupadd --force --system docker
sudo usermod -a -G docker pufferpanel
sudo systemctl restart pufferpanel`;

const NODE_INSTALL = `curl -s https://packagecloud.io/install/repositories/pufferpanel/pufferpanel/script.deb.sh?any=true | sudo bash
sudo apt update
sudo apt-get install -y pufferpanel
sudo systemctl enable --now pufferpanel`;

const FIREWALL = `sudo ufw allow 8080/tcp
sudo ufw allow 5657/tcp
sudo ufw allow 25565/tcp
sudo ufw reload`;

const DIRECT_IMPORT = `sudo cp -a /path/to/old-server/. /var/lib/pufferpanel/servers/<SERVER_ID>/
sudo chown -R pufferpanel:pufferpanel /var/lib/pufferpanel`;

function Panel({
  id,
  number,
  icon,
  title,
  meta,
  children,
}: {
  id: string;
  number: number;
  icon: IconName;
  title: string;
  meta?: string;
  children: ReactNode;
}) {
  return (
    <section className="setup-panel" id={`puffer-${id}`}>
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

function CodeBlock({ code, label = "Command" }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="setup-code-box">
      <div className="setup-code-head">
        <span>{label}</span>
        <button
          type="button"
          className="setup-mini-btn"
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          }}
        >
          <Icon name={copied ? "check" : "copy"} size={12} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="setup-code">{code}</pre>
    </div>
  );
}

export default function PufferPanel() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<InstallMethod>("host");
  const [stepIndex, setStepIndex] = useState(0);
  const [serverIp, setServerIp] = useState("");

  const current = STEPS[stepIndex] ?? STEPS[0];
  const number = stepIndex + 1;
  const panelUrl = `http://${serverIp.trim() || "YOUR_SERVER_IP"}:8080`;
  const isDocker = method === "docker";

  function goToStep(next: number) {
    setStepIndex(Math.max(0, Math.min(next, STEPS.length - 1)));
    window.scrollTo({ top: 0, behavior: "smooth" });
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
            <Icon name="package" size={22} />
          </span>
          <div className="setup-hero-text">
            <h1>PufferPanel Setup</h1>
            <p>
              Complete PufferPanel 3.x guide for a VPS, VM or container — install the panel,
              secure it with Docker, add a node and launch your first Minecraft server.
            </p>
          </div>
          <div className="setup-hero-select">
            <span className="setup-hero-label">Install method</span>
            <Select
              className="setup-platform"
              value={method}
              onChange={(next) => setMethod(next as InstallMethod)}
              options={METHOD_OPTIONS}
              ariaLabel="Install method"
            />
          </div>
        </header>

        <div className="setup-summary">
          <Icon name={isDocker ? "package" : "server"} size={16} />
          <div>
            <b>{isDocker ? "Docker container" : "Host package · VPS / VM"}</b>
            <p>
              {isDocker
                ? "The panel and daemon run inside one container. Mount the Docker socket so the panel can create server containers."
                : "Install the panel and daemon directly on Ubuntu or Debian with the official PufferPanel package."}
            </p>
          </div>
        </div>

        <nav className="setup-progress" aria-label="PufferPanel setup steps">
          {STEPS.map((step, index) => {
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

        <div className="setup-stage setup-anim" key={current.id}>
          {current.id === "requirements" && (
            <Panel
              id="requirements"
              number={number}
              icon="sliders"
              title="Check the Requirements"
              meta="64-bit Linux"
            >
              <p className="setup-hint">
                PufferPanel 3.x needs a 64-bit Linux server with root or sudo access. Ubuntu
                Jammy/Noble (22.04/24.04) and Debian Buster/Bullseye (10/11) are supported. 32-bit
                systems are not.
              </p>
              <ul className="puffer-list">
                <li>A VPS, VM, dedicated server or Docker host with SSH access.</li>
                <li><strong>Port 8080</strong> for the web panel and <strong>port 5657</strong> for SFTP.</li>
                <li><strong>Port 25565</strong> (or your chosen port) for each Minecraft server.</li>
                <li>Docker is strongly recommended so each server is isolated.</li>
              </ul>
              <CodeBlock
                label="Check your system"
                code={`uname -m\ncat /etc/os-release | grep PRETTY_NAME\nsudo ss -tulpn | grep -E ':8080|:5657'`}
              />
              <p className="setup-note">
                On ARM64 hosts use the same commands — the PufferPanel package supports ARM64 on
                the distributions listed above.
              </p>
            </Panel>
          )}

          {current.id === "install" && (
            <Panel
              id="install"
              number={number}
              icon="download"
              title={`Install PufferPanel ${isDocker ? "with Docker" : "on the Host"}`}
              meta={isDocker ? "Docker container" : "Ubuntu / Debian"}
            >
              <p className="setup-hint">
                {isDocker
                  ? "Install Docker Engine, create persistent volumes, then create the PufferPanel container. Do not use the snap package for Docker."
                  : "Add the official PufferPanel repository and install the package. This installs both the panel and the daemon on the same machine."}
              </p>
              <CodeBlock
                label={isDocker ? "Docker install" : "Official package install"}
                code={isDocker ? DOCKER_INSTALL : HOST_INSTALL}
              />
              <p className="setup-note">
                Red Hat / Rocky / AlmaLinux users can use the RPM repository from the{" "}
                <a href="https://docs.pufferpanel.com/en/3.x/installing.html" target="_blank" rel="noreferrer">
                  official installation guide
                </a>
                .
              </p>
            </Panel>
          )}

          {current.id === "admin" && (
            <Panel
              id="admin"
              number={number}
              icon="server"
              title="Create an Admin & Start the Panel"
              meta="First login"
            >
              <p className="setup-hint">
                Create your first account and answer <code>Y</code> when PufferPanel asks whether it
                is an admin. Then start the panel and open it in your browser.
              </p>
              <CodeBlock
                label={isDocker ? "Create admin in Docker" : "Create admin on host"}
                code={
                  isDocker
                    ? `docker start pufferpanel\ndocker exec -it pufferpanel /pufferpanel/bin/pufferpanel user add\ndocker logs -f pufferpanel`
                    : `sudo pufferpanel user add\nsudo systemctl enable --now pufferpanel\nsudo systemctl status pufferpanel --no-pager`
                }
              />
              <div className="setup-fields">
                <div className="setup-field wide">
                  <label htmlFor="puffer-server-ip">Server IP or hostname</label>
                  <TextField
                    id="puffer-server-ip"
                    value={serverIp}
                    onChange={(event) => setServerIp(event.target.value)}
                    placeholder="203.0.113.10 or panel.example.com"
                    spellCheck={false}
                  />
                </div>
              </div>
              <div className="puffer-access">
                <span>Panel URL</span>
                <code>{panelUrl}</code>
              </div>
              <CodeBlock label="Open firewall ports" code={FIREWALL} />
              <p className="setup-note">
                The default panel port is 8080 and SFTP is 5657. Put the panel behind a domain and
                SSL before exposing it to the internet — see the{" "}
                <a href="https://docs.pufferpanel.com/en/3.x/guides/ssl-setup-nginx.html" target="_blank" rel="noreferrer">
                  official SSL guide
                </a>
                .
              </p>
            </Panel>
          )}

          {current.id === "docker" && (
            <Panel
              id="docker"
              number={number}
              icon="package"
              title="Enable Docker for Servers"
              meta={isDocker ? "Already inside Docker" : "Recommended"}
            >
              {isDocker ? (
                <>
                  <p className="setup-hint">
                    You installed the panel as a Docker container, so this step is already handled.
                    The container was created with <code>/var/run/docker.sock</code> mounted, which
                    lets PufferPanel launch server containers on the host.
                  </p>
                  <p className="setup-note">
                    Keep the Docker socket private. Anyone who can access it can control every
                    container on the host.
                  </p>
                </>
              ) : (
                <>
                  <p className="setup-hint">
                    Install Docker Engine on the host, add the <code>pufferpanel</code> user to the
                    Docker group and restart the panel. Use the Docker environment for servers —
                    the Standard environment does not isolate servers from the host.
                  </p>
                  <CodeBlock label="Docker host setup" code={DOCKER_SETUP} />
                  <p className="setup-note">
                    Do not install Docker from the Ubuntu snap package. It cannot write to{" "}
                    <code>/var/lib/pufferpanel</code>. See the{" "}
                    <a href="https://docs.pufferpanel.com/en/3.x/docker.html" target="_blank" rel="noreferrer">
                      official Docker guide
                    </a>
                    .
                  </p>
                </>
              )}
            </Panel>
          )}

          {current.id === "node" && (
            <Panel
              id="node"
              number={number}
              icon="satellite"
              title="Add a Node"
              meta="Optional · multi-server"
            >
              <p className="setup-hint">
                A single-machine install already includes a local node. Add a remote node only when
                you want to run servers on another VPS or VM. Install the PufferPanel package on
                that machine first.
              </p>
              <CodeBlock label="Install on the remote node" code={NODE_INSTALL} />
              <ol className="puffer-list puffer-list-numbered">
                <li>Log in to the panel as an admin and open <strong>Nodes</strong>.</li>
                <li>Click <strong>Add Node</strong>, fill in the details and click <strong>Create Node</strong>.</li>
                <li>Copy the generated configuration into <code>/etc/pufferpanel/config.json</code> on the node.</li>
                <li>Start the node with <code>sudo systemctl enable --now pufferpanel</code>.</li>
              </ol>
              <p className="setup-note">
                The node must be able to reach the panel URL, and the panel must be able to reach
                the node. Open the required ports on both machines.
              </p>
            </Panel>
          )}

          {current.id === "server" && (
            <Panel
              id="server"
              number={number}
              icon="gamepad"
              title="Create a Minecraft Server"
              meta="Paper · Fabric · Forge"
            >
              <p className="setup-hint">
                In the panel, open <strong>Servers</strong> and click <strong>Add Server</strong>.
                Pick the node, choose a Minecraft template and give the server a name.
              </p>
              <ol className="puffer-list puffer-list-numbered">
                <li>Select the node that will run the server.</li>
                <li>Choose <code>minecraft-paper</code>, <code>minecraft-fabric</code> or <code>minecraft-forge</code>.</li>
                <li>Select the <strong>Docker</strong> environment and set memory and port.</li>
                <li>Create the server, open its console and press <strong>Start</strong>.</li>
                <li>If the server stops for the EULA, open the file manager, edit <code>eula.txt</code> and set <code>eula=true</code>, then start it again.</li>
              </ol>
              <div className="setup-actions">
                <button
                  className="setup-btn secondary"
                  type="button"
                  onClick={() => navigate("/minecraft/make-server/server.jar-downloader.html")}
                >
                  <Icon name="external-link" size={13} /> Get a Server JAR
                </button>
                <a
                  className="setup-btn secondary"
                  href="https://docs.pufferpanel.com/en/3.x/templates/templates.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Icon name="external-link" size={13} /> Template Docs
                </a>
              </div>
              <p className="setup-note">
                The template decides which JAR is downloaded and which Java version is installed.
                Use the Java version required by your Minecraft version.
              </p>
            </Panel>
          )}

          {current.id === "import" && (
            <Panel
              id="import"
              number={number}
              icon="folder"
              title="Import an Existing Server"
              meta="SFTP recommended"
            >
              <p className="setup-hint">
                Create the server in PufferPanel first using the template that matches your server
                type. Then upload the existing files over SFTP and rename the main JAR to{" "}
                <code>server.jar</code>.
              </p>
              <ol className="puffer-list puffer-list-numbered">
                <li>Open the server in the panel and find its <strong>SFTP</strong> credentials.</li>
                <li>Connect with FileZilla, WinSCP or another SFTP client.</li>
                <li>Upload the server files, including <code>world</code>, <code>plugins</code> and configs.</li>
                <li>Rename your server JAR to <code>server.jar</code> and start the server.</li>
              </ol>
              <CodeBlock label="Direct file access on the host" code={DIRECT_IMPORT} />
              <p className="setup-note">
                Stop the old server before copying files. Never run two copies against the same
                world folder. Direct access requires root on the node.
              </p>
            </Panel>
          )}

          {current.id === "connect" && (
            <Panel
              id="connect"
              number={number}
              icon="globe"
              title="Connect Players, Bots & a Custom IP"
              meta="Next steps"
            >
              <p className="setup-hint">
                Your server is only reachable when its port is open and your DNS or tunnel points
                to the right address. Use the KS guides below to finish the setup.
              </p>
              <ul className="puffer-list">
                <li>Allow <strong>25565/tcp</strong> (or your chosen port) in the host firewall.</li>
                <li>Forward the port in your router if the server is at home.</li>
                <li>Use the panel's SFTP port only for file access, not for Minecraft clients.</li>
              </ul>
              <div className="puffer-links">
                <button className="setup-btn secondary" type="button" onClick={() => navigate("/minecraft/make-server/custom-ip.html")}>
                  <Icon name="globe" size={14} /> Custom IP Guide
                </button>
                <button className="setup-btn secondary" type="button" onClick={() => navigate("/minecraft/server/bot.html")}>
                  <Icon name="bot" size={14} /> Bot Setup Guide
                </button>
                <button className="setup-btn secondary" type="button" onClick={() => navigate("/minecraft/make-server/setup-server-in-vps.html")}>
                  <Icon name="server" size={14} /> Raw VPS / VM Setup
                </button>
                <button className="setup-btn secondary" type="button" onClick={() => navigate("/minecraft/server/statics.html")}>
                  <Icon name="search" size={14} /> Check Server Status
                </button>
              </div>
              <p className="setup-note">
                For panel troubleshooting, check the{" "}
                <a href="https://docs.pufferpanel.com/en/3.x/faq.html" target="_blank" rel="noreferrer">
                  PufferPanel FAQ
                </a>{" "}
                and{" "}
                <a href="https://docs.pufferpanel.com/en/3.x/guides/common-problems.html" target="_blank" rel="noreferrer">
                  common problems
                </a>{" "}
                pages.
              </p>
            </Panel>
          )}
        </div>

        <div className="setup-nav">
          <button
            className="setup-btn secondary"
            type="button"
            onClick={() => goToStep(stepIndex - 1)}
            disabled={stepIndex === 0}
          >
            <Icon name="arrow-left" size={13} /> Back
          </button>
          {stepIndex < STEPS.length - 1 ? (
            <button
              className="setup-btn primary setup-nav-next"
              type="button"
              onClick={() => goToStep(stepIndex + 1)}
            >
              Next <Icon name="arrow-right" size={13} />
            </button>
          ) : (
            <a
              className="setup-btn primary setup-nav-next"
              href="https://docs.pufferpanel.com/en/3.x/"
              target="_blank"
              rel="noreferrer"
            >
              Official Docs <Icon name="external-link" size={13} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
