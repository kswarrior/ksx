import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon, { type IconName } from "../components/Icon";
import { GuideCodeBlock as CodeBlock, GuidePanel as Panel } from "../components/Guide";
import { Select, TextField, type SelectOption } from "../components/ui";
import "./SetupServer.css";

type PanelOs = "ubuntu24" | "ubuntu22" | "ubuntu26" | "debian12" | "debian13";

const OS_OPTIONS: SelectOption[] = [
  { value: "ubuntu24", label: "Ubuntu 24.04 · recommended" },
  { value: "ubuntu22", label: "Ubuntu 22.04" },
  { value: "ubuntu26", label: "Ubuntu 26.04" },
  { value: "debian12", label: "Debian 12" },
  { value: "debian13", label: "Debian 13" },
];

const OS_LABELS: Record<PanelOs, string> = {
  ubuntu24: "Ubuntu 24.04",
  ubuntu22: "Ubuntu 22.04",
  ubuntu26: "Ubuntu 26.04",
  debian12: "Debian 12",
  debian13: "Debian 13",
};

const OS_PREP: Record<PanelOs, string> = {
  ubuntu24: "",
  ubuntu22: `sudo apt -y install software-properties-common
sudo LC_ALL=C.UTF-8 add-apt-repository -y ppa:ondrej/php
sudo apt update`,
  ubuntu26: `sudo apt -y install curl ca-certificates gnupg2 lsb-release
echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/sury-php.list
curl -fsSL https://packages.sury.org/php/apt.gpg | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/sury-keyring.gpg
sudo apt update`,
  debian12: `sudo apt -y install curl ca-certificates gnupg2 lsb-release
echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/sury-php.list
curl -fsSL https://packages.sury.org/php/apt.gpg | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/sury-keyring.gpg

curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
curl -LsS https://r.mariadb.com/downloads/mariadb_repo_setup | sudo bash

sudo apt update`,
  debian13: `sudo apt -y install curl ca-certificates gnupg2 lsb-release
echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/sury-php.list
curl -fsSL https://packages.sury.org/php/apt.gpg | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/sury-keyring.gpg

sudo apt update
sudo apt -y install cron`,
};

const OS_NOTES: Record<PanelOs, string> = {
  ubuntu24: "Ubuntu 24.04 includes PHP 8.3, so no extra PHP repository is needed.",
  ubuntu22: "Ubuntu 22.04 needs the Ondrej PHP PPA for PHP 8.3.",
  ubuntu26: "Ubuntu 26.04 needs Sury's repository for PHP 8.3.",
  debian12: "Debian 12 also needs the Redis and MariaDB repositories.",
  debian13: "Debian 13 also needs the cron package.",
};

const STEPS: { id: string; label: string; icon: IconName }[] = [
  { id: "requirements", label: "Requirements", icon: "sliders" },
  { id: "dependencies", label: "Dependencies", icon: "download" },
  { id: "panel", label: "Panel & DB", icon: "folder" },
  { id: "configure", label: "Configure", icon: "sliders" },
  { id: "queue", label: "Queue", icon: "terminal" },
  { id: "webserver", label: "NGINX & SSL", icon: "globe" },
  { id: "wings", label: "Wings Node", icon: "satellite" },
  { id: "minecraft", label: "Minecraft", icon: "gamepad" },
];

const PANEL_VERSION = "v2.0.0-beta.2";

const DEPENDENCIES = `sudo apt update
sudo apt -y install php8.3 php8.3-{common,cli,gd,mysql,mbstring,bcmath,xml,fpm,curl,zip,intl} mariadb-server redis-server tar unzip curl nginx

curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
composer --version`;

const DOWNLOAD_PANEL = `sudo mkdir -p /var/www/pterodactyl
cd /var/www/pterodactyl

sudo curl -Lo panel.tar.gz https://github.com/pterodactyl/panel/releases/download/${PANEL_VERSION}/panel.tar.gz
sudo tar -xzvf panel.tar.gz
sudo chmod -R 755 storage/* bootstrap/cache/`;

const CREATE_DATABASE = `sudo mariadb -u root <<'SQL'
CREATE USER 'pterodactyl'@'127.0.0.1' IDENTIFIED BY 'yourPassword';
CREATE DATABASE panel;
GRANT ALL PRIVILEGES ON panel.* TO 'pterodactyl'@'127.0.0.1' WITH GRANT OPTION;
exit
SQL`;

const CONFIGURE_PANEL = `cd /var/www/pterodactyl
sudo cp .env.example .env
sudo COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader
sudo php artisan key:generate --force

sudo php artisan p:environment:setup
sudo php artisan p:environment:database
sudo php artisan p:environment:mail

sudo php artisan migrate --seed --force
sudo php artisan p:user:make

sudo chown -R www-data:www-data /var/www/pterodactyl/*`;

