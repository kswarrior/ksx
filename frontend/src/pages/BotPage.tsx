import { useState } from "react";
import Icon from "../components/Icon";
import { Select, TextField, type SelectOption } from "../components/ui";
import {
  BOT_COMMANDS,
  DEFAULT_BOT_CONFIG,
  generateBotScript,
  normalizeBotConfig,
  type BotAuth,
  type BotConfig,
} from "../lib/minecraftBot";
import "./BotPage.css";

const authOptions: SelectOption[] = [
  { value: "offline", label: "Offline / cracked" },
  { value: "microsoft", label: "Microsoft / premium" },
];

const viewDistanceOptions: SelectOption[] = [
  { value: "8", label: "Short · 8 chunks" },
  { value: "12", label: "Normal · 12 chunks" },
  { value: "16", label: "Far · 16 chunks" },
  { value: "24", label: "Very far · 24 chunks" },
  { value: "32", label: "Maximum · 32 chunks" },
];

const INSTALL_NODE =
  "curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs";
const INSTALL_PROJECT =
  "mkdir -p mc-bot && cd mc-bot && npm init -y && npm install mineflayer mineflayer-pathfinder vec3";
const RUN_BOT = "cd mc-bot && node bot.js";

function toInt(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

type SetupStepProps = {
  number: number;
  title: string;
  command: string;
  copyId: string;
  copied: string | null;
  onCopy: (value: string, id: string) => void;
};

function SetupStep({ number, title, command, copyId, copied, onCopy }: SetupStepProps) {
  const isCopied = copied === copyId;
  return (
    <div className="bot-step">
      <span className="bot-step-number">{number}</span>
      <div className="bot-step-body">
        <div className="bot-step-head">
          <h3>{title}</h3>
          <button
            type="button"
            className="bot-mini-btn"
            onClick={() => onCopy(command, copyId)}
          >
            <Icon name={isCopied ? "check" : "copy"} size={12} />
            {isCopied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="bot-command">{command}</pre>
      </div>
    </div>
  );
}

export default function BotPage() {
  const [host, setHost] = useState(DEFAULT_BOT_CONFIG.host);
  const [port, setPort] = useState(String(DEFAULT_BOT_CONFIG.port));
  const [username, setUsername] = useState(DEFAULT_BOT_CONFIG.username);
  const [owners, setOwners] = useState(DEFAULT_BOT_CONFIG.owners.join(", "));
  const [auth, setAuth] = useState<BotAuth>(DEFAULT_BOT_CONFIG.auth);
  const [version, setVersion] = useState(DEFAULT_BOT_CONFIG.version);
  const [prefix, setPrefix] = useState(DEFAULT_BOT_CONFIG.prefix);
  const [reconnectDelay, setReconnectDelay] = useState(String(DEFAULT_BOT_CONFIG.reconnectDelay));
  const [autoEat, setAutoEat] = useState(DEFAULT_BOT_CONFIG.autoEat);
  const [eatThreshold, setEatThreshold] = useState(String(DEFAULT_BOT_CONFIG.eatThreshold));
  const [antiAfkJump, setAntiAfkJump] = useState(DEFAULT_BOT_CONFIG.antiAfkJump);
  const [jumpInterval, setJumpInterval] = useState(String(DEFAULT_BOT_CONFIG.jumpInterval));
  const [antiAfkWalk, setAntiAfkWalk] = useState(DEFAULT_BOT_CONFIG.antiAfkWalk);
  const [walkInterval, setWalkInterval] = useState(String(DEFAULT_BOT_CONFIG.walkInterval));
  const [viewDistance, setViewDistance] = useState(String(DEFAULT_BOT_CONFIG.viewDistance));
  const [copied, setCopied] = useState<string | null>(null);

  const config: BotConfig = {
    host,
    port: toInt(port, DEFAULT_BOT_CONFIG.port),
    username,
    owners: owners
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean),
    auth,
    version,
    prefix,
    reconnectDelay: toInt(reconnectDelay, DEFAULT_BOT_CONFIG.reconnectDelay),
    autoEat,
    eatThreshold: toInt(eatThreshold, DEFAULT_BOT_CONFIG.eatThreshold),
    antiAfkJump,
    jumpInterval: toInt(jumpInterval, DEFAULT_BOT_CONFIG.jumpInterval),
    antiAfkWalk,
    walkInterval: toInt(walkInterval, DEFAULT_BOT_CONFIG.walkInterval),
    viewDistance: toInt(viewDistance, DEFAULT_BOT_CONFIG.viewDistance),
  };

  const normalized = normalizeBotConfig(config);
  const code = generateBotScript(config);
  const lineCount = code.split("\n").length;
  const byteSize = new TextEncoder().encode(code).length;
  const displayPrefix = normalized.prefix;

  async function copy(value: string, id: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      window.setTimeout(() => setCopied((current) => (current === id ? null : current)), 1400);
    } catch {
      setCopied(null);
    }
  }

  function downloadBot() {
    const blob = new Blob([code], { type: "text/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bot.js";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="bot-page">
      <div className="bot-bg" aria-hidden>
        <div className="bot-bg-grad" />
        <div className="bot-bg-orb o1" />
        <div className="bot-bg-orb o2" />
      </div>

      <div className="bot-shell">
        <header className="bot-hero">
          <span className="bot-hero-icon" aria-hidden>
            <Icon name="bot" size={22} />
          </span>
          <div className="bot-hero-text">
            <h1>Minecraft Bot</h1>
          </div>
        </header>

        <section className="bot-panel">
          <div className="bot-panel-head">
            <div className="bot-panel-title">
              <Icon name="globe" size={15} />
              <h2>Connection</h2>
            </div>
            <span className="bot-panel-meta">
              {normalized.host}:{normalized.port}
            </span>
          </div>

          <div className="bot-fields">
            <div className="bot-field wide">
              <label>Server IP</label>
              <TextField
                value={host}
                onChange={(event) => setHost(event.target.value)}
                placeholder="play.example.com"
                spellCheck={false}
              />
            </div>
            <div className="bot-field">
              <label>Port</label>
              <TextField
                value={port}
                onChange={(event) => setPort(event.target.value)}
                inputMode="numeric"
                placeholder="25565"
              />
            </div>
            <div className="bot-field">
              <label>Bot username</label>
              <TextField
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="KSBot"
                spellCheck={false}
              />
            </div>
            <div className="bot-field wide">
              <label>Owner usernames</label>
              <TextField
                value={owners}
                onChange={(event) => setOwners(event.target.value)}
                placeholder="YourMinecraftName, FriendName"
                spellCheck={false}
              />
            </div>
            <div className="bot-field">
              <label>Authentication</label>
              <Select
                value={auth}
                onChange={(next) => setAuth(next as BotAuth)}
                options={authOptions}
                ariaLabel="Authentication"
              />
            </div>
            <div className="bot-field">
              <label>Minecraft version</label>
              <TextField
                value={version}
                onChange={(event) => setVersion(event.target.value)}
                placeholder="Auto-detect"
                spellCheck={false}
              />
            </div>
          </div>
        </section>

        <section className="bot-panel">
          <div className="bot-panel-head">
            <div className="bot-panel-title">
              <Icon name="sliders" size={15} />
              <h2>Behavior</h2>
            </div>
            <span className="bot-panel-meta">
              Reconnect {normalized.reconnectDelay}s
            </span>
          </div>

          <div className="bot-fields">
            <div className="bot-field">
              <label>Reconnect delay (s)</label>
              <TextField
                value={reconnectDelay}
                onChange={(event) => setReconnectDelay(event.target.value)}
                inputMode="numeric"
                placeholder="5"
              />
            </div>
            <div className="bot-field">
              <label>Eat below food level</label>
              <TextField
                value={eatThreshold}
                onChange={(event) => setEatThreshold(event.target.value)}
                inputMode="numeric"
                placeholder="15"
                disabled={!autoEat}
              />
            </div>
            <div className="bot-field">
              <label>Jump interval (s)</label>
              <TextField
                value={jumpInterval}
                onChange={(event) => setJumpInterval(event.target.value)}
                inputMode="numeric"
                placeholder="45"
                disabled={!antiAfkJump}
              />
            </div>
            <div className="bot-field">
              <label>Walk interval (s)</label>
              <TextField
                value={walkInterval}
                onChange={(event) => setWalkInterval(event.target.value)}
                inputMode="numeric"
                placeholder="60"
                disabled={!antiAfkWalk}
              />
            </div>
            <div className="bot-field">
              <label>View distance</label>
              <Select
                value={viewDistance}
                onChange={setViewDistance}
                options={viewDistanceOptions}
                ariaLabel="View distance"
              />
            </div>
            <div className="bot-field">
              <label>Command prefix</label>
              <TextField
                value={prefix}
                onChange={(event) => setPrefix(event.target.value)}
                placeholder="!"
                maxLength={3}
                spellCheck={false}
              />
            </div>
          </div>

          <div className="bot-toggle-row">
            <label className="bot-toggle">
              <input
                type="checkbox"
                checked={autoEat}
                onChange={(event) => setAutoEat(event.target.checked)}
              />
              <span>Auto-eat</span>
            </label>
            <label className="bot-toggle">
              <input
                type="checkbox"
                checked={antiAfkJump}
                onChange={(event) => setAntiAfkJump(event.target.checked)}
              />
              <span>Anti-AFK jump</span>
            </label>
            <label className="bot-toggle">
              <input
                type="checkbox"
                checked={antiAfkWalk}
                onChange={(event) => setAntiAfkWalk(event.target.checked)}
              />
              <span>Anti-AFK walk</span>
            </label>
          </div>
        </section>

        <section className="bot-panel bot-code-panel">
          <div className="bot-code-head">
            <span className="bot-code-icon" aria-hidden>
              <Icon name="terminal" size={18} />
            </span>
            <div className="bot-code-text">
              <h2>bot.js</h2>
              <p>
                {lineCount} lines · {(byteSize / 1024).toFixed(1)} KB · mineflayer
              </p>
            </div>
            <div className="bot-code-actions">
              <button
                type="button"
                className="bot-btn secondary"
                onClick={() => copy(code, "code")}
              >
                <Icon name={copied === "code" ? "check" : "copy"} size={14} />
                {copied === "code" ? "Copied" : "Copy Code"}
              </button>
              <button type="button" className="bot-btn primary" onClick={downloadBot}>
                <Icon name="download" size={14} />
                Download bot.js
              </button>
            </div>
          </div>
          <pre className="bot-preview" tabIndex={0}>
            {code}
          </pre>
        </section>

        <section className="bot-panel">
          <div className="bot-panel-head">
            <div className="bot-panel-title">
              <Icon name="rocket" size={15} />
              <h2>Setup</h2>
            </div>
            <span className="bot-panel-meta">Linux / VPS</span>
          </div>

          <div className="bot-steps">
            <SetupStep
              number={1}
              title="Install Node.js 22 LTS"
              command={INSTALL_NODE}
              copyId="node"
              copied={copied}
              onCopy={copy}
            />
            <SetupStep
              number={2}
              title="Create the project and install dependencies"
              command={INSTALL_PROJECT}
              copyId="project"
              copied={copied}
              onCopy={copy}
            />
            <SetupStep
              number={3}
              title="Start the bot"
              command={RUN_BOT}
              copyId="run"
              copied={copied}
              onCopy={copy}
            />
          </div>

          <p className="bot-note">
            Save the generated file as <code>bot.js</code> inside <code>mc-bot</code>. Microsoft
            authentication prints a device-code link in the console on first run. Use{" "}
            <code>screen</code>, <code>tmux</code>, or a process manager to keep the bot online.
          </p>
        </section>

        <section className="bot-panel">
          <div className="bot-panel-head">
            <div className="bot-panel-title">
              <Icon name="terminal" size={15} />
              <h2>Commands</h2>
            </div>
            <span className="bot-panel-meta">Owner only · {displayPrefix} prefix</span>
          </div>

          <div className="bot-command-grid">
            {BOT_COMMANDS.map((item) => (
              <div className="bot-command" key={item.command}>
                <code>
                  {displayPrefix}
                  {item.command}
                </code>
                <span>{item.description}</span>
              </div>
            ))}
          </div>

          <p className="bot-note">
            Commands are sent in public chat. Senders that are not in the owner list are ignored.
          </p>
        </section>
      </div>
    </div>
  );
}
