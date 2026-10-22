import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon, { type IconName } from "../components/Icon";
import { GuideCodeBlock as CodeBlock, GuidePanel as Panel } from "../components/Guide";
import { Select, TextField, type SelectOption } from "../components/ui";
import "./SetupServer.css";

type InstallMethod = "quick" | "manual";

const METHOD_OPTIONS: SelectOption[] = [
  { value: "quick", label: "Quick installer · interactive" },
  { value: "manual", label: "Manual · npm + SQLite" },
];

const STEPS: { id: string; label: string; icon: IconName }[] = [
  { id: "requirements", label: "Requirements", icon: "sliders" },
  { id: "install", label: "Install", icon: "download" },
  { id: "admin", label: "Admin & Start", icon: "server" },
  { id: "node", label: "Node & Daemon", icon: "satellite" },
  { id: "setup", label: "Images & Ports", icon: "package" },
  { id: "server", label: "Minecraft", icon: "gamepad" },
  { id: "import", label: "Import", icon: "folder" },
  { id: "connect", label: "Connect", icon: "globe" },
];

const QUICK_INSTALL = `sudo bash <(curl -s https://raw.githubusercontent.com/airlinklabs/panel/refs/heads/main/installer.sh)
# Choose "Install Both" from the menu`;

const PANEL_ONLY = `sudo bash <(curl -s https://raw.githubusercontent.com/airlinklabs/panel/refs/heads/main/installer.sh)
# Choose "Install Panel" from the menu`;

const MANUAL_INSTALL = `sudo apt update
sudo apt install -y curl git openssl unzip
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable --now docker

sudo git clone https://github.com/airlinklabs/panel.git /var/www/panel
sudo chown -R "$USER":"$USER" /var/www/panel
cd /var/www/panel
cp example.env .env

# Edit .env before continuing:
# URL="http://YOUR_SERVER_IP:3000"
# DATABASE_URL="file:./dev.db"
# NODE_ENV="production"
# SESSION_SECRET="<paste output of: openssl rand -hex 32>"

npm install
npx prisma generate
npm run build
npm prune --omit=dev`;

const PM2_START = `sudo npm install -g pm2
cd /var/www/panel
npx prisma db push
pm2 start dist/app.js --name airlink
pm2 save
pm2 startup`;

const QUICK_SERVICE = `sudo systemctl status airlink-panel --no-pager
sudo systemctl enable --now airlink-panel`;

const NODE_QUICK = `sudo bash <(curl -s https://raw.githubusercontent.com/airlinklabs/panel/refs/heads/main/installer.sh)
# Choose "Install Daemon" from the menu
# Panel address: http://PANEL_IP:3000
# Daemon port: 3002
# Node key: YOUR_NODE_KEY`;

const NODE_MANUAL = `sudo apt update
sudo apt install -y curl git unzip
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable --now docker

sudo git clone https://github.com/airlinklabs/daemon.git /etc/daemon
cd /etc/daemon

sudo tee .env > /dev/null << 'EOF'
remote=http://PANEL_IP:3000
key=YOUR_NODE_KEY
port=3002
DEBUG=false
version=1.0.0
environment=production
STATS_INTERVAL=10000
EOF

sudo npm install
sudo npm run build
cd libs
sudo npm install
sudo npm rebuild`;

const NODE_SYSTEMD = `sudo tee /etc/systemd/system/airlink-daemon.service > /dev/null << 'EOF'
[Unit]
Description=Airlink Daemon
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=root
WorkingDirectory=/etc/daemon
EnvironmentFile=/etc/daemon/.env
ExecStart=/usr/bin/npm run start
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now airlink-daemon
sudo systemctl status airlink-daemon --no-pager`;

const FIREWALL = `sudo ufw allow 3000/tcp
sudo ufw allow 3003/tcp
sudo ufw allow 25565/tcp

# Separate node only: allow the panel server to reach the daemon
# sudo ufw allow from PANEL_IP to any port 3002 proto tcp

sudo ufw reload`;