const QUEUE_WORKER = `sudo tee /etc/systemd/system/pteroq.service > /dev/null <<'EOF'
[Unit]
Description=Pterodactyl Queue Worker
After=redis-server.service

[Service]
User=www-data
Group=www-data
Restart=always
ExecStart=/usr/bin/php /var/www/pterodactyl/artisan queue:work --queue=high,standard,low --sleep=3 --tries=3
StartLimitInterval=180
StartLimitBurst=30
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable --now redis-server
sudo systemctl enable --now pteroq.service

# Add the scheduler entry (runs every minute)
(sudo crontab -l 2>/dev/null; echo "* * * * * php /var/www/pterodactyl/artisan schedule:run >> /dev/null 2>&1") | sudo crontab -`;

const WINGS_INSTALL = `sudo mkdir -p /etc/pterodactyl
sudo curl -L -o /usr/local/bin/wings "https://github.com/pterodactyl/wings/releases/latest/download/wings_linux_$([[ "$(uname -m)" == "x86_64" ]] && echo "amd64" || echo "arm64")"
sudo chmod u+x /usr/local/bin/wings

sudo systemctl enable --now docker`;

const WINGS_SERVICE = `sudo tee /etc/systemd/system/wings.service > /dev/null <<'EOF'
[Unit]
Description=Pterodactyl Wings Daemon
After=docker.service
Requires=docker.service
PartOf=docker.service

[Service]
User=root
WorkingDirectory=/etc/pterodactyl
LimitNOFILE=4096
PIDFile=/var/run/wings/daemon.pid
ExecStart=/usr/local/bin/wings
Restart=on-failure
StartLimitInterval=180
StartLimitBurst=30
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable --now wings
sudo systemctl status wings --no-pager`;

const FIREWALL = `sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp
sudo ufw allow 2022/tcp
sudo ufw allow 25565/tcp
sudo ufw reload`;

function buildNginxConfig(domain: string): string {
  const host = domain.trim() || "panel.example.com";
  return `server {
    listen 80;
    listen [::]:80;
    server_name ${host};

    root /var/www/pterodactyl/public;
    index index.html index.htm index.php;
    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ^~ /assets/ {
        location ~ /\\. {
            deny all;
        }
        try_files $uri =404;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    access_log off;
    error_log  /var/log/nginx/pterodactyl.app-error.log error;

    client_max_body_size 100m;
    client_body_timeout 120s;
    sendfile off;

    location ~ \\.php$ {
        fastcgi_split_path_info ^(.+\\.php)(/.+)$;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param PHP_VALUE "upload_max_filesize = 100M \\n post_max_size=100M";
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param HTTP_PROXY "";
        fastcgi_intercept_errors off;
        fastcgi_buffer_size 16k;
        fastcgi_buffers 4 16k;
        fastcgi_connect_timeout 300;
        fastcgi_send_timeout 300;
        fastcgi_read_timeout 300;
    }

    location ~ /\\.ht {
        deny all;
    }
}`;
}

export default function PterodactylPanel() {
  const navigate = useNavigate();
  const [os, setOs] = useState<PanelOs>("ubuntu24");
  const [stepIndex, setStepIndex] = useState(0);
  const [domain, setDomain] = useState("");

  const current = STEPS[stepIndex] ?? STEPS[0];
  const number = stepIndex + 1;
  const host = domain.trim() || "panel.example.com";
  const panelUrl = `https://${host}`;
  const osLabel = OS_LABELS[os];
  const isUbuntu24 = os === "ubuntu24";

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
            <Icon name="rocket" size={22} />
          </span>
          <div className="setup-hero-text">
            <h1>Pterodactyl Panel Setup</h1>
            <p>
              Complete Pterodactyl 2.x guide — install the Panel, configure NGINX and SSL, add a
              Wings node and launch your first Minecraft server.
            </p>
          </div>
          <div className="setup-hero-select">
            <span className="setup-hero-label">Panel OS</span>
            <Select
              className="setup-platform"
              value={os}
              onChange={(next) => setOs(next as PanelOs)}
              options={OS_OPTIONS}
              ariaLabel="Panel operating system"
            />
          </div>
        </header>

        <div className="setup-summary">
          <Icon name={isUbuntu24 ? "server" : "terminal"} size={16} />
          <div>
            <b>{osLabel} · NGINX · PHP 8.3</b>
            <p>{OS_NOTES[os]}</p>
          </div>
        </div>

        <nav className="setup-progress" aria-label="Pterodactyl setup steps">
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
              meta="Panel + Wings"
            >
              <p className="setup-hint">
                The Panel is the website you manage from. Wings runs on each node and starts game
                servers in Docker containers. They can run on the same machine.
              </p>
              <ul className="guide-list">
                <li><strong>Panel:</strong> PHP 8.3/8.4 with the required extensions, MariaDB 10.11/11 or MySQL 8/9, Redis, NGINX/Apache/Caddy and Composer 2.</li>
                <li><strong>Wings:</strong> a Linux node with Docker. KVM virtualization always works; OpenVZ/LXC often does not.</li>
                <li><strong>Ports:</strong> 443 (80 without SSL) for the Panel, 8080 for Wings, 2022 for SFTP and the game ports.</li>
                <li><strong>Operating systems:</strong> Ubuntu 22.04/24.04/26.04 or Debian 12/13.</li>
              </ul>
              <CodeBlock
                label="Check virtualization and kernel"
                code={`systemd-detect-virt\nuname -r\nsudo ss -tulpn | grep -E ':80|:443|:8080|:2022'`}
              />
              <p className="setup-note">
                If <code>systemd-detect-virt</code> returns <code>openvz</code> or <code>lxc</code>,
                Wings may not work. Ask your provider whether Docker is supported.
              </p>
            </Panel>
          )}

          {current.id === "dependencies" && (
            <Panel
              id="dependencies"
              number={number}
              icon="download"
              title="Install Dependencies"
              meta={isUbuntu24 ? "Ubuntu 24.04" : osLabel}
            >
              <p className="setup-hint">
                Install PHP-FPM, MariaDB, Redis, NGINX, Composer and the required PHP extensions.
                {isUbuntu24
                  ? " Ubuntu 24.04 includes PHP 8.3 in its default repositories."
                  : ` Add the repositories for ${osLabel} before running the main install command.`}
              </p>
              {!isUbuntu24 && <CodeBlock label={`Prepare ${osLabel}`} code={OS_PREP[os]} />}
              <CodeBlock label="Install Panel dependencies" code={DEPENDENCIES} />
              <p className="setup-note">
                {OS_NOTES[os]} See the{" "}
                <a href="https://docs.pterodactyl.io/v2/panel/getting-started" target="_blank" rel="noreferrer">
                  official getting started guide
                </a>{" "}
                if your OS needs different repositories.
              </p>
            </Panel>
          )}

          {current.id === "panel" && (
            <Panel
              id="panel"
              number={number}
              icon="folder"
              title="Download the Panel & Create the Database"
              meta={PANEL_VERSION}
            >
              <p className="setup-hint">
                Download the Panel release into <code>/var/www/pterodactyl</code>, make the
                writable folders writable, then create a MariaDB user and database.
              </p>
              <CodeBlock label="Download the Panel" code={DOWNLOAD_PANEL} />
              <p className="setup-hint">
                Replace <code>yourPassword</code> with a strong, unique password. The Panel
                connects to the database over <code>127.0.0.1</code>.
              </p>
              <CodeBlock label="Create the database" code={CREATE_DATABASE} />
              <p className="setup-note">
                Reinstall or update an existing Panel? Do not create a new database or overwrite{" "}
                <code>.env</code> — follow the upgrade guide instead.
              </p>
            </Panel>
          )}

          {current.id === "configure" && (
            <Panel
              id="configure"
              number={number}
              icon="sliders"
              title="Configure the Panel & Create an Admin"
              meta="APP_KEY · database · admin"
            >
              <p className="setup-hint">
                Copy the example environment file, install PHP dependencies and generate the
                application key. Then run the setup commands, migrate the database and create your
                admin account.
              </p>
              <CodeBlock label="Configure and install" code={CONFIGURE_PANEL} />
              <p className="setup-note">
                <strong>Back up <code>APP_KEY</code>.</strong> It encrypts API keys, node tokens and
                2FA secrets. If you lose it, that data cannot be recovered, even from a database
                backup. Print it with{" "}
                <code>grep APP_KEY /var/www/pterodactyl/.env</code>.
              </p>
            </Panel>
          )}

          {current.id === "queue" && (
            <Panel
              id="queue"
              number={number}
              icon="terminal"
              title="Start the Queue Worker & Scheduler"
              meta="Redis · systemd · cron"
            >
              <p className="setup-hint">
                Pterodactyl sends email, runs schedules and handles background jobs through Redis,
                a queue worker and a cron entry.
              </p>
              <CodeBlock label="Queue worker and scheduler" code={QUEUE_WORKER} />
              <p className="setup-note">
                Check the worker with <code>systemctl status pteroq</code> and the scheduler with{" "}
                <code>sudo crontab -l</code>. Both must be running before you rely on schedules or
                email.
              </p>
            </Panel>
          )}

          {current.id === "webserver" && (
            <Panel
              id="webserver"
              number={number}
              icon="globe"
              title="Configure NGINX & HTTPS"
              meta="Domain · Certbot"
            >
              <p className="setup-hint">
                Enter your Panel domain, create the NGINX site and enable it, then request a free
                Let's Encrypt certificate with Certbot.
              </p>
              <div className="setup-fields">
                <div className="setup-field wide">
                  <label htmlFor="ptero-domain">Panel domain</label>
                  <TextField
                    id="ptero-domain"
                    value={domain}
                    onChange={(event) => setDomain(event.target.value)}
                    placeholder="panel.example.com"
                    spellCheck={false}
                  />
                </div>
              </div>
              <CodeBlock
                label="Create the NGINX site"
                code={`sudo rm -f /etc/nginx/sites-enabled/default
sudo tee /etc/nginx/sites-available/pterodactyl.conf > /dev/null <<'EOF'
${buildNginxConfig(host)}
EOF
sudo ln -sf /etc/nginx/sites-available/pterodactyl.conf /etc/nginx/sites-enabled/pterodactyl.conf
sudo nginx -t
sudo systemctl restart nginx`}
              />
              <CodeBlock
                label="Enable HTTPS"
                code={`sudo apt -y install certbot python3-certbot-nginx
sudo certbot --nginx -d ${host}`}
              />
              <div className="guide-access">
                <span>Panel URL</span>
                <code>{panelUrl}</code>
              </div>
              <p className="setup-note">
                After enabling HTTPS, set <code>APP_URL=https://{host}</code> in{" "}
                <code>/var/www/pterodactyl/.env</code> and run{" "}
                <code>sudo -u www-data php artisan config:clear</code>. Use Apache or Caddy instead?
                See the official webserver configuration guide.
              </p>
            </Panel>
          )}

          {current.id === "wings" && (
            <Panel
              id="wings"
              number={number}
              icon="satellite"
              title="Install Wings & Add a Node"
              meta="Node · 8080 · 2022"
            >
              <p className="setup-hint">
                Create the node in <strong>Admin → Nodes → New node</strong> first. Use port 8080
                for the daemon and 2022 for SFTP. Then install Wings on the node and deploy its
                configuration.
              </p>
              <CodeBlock label="Install Wings" code={WINGS_INSTALL} />
              <CodeBlock
                label="Deploy the node configuration"
                code={`cd /etc/pterodactyl
sudo wings configure --panel-url ${panelUrl} --token ptla_... --node 1`}
              />
              <p className="setup-hint">
                The token and node ID come from the node's <strong>Configuration</strong> tab.
                Generate a token there, run the command, then start Wings as a service.
              </p>
              <CodeBlock label="Run Wings with systemd" code={WINGS_SERVICE} />
              <p className="setup-hint">
                Add allocations in the node's <strong>Allocation</strong> tab. Use the node's public
                IP for player-facing servers — not <code>127.0.0.1</code>.
              </p>
              <CodeBlock label="Find the node IP" code={`hostname -I | awk '{print $1}'`} />
              <p className="setup-note">
                If the Panel uses HTTPS, Wings needs its own SSL certificate for the node's domain.
                The Panel must reach Wings on port 8080, and Wings must reach the Panel on 443.
              </p>
            </Panel>
          )}

          {current.id === "minecraft" && (
            <Panel
              id="minecraft"
              number={number}
              icon="gamepad"
              title="Create a Minecraft Server & Connect"
              meta="Egg · allocation · port"
            >
              <p className="setup-hint">
                Open <strong>Admin → Servers → Create Server</strong>, choose the node and a
                Minecraft egg such as Paper, assign an allocation and start the server.
              </p>
              <ol className="guide-list guide-list-numbered">
                <li>Name the server and select the Wings node.</li>
                <li>Choose the Paper egg (or another Minecraft egg) and set memory and disk.</li>
                <li>Assign a port allocation, such as <code>25565</code>.</li>
                <li>Create the server and wait for the installation to finish.</li>
                <li>Start it, then accept the EULA in the File Manager if the server stops.</li>
              </ol>
              <CodeBlock label="Open firewall ports" code={FIREWALL} />
              <p className="setup-hint">
                To import an existing server, stop both servers and upload the world, plugins and
                configs over SFTP on port 2022. Keep the JAR name expected by the egg.
              </p>
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
                <button className="setup-btn secondary" type="button" onClick={() => navigate("/minecraft/make-server/server.jar-downloader.html")}>
                  <Icon name="package" size={14} /> Get a Server JAR
                </button>
              </div>
              <p className="setup-note">
                Need more help? Read the{" "}
                <a href="https://docs.pterodactyl.io/v2/panel/getting-started" target="_blank" rel="noreferrer">
                  Panel getting started guide
                </a>{" "}
                and{" "}
                <a href="https://docs.pterodactyl.io/v2/wings/installing" target="_blank" rel="noreferrer">
                  Wings installation guide
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
              href="https://docs.pterodactyl.io/v2/panel/getting-started"
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