export default function AirlinkPanel() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<InstallMethod>("quick");
  const [stepIndex, setStepIndex] = useState(0);
  const [serverIp, setServerIp] = useState("");

  const current = STEPS[stepIndex] ?? STEPS[0];
  const number = stepIndex + 1;
  const panelInput = serverIp.trim();
  const panelUrl = panelInput
    ? /^https?:\/\//i.test(panelInput)
      ? panelInput.replace(/\/+$/, "")
      : `http://${panelInput}:3000`
    : "http://YOUR_SERVER_IP:3000";
  const isManual = method === "manual";

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
            <Icon name="cloud" size={22} />
          </span>
          <div className="setup-hero-text">
            <h1>Airlink Panel Setup</h1>
            <p>
              Complete Airlink guide for a VPS, VM or container — install the panel and daemon,
              add a node, import an image and launch your first Minecraft server.
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
          <Icon name={isManual ? "terminal" : "sparkles"} size={16} />
          <div>
            <b>{isManual ? "Manual install · npm + SQLite" : "Quick installer · interactive"}</b>
            <p>
              {isManual
                ? "Clone the panel, configure SQLite and .env, build it with npm and keep it alive with PM2."
                : "The installer sets up Node.js, Docker, the panel and daemon, PM2 and systemd using SQLite. nginx and SSL are configured separately."}
            </p>
          </div>
        </div>

        <nav className="setup-progress" aria-label="Airlink setup steps">
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
                Airlink runs on a 64-bit Linux server with root or sudo access. The current installer
                supports Ubuntu, Debian, Fedora, RHEL and Arch; Alpine is detected but is not fully
                supported because it lacks systemd. Every node also needs Docker.
              </p>
              <ul className="guide-list">
                <li><strong>Node.js 18+</strong> and <strong>npm 9+</strong>.</li>
                <li><strong>SQLite</strong> by default — no external database is required. Redis is optional.</li>
                <li><strong>Docker</strong> on each machine that will host servers.</li>
                <li><strong>Port 3000</strong> for the panel, <strong>3002</strong> for the daemon and <strong>3003</strong> for SFTP.</li>
                <li><strong>Port 25565</strong> (or your chosen port) for each Minecraft server.</li>
                <li>The first registered account automatically becomes the panel admin.</li>
              </ul>
              <CodeBlock
                label="Check your system"
                code={`uname -m\nnode -v\ndocker -v\nsudo ss -tulpn | grep -E ':3000|:3002|:3003'`}
              />
              <p className="setup-note">
                The current Airlink 2.0 Prisma schema is SQLite-only; older docs that mention
                PostgreSQL are out of date. The panel and daemon can share a VPS, or run on
                separate machines. Some panel versions default a new node to port 3001 — set it to
                3002 to match the daemon installed by the current installer.
              </p>
            </Panel>
          )}

          {current.id === "install" && (
            <Panel
              id="install"
              number={number}
              icon="download"
              title={isManual ? "Manual Panel Installation" : "Run the Quick Installer"}
              meta={isManual ? "npm · SQLite · PM2" : "All-in-one"}
            >
              {isManual ? (
                <>
                  <p className="setup-hint">
                    Install Node.js and Docker, clone Airlink, configure the SQLite database and{" "}
                    <code>.env</code>, then build the panel with npm.
                  </p>
                  <CodeBlock label="Manual install" code={MANUAL_INSTALL} />
                  <p className="setup-hint">
                    Start the panel with PM2 so it survives reboots and restarts automatically.
                  </p>
                  <CodeBlock label="Start with PM2" code={PM2_START} />
                  <p className="setup-note">
                    <code>pm2 startup</code> prints a command — run it to enable boot startup.
                    Set a unique <code>SESSION_SECRET</code> before exposing the panel. The SQLite
                    database is created under <code>prisma/</code>; back up both it and{" "}
                    <code>.env</code>.
                  </p>
                </>
              ) : (
                <>
                  <p className="setup-hint">
                    Run the installer as root. It is interactive: choose <strong>Install Both</strong>{" "}
                    for a single-machine setup. It installs Node.js, Docker, the panel, the daemon,
                    PM2 and systemd services, and creates the first admin account.
                  </p>
                  <CodeBlock label="Quick install" code={QUICK_INSTALL} />
                  <p className="setup-hint">
                    Installing the panel on one machine and the daemon on another? Choose{" "}
                    <strong>Install Panel</strong> here, then add the daemon on the node in step 4.
                  </p>
                  <CodeBlock label="Panel only" code={PANEL_ONLY} />
                  <p className="setup-note">
                    The current installer uses SQLite (<code>prisma/dev.db</code>) and does not
                    configure nginx or SSL — add those separately. It also does not currently
                    accept the <code>--panel-only</code>/<code>--daemon-only</code> flags shown in
                    some docs; use the menu. Keep <code>.env</code> and the database when updating.
                  </p>
                </>
              )}
            </Panel>
          )}

          {current.id === "admin" && (
            <Panel
              id="admin"
              number={number}
              icon="server"
              title="Start the Panel & Create the First Admin"
              meta="First account = admin"
            >
              <p className="setup-hint">
                {isManual
                  ? "Start the panel and open it on port 3000. When the database has no users, register the first account — Airlink automatically makes it the administrator."
                  : "The quick installer already created your admin account and disabled public registration. Sign in with the email, username and password you entered during installation."}
              </p>
              <CodeBlock
                label={isManual ? "Check the PM2 process" : "Check the panel service"}
                code={isManual ? `pm2 status\npm2 logs airlink --lines 50` : QUICK_SERVICE}
              />
              <div className="setup-fields">
                <div className="setup-field wide">
                  <label htmlFor="airlink-server-ip">Panel IP or full URL</label>
                  <TextField
                    id="airlink-server-ip"
                    value={serverIp}
                    onChange={(event) => setServerIp(event.target.value)}
                    placeholder="203.0.113.10 or https://panel.example.com"
                    spellCheck={false}
                  />
                </div>
              </div>
              <div className="guide-access">
                <span>Panel URL</span>
                <code>{panelUrl}</code>
              </div>
              <CodeBlock label="Open firewall ports" code={FIREWALL} />
              <p className="setup-note">
                If you use a domain or reverse proxy, set <code>URL</code> in <code>.env</code> to
                the public address and enable <strong>Behind Reverse Proxy</strong> in Admin →
                Settings.
              </p>
            </Panel>
          )}

          {current.id === "node" && (
            <Panel
              id="node"
              number={number}
              icon="satellite"
              title="Add a Node & Install the Daemon"
              meta="Panel ↔ daemon"
            >
              <p className="setup-hint">
                In the panel, open <strong>Admin → Nodes</strong>, click <strong>Create Node</strong>
                {" "}and copy the node key. Set the node port to <code>3002</code> to match the
                daemon. If you chose <strong>Install Both</strong>, the daemon is already installed
                on this machine — reuse the key from <code>/etc/daemon/.env</code>. Otherwise
                install it on the node with the same panel address, port and key.
              </p>
              {isManual ? (
                <>
                  <CodeBlock label="Manual daemon setup" code={NODE_MANUAL} />
                  <CodeBlock label="Run the daemon with systemd" code={NODE_SYSTEMD} />
                </>
              ) : (
                <CodeBlock label="Daemon-only install" code={NODE_QUICK} />
              )}
              <ol className="guide-list guide-list-numbered">
                <li>Create the node in <strong>Admin → Nodes</strong> with its address, port and resource limits.</li>
                <li>Install the daemon on the node using the same key.</li>
                <li>Click <strong>Verify</strong> in the node page — it should return the daemon version.</li>
                <li>If verification fails, check <code>systemctl status airlink-daemon</code> and test <code>curl -s -u "Airlink:YOUR_NODE_KEY" http://NODE_IP:3002/</code>.</li>
              </ol>
              <p className="setup-note">
                Keep the node key private. The daemon has no <code>/api/health</code> route — its
                root endpoint is protected with HTTP basic auth. Port 3002 only needs to be
                reachable from the panel, not from the public internet; SFTP uses 3003.
              </p>
            </Panel>
          )}

          {current.id === "setup" && (
            <Panel
              id="setup"
              number={number}
              icon="package"
              title="Create a Location, Allocation & Image"
              meta="Before the first server"
            >
              <p className="setup-hint">
                Airlink needs a location, at least one port allocation and a server image before
                you can create a Minecraft server.
              </p>
              <ol className="guide-list guide-list-numbered">
                <li>Open <strong>Admin → Locations</strong> and create a location such as <code>US East</code>.</li>
                <li>Open <strong>Admin → Nodes</strong>, select the node and add an allocation — for example <code>203.0.113.10:25565</code>.</li>
                <li>Open <strong>Admin → Images</strong> and install an image from the Image Store, upload a Pterodactyl egg JSON, or import one from a URL.</li>
                <li>Check that the image has a Docker image, startup command, variables and the ports your server needs.</li>
                <li>Optional: add a database host under <strong>Admin → Databases</strong> if you plan to offer databases.</li>
              </ol>
              <div className="setup-actions">
                <button
                  className="setup-btn secondary"
                  type="button"
                  onClick={() => window.open("https://airlinklabs.xyz/docs/features/images/", "_blank")}
                >
                  <Icon name="external-link" size={13} /> Image Store Docs
                </button>
                <button
                  className="setup-btn secondary"
                  type="button"
                  onClick={() => window.open("https://airlinklabs.xyz/docs/features/nodes/", "_blank")}
                >
                  <Icon name="external-link" size={13} /> Node & Allocation Docs
                </button>
              </div>
              <p className="setup-note">
                An allocation can only be assigned to one server at a time. Add more ports if you
                run multiple servers or need extra services.
              </p>
            </Panel>
          )}

          {current.id === "server" && (
            <Panel
              id="server"
              number={number}
              icon="gamepad"
              title="Create a Minecraft Server"
              meta="Image + resources"
            >
              <p className="setup-hint">
                Open <strong>Admin → Servers</strong> and click <strong>Create Server</strong>.
                Choose the owner, node, Minecraft image and resource limits, then pick an
                allocation.
              </p>
              <ol className="guide-list guide-list-numbered">
                <li>Select the node that will run the container.</li>
                <li>Select your Minecraft image (Paper, Fabric, Forge or a Pterodactyl egg).</li>
                <li>Set memory, CPU, storage and the server port allocation.</li>
                <li>Create the server — it is queued, then installed by the daemon.</li>
                <li>Open the console and press <strong>Start</strong>. If it stops for the EULA, edit <code>eula.txt</code> in the File Manager and set <code>eula=true</code>.</li>
              </ol>
              <div className="setup-actions">
                <button
                  className="setup-btn secondary"
                  type="button"
                  onClick={() => navigate("/minecraft/make-server/server.jar-downloader.html")}
                >
                  <Icon name="external-link" size={13} /> Get a Server JAR
                </button>
                <button
                  className="setup-btn secondary"
                  type="button"
                  onClick={() => window.open("https://airlinklabs.xyz/docs/features/servers/", "_blank")}
                >
                  <Icon name="external-link" size={13} /> Server Docs
                </button>
              </div>
              <p className="setup-note">
                If <code>allowUserCreateServer</code> is enabled in settings, users can create
                their own servers at <code>/create-server</code> within their resource limits.
              </p>
            </Panel>
          )}

          {current.id === "import" && (
            <Panel
              id="import"
              number={number}
              icon="folder"
              title="Import an Existing Server"
              meta="SFTP · File Manager"
            >
              <p className="setup-hint">
                Create the server in Airlink first, then move your existing world, plugins and
                configuration into its container volume over SFTP or the File Manager.
              </p>
              <ol className="guide-list guide-list-numbered">
                <li>Stop the old server and the new Airlink server before copying files.</li>
                <li>Open the server in the panel and generate its <strong>SFTP credentials</strong>.</li>
                <li>Connect with FileZilla or WinSCP using the panel host and SFTP port (default <code>3003</code>).</li>
                <li>Upload <code>world</code>, <code>plugins</code>, configs and the server JAR.</li>
                <li>Make sure the JAR name matches the image startup command, then start the server.</li>
              </ol>
              <p className="setup-note">
                Airlink allows one active SFTP session per server and credentials expire after 24
                hours. Regenerate them if an old session is still connected. Use the File Manager
                for small edits without opening an SFTP session.
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
                Allow the game port in the host firewall, then point your domain or tunnel at the
                node address. Use the KS guides below to finish the setup.
              </p>
              <ul className="guide-list">
                <li>Allow <strong>25565/tcp</strong> (or your chosen allocation) for players.</li>
                <li>Keep <strong>3000</strong> for the panel, <strong>3002</strong> for the daemon and <strong>3003</strong> for SFTP.</li>
                <li>Use HTTPS and enable <strong>require2faForAdmins</strong> in Admin → Settings.</li>
                <li>If using nginx, enable <strong>Behind Reverse Proxy</strong> so client IPs and redirects work correctly.</li>
              </ul>
              <div className="guide-links">
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
                For production deployments, reverse proxy configuration and troubleshooting, read
                the{" "}
                <a href="https://airlinklabs.xyz/docs/admin/deployment/" target="_blank" rel="noreferrer">
                  Airlink deployment guide
                </a>{" "}
                and{" "}
                <a href="https://airlinklabs.xyz/docs/admin/security/" target="_blank" rel="noreferrer">
                  security guide
                </a>
                .
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
              href="https://airlinklabs.xyz/docs/"
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
