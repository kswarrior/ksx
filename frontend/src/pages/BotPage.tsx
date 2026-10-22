import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  BOT_ENVIRONMENTS,
  DEFAULT_BOT_FOLDER,
  buildManageCommands,
  getBotEnvironment,
  getBotProcessManager,
  safeFolderPath,
  safeProcessName,
  type BotEnvironmentId,
  type BotProcessManagerId,
} from "../lib/botSetup";
import "./BotPage.css";

const WIZARD_STEPS = [
  { id: 1, label: "Environment" },
  { id: 2, label: "Setup" },
  { id: 3, label: "Configure" },
  { id: 4, label: "Run" },
];

const authOptions: SelectOption[] = [
  { value: "offline", label: "Offline / cracked" },
  { value: "microsoft", label: "Microsoft / premium" },
];

const nodeOptions: SelectOption[] = [
  { value: "install", label: "No — install Node.js" },
  { value: "ready", label: "Yes — already installed" },
];

const environmentOptions: SelectOption[] = BOT_ENVIRONMENTS.map((item) => ({
  value: item.id,
  label: item.label,
  keywords: item.description,
}));

const viewDistanceOptions: SelectOption[] = [
  { value: "8", label: "Short · 8 chunks" },
  { value: "12", label: "Normal · 12 chunks" },
  { value: "16", label: "Far · 16 chunks" },
  { value: "24", label: "Very far · 24 chunks" },
  { value: "32", label: "Maximum · 32 chunks" },
];

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
  note?: string;
};

function SetupStep({ number, title, command, copyId, copied, onCopy, note }: SetupStepProps) {
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
        <pre className="bot-step-code">{command}</pre>
        {note && <p className="bot-step-note">{note}</p>}
      </div>
    </div>
  );
}

type InstallStep = {
  id: string;
  title: string;
  command: string;
  note?: string;
};

export default function BotPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [environmentId, setEnvironmentId] = useState<BotEnvironmentId>("linux");
  const [nodeReady, setNodeReady] = useState(false);
  const [processManager, setProcessManager] = useState<BotProcessManagerId>("pm2");
  const [folder, setFolder] = useState(DEFAULT_BOT_FOLDER);

  const [host, setHost] = useState(DEFAULT_BOT_CONFIG.host);
  const [port, setPort] = useState(String(DEFAULT_BOT_CONFIG.port));
  const [username, setUsername] = useState(DEFAULT_BOT_CONFIG.username);
  const [owners, setOwners] = useState(DEFAULT_BOT_CONFIG.owners.join(", "));
  const [auth, setAuth] = useState<BotAuth>(DEFAULT_BOT_CONFIG.auth);
  const [version, setVersion] = useState(DEFAULT_BOT_CONFIG.version);
  const [serverPassword, setServerPassword] = useState(DEFAULT_BOT_CONFIG.serverPassword);
  const [loginCommand, setLoginCommand] = useState(DEFAULT_BOT_CONFIG.loginCommand);
  const [loginDelay, setLoginDelay] = useState(String(DEFAULT_BOT_CONFIG.loginDelay));
  const [prefix, setPrefix] = useState(DEFAULT_BOT_CONFIG.prefix);
  const [reconnectDelay, setReconnectDelay] = useState(String(DEFAULT_BOT_CONFIG.reconnectDelay));
  const [autoEat, setAutoEat] = useState(DEFAULT_BOT_CONFIG.autoEat);
  const [eatThreshold, setEatThreshold] = useState(String(DEFAULT_BOT_CONFIG.eatThreshold));
  const [antiAfkJump, setAntiAfkJump] = useState(DEFAULT_BOT_CONFIG.antiAfkJump);
  const [jumpInterval, setJumpInterval] = useState(String(DEFAULT_BOT_CONFIG.jumpInterval));
  const [antiAfkWalk, setAntiAfkWalk] = useState(DEFAULT_BOT_CONFIG.antiAfkWalk);
  const [walkInterval, setWalkInterval] = useState(String(DEFAULT_BOT_CONFIG.walkInterval));
  const [autoTotem, setAutoTotem] = useState(DEFAULT_BOT_CONFIG.autoTotem);
  const [autoArmor, setAutoArmor] = useState(DEFAULT_BOT_CONFIG.autoArmor);
  const [autoDefend, setAutoDefend] = useState(DEFAULT_BOT_CONFIG.autoDefend);
  const [viewDistance, setViewDistance] = useState(String(DEFAULT_BOT_CONFIG.viewDistance));
  const [copied, setCopied] = useState<string | null>(null);

  const environment = getBotEnvironment(environmentId);
  const manager = getBotProcessManager(processManager);
  const folderName = safeFolderPath(folder);

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
    serverPassword,
    loginCommand,
    loginDelay: toInt(loginDelay, DEFAULT_BOT_CONFIG.loginDelay),
    prefix,
    reconnectDelay: toInt(reconnectDelay, DEFAULT_BOT_CONFIG.reconnectDelay),
    autoEat,
    eatThreshold: toInt(eatThreshold, DEFAULT_BOT_CONFIG.eatThreshold),
    antiAfkJump,
    jumpInterval: toInt(jumpInterval, DEFAULT_BOT_CONFIG.jumpInterval),
    antiAfkWalk,
    walkInterval: toInt(walkInterval, DEFAULT_BOT_CONFIG.walkInterval),
    autoTotem,
    autoArmor,
    autoDefend,
    viewDistance: toInt(viewDistance, DEFAULT_BOT_CONFIG.viewDistance),
  };

  const normalized = normalizeBotConfig(config);
  const code = generateBotScript(config);
  const lineCount = code.split("\n").length;
  const byteSize = new TextEncoder().encode(code).length;
  const displayPrefix = normalized.prefix;
  const botProcessName = safeProcessName(normalized.username);
  const serverAddress =
    normalized.host.includes(":") || normalized.port === 25565
      ? normalized.host
      : `${normalized.host}:${normalized.port}`;

  const managerOptions: SelectOption[] = environment.managers.map((id) => {
    const item = getBotProcessManager(id);
    return { value: item.id, label: item.label, keywords: item.description };
  });

  const setupSteps: InstallStep[] = [];
  if (!nodeReady) {
    setupSteps.push({
      id: "node",
      title: "Install Node.js 22 LTS",
      command: environment.installNode,
      note: environment.installNodeNote,
    });
  }
  setupSteps.push({
    id: "verify",
    title: "Verify Node.js and npm",
    command: environment.verifyNode,
  });
  setupSteps.push({
    id: "project",
    title: `Create ${folderName} and install dependencies`,
    command: environment.createProject(folderName),
  });
  if (processManager === "pm2") {
    setupSteps.push({
      id: "pm2",
      title: "Install PM2",
      command: environment.installPm2,
      note: "If npm reports a permissions error on Linux, rerun with sudo.",
    });
  }
  if (processManager === "screen" && environment.installScreen) {
    setupSteps.push({
      id: "screen",
      title: "Install screen",
      command: environment.installScreen,
    });
  }

  const writeCommand = environment.writeFile(folderName, code);
  const manageCommands = buildManageCommands(
    environmentId,
    processManager,
    folderName,
    botProcessName
  );

  function changeEnvironment(next: BotEnvironmentId) {
    setEnvironmentId(next);
    const nextEnvironment = getBotEnvironment(next);
    if (!nextEnvironment.managers.includes(processManager)) {
      setProcessManager(nextEnvironment.managers[0]);
    }
  }

  function goToStep(next: number) {
    setStep(next);
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

  function openStatics() {
    navigate(`/minecraft/server/statics.html?ip=${encodeURIComponent(serverAddress)}`);
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

        <div className="bot-progress" aria-label="Bot setup progress">
          {WIZARD_STEPS.map((item) => {
            const isActive = step === item.id;
            const isDone = step > item.id;
            return (
              <div
                key={item.id}
                className={`bot-progress-step ${isActive ? "is-active" : ""} ${
                  isDone ? "is-done" : ""
                }`}
              >
                <span className="bot-progress-num">
                  {isDone ? <Icon name="check" size={11} /> : item.id}
                </span>
                <b>{item.label}</b>
              </div>
            );
          })}
        </div>

        {step === 1 && (
          <div className="bot-stage bot-anim" key="step-1">
            <section className="bot-panel">
              <div className="bot-panel-head">
                <div className="bot-panel-title">
                  <Icon name="globe" size={15} />
                  <h2>Environment</h2>
                </div>
                <span className="bot-panel-meta">Step 1 of 4</span>
              </div>

              <div className="bot-fields">
                <div className="bot-field wide">
                  <label>Where will the bot run?</label>
                  <Select
                    value={environmentId}
                    onChange={(next) => changeEnvironment(next as BotEnvironmentId)}
                    options={environmentOptions}
                    ariaLabel="Bot environment"
                    searchable
                    searchPlaceholder="Search environments…"
                  />
                </div>
                <div className="bot-field">
                  <label>Node.js installed?</label>
                  <Select
                    value={nodeReady ? "ready" : "install"}
                    onChange={(next) => setNodeReady(next === "ready")}
                    options={nodeOptions}
                    ariaLabel="Node.js installed"
                  />
                </div>
                <div className="bot-field">
                  <label>Process manager</label>
                  <Select
                    value={processManager}
                    onChange={(next) => setProcessManager(next as BotProcessManagerId)}
                    options={managerOptions}
                    ariaLabel="Process manager"
                  />
                </div>
                <div className="bot-field wide">
                  <label>Project folder</label>
                  <TextField
                    value={folder}
                    onChange={(event) => setFolder(event.target.value)}
                    placeholder={DEFAULT_BOT_FOLDER}
                    spellCheck={false}
                  />
                  <p className="bot-step-note">
                    Folder names are created inside your home directory. The default is{" "}
                    <code>{DEFAULT_BOT_FOLDER}</code>, so every command works from any directory.
                  </p>
                </div>
              </div>

              <div className="bot-env-summary">
                <Icon name="terminal" size={16} />
                <div>
                  <b>{environment.label}</b>
                  <p>
                    {environment.description} {manager.description}
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {step === 2 && (
          <div className="bot-stage bot-anim" key="step-2">
            <section className="bot-panel">
              <div className="bot-panel-head">
                <div className="bot-panel-title">
                  <Icon name="rocket" size={15} />
                  <h2>Environment setup</h2>
                </div>
                <span className="bot-panel-meta">{environment.label}</span>
              </div>

              <p className="bot-hint">
                Run these commands in order on your host. They always use your home folder, so you
                can run them from any directory. If setup was interrupted, re-run the failed step —
                the commands are safe to repeat. The next step generates <code>bot.js</code> and its
                save command.
              </p>

              <div className="bot-steps">
                {setupSteps.map((item, index) => (
                  <SetupStep
                    key={item.id}
                    number={index + 1}
                    title={item.title}
                    command={item.command}
                    note={item.note}
                    copyId={`setup-${item.id}`}
                    copied={copied}
                    onCopy={copy}
                  />
                ))}
              </div>

              <p className="bot-note">
                Project folder: <code>{folderName}</code> · Process manager:{" "}
                <code>{manager.label}</code>. Keep this page open; the commands are generated
                from the options you selected.
              </p>
            </section>
          </div>
        )}

        {step === 3 && (
          <div className="bot-stage bot-anim" key="step-3">
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
                  <label>{auth === "microsoft" ? "Microsoft email" : "Bot username"}</label>
                  <TextField
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder={auth === "microsoft" ? "you@example.com" : "KSBot"}
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

            {auth === "microsoft" && (
              <section className="bot-panel">
                <div className="bot-panel-head">
                  <div className="bot-panel-title">
                    <Icon name="sparkles" size={15} />
                    <h2>Premium server login</h2>
                  </div>
                  <span className="bot-panel-meta">Microsoft account</span>
                </div>

                <p className="bot-hint">
                  Mineflayer prints a Microsoft device code in the terminal. Open the link it shows,
                  enter the code, and finish the sign-in. No Microsoft password is stored in{" "}
                  <code>bot.js</code>.
                </p>

                <div className="bot-fields">
                  <div className="bot-field">
                    <label>Server password (optional)</label>
                    <TextField
                      type="password"
                      value={serverPassword}
                      onChange={(event) => setServerPassword(event.target.value)}
                      placeholder="Server /login password"
                      autoComplete="new-password"
                      spellCheck={false}
                    />
                  </div>
                  <div className="bot-field">
                    <label>Login delay (s)</label>
                    <TextField
                      value={loginDelay}
                      onChange={(event) => setLoginDelay(event.target.value)}
                      inputMode="numeric"
                      placeholder="3"
                    />
                  </div>
                  <div className="bot-field wide">
                    <label>Login command (optional)</label>
                    <TextField
                      value={loginCommand}
                      onChange={(event) => setLoginCommand(event.target.value)}
                      placeholder="/login {password}"
                      spellCheck={false}
                    />
                    <p className="bot-step-note">
                      Leave empty to send <code>/login password</code>. You can use{" "}
                      <code>{"{password}"}</code> and <code>{"{username}"}</code>. For a first
                      join, use <code>/register {"{password}"} {"{password}"}</code>.
                    </p>
                  </div>
                </div>

                <p className="bot-note">
                  This is your Minecraft server password, not your Microsoft password. It is saved
                  in <code>bot.js</code> as plain text, so keep the file private.
                </p>
              </section>
            )}

            <section className="bot-panel">
              <div className="bot-panel-head">
                <div className="bot-panel-title">
                  <Icon name="sliders" size={15} />
                  <h2>Behavior</h2>
                </div>
                <span className="bot-panel-meta">Reconnect {normalized.reconnectDelay}s</span>
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
                <label className="bot-toggle">
                  <input
                    type="checkbox"
                    checked={autoTotem}
                    onChange={(event) => setAutoTotem(event.target.checked)}
                  />
                  <span>Auto-totem</span>
                </label>
                <label className="bot-toggle">
                  <input
                    type="checkbox"
                    checked={autoArmor}
                    onChange={(event) => setAutoArmor(event.target.checked)}
                  />
                  <span>Auto-armor</span>
                </label>
                <label className="bot-toggle">
                  <input
                    type="checkbox"
                    checked={autoDefend}
                    onChange={(event) => setAutoDefend(event.target.checked)}
                  />
                  <span>Auto-defend</span>
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
                  <Icon name="folder" size={15} />
                  <h2>Save bot.js</h2>
                </div>
                <span className="bot-panel-meta">
                  {environment.label} · {folderName}/bot.js
                </span>
              </div>

              <p className="bot-hint">{environment.writeHint}</p>
              <pre className="bot-save-command">{writeCommand}</pre>

              <div className="bot-save-actions">
                <button
                  type="button"
                  className="bot-btn secondary"
                  onClick={() => copy(writeCommand, "write")}
                >
                  <Icon name={copied === "write" ? "check" : "copy"} size={14} />
                  {copied === "write" ? "Copied" : "Copy Save Command"}
                </button>
                <button type="button" className="bot-btn secondary" onClick={downloadBot}>
                  <Icon name="download" size={14} />
                  Download bot.js
                </button>
              </div>
            </section>
          </div>
        )}

        {step === 4 && (
          <div className="bot-stage bot-anim" key="step-4">
            <section className="bot-panel">
              <div className="bot-panel-head">
                <div className="bot-panel-title">
                  <Icon name="play" size={15} />
                  <h2>Run &amp; manage</h2>
                </div>
                <span className="bot-panel-meta">
                  {manager.label} · {folderName}
                </span>
              </div>

              <p className="bot-hint">{manager.description}</p>

              <div className="bot-manage-grid">
                {manageCommands.map((item) => (
                  <div className="bot-manage-card" key={item.id}>
                    <div className="bot-manage-head">
                      <h3>{item.label}</h3>
                      {item.command && (
                        <button
                          type="button"
                          className="bot-mini-btn"
                          onClick={() => copy(item.command!, `manage-${item.id}`)}
                        >
                          <Icon
                            name={copied === `manage-${item.id}` ? "check" : "copy"}
                            size={12}
                          />
                          {copied === `manage-${item.id}` ? "Copied" : "Copy"}
                        </button>
                      )}
                    </div>
                    {item.command ? (
                      <pre className="bot-manage-command">{item.command}</pre>
                    ) : (
                      <p className="bot-manage-note">{item.note}</p>
                    )}
                    {item.command && item.note && (
                      <p className="bot-manage-note">{item.note}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="bot-save-actions">
                <button type="button" className="bot-btn secondary" onClick={downloadBot}>
                  <Icon name="download" size={14} />
                  Download bot.js
                </button>
              </div>

              {processManager === "pm2" && (
                <p className="bot-note">
                  PM2 keeps the process alive after the terminal closes. To start it after a reboot,
                  run <code>pm2 startup</code>, execute the command it prints, then run{" "}
                  <code>pm2 save</code>.
                </p>
              )}
            </section>

            <section className="bot-panel bot-check-panel">
              <div className="bot-check-row">
                <span className="bot-check-icon" aria-hidden>
                  <Icon name="globe" size={20} />
                </span>
                <div className="bot-check-copy">
                  <h2>Check if the bot joined</h2>
                  <p>
                    Open MC Statics for <code>{serverAddress}</code>. Compare the player count
                    before and after starting the bot; <b>{normalized.username}</b> should join the
                    server.
                  </p>
                </div>
                <button type="button" className="bot-btn primary" onClick={openStatics}>
                  <Icon name="external-link" size={14} />
                  Open MC Statics
                </button>
              </div>
            </section>

            <section className="bot-panel">
              <div className="bot-panel-head">
                <div className="bot-panel-title">
                  <Icon name="terminal" size={15} />
                  <h2>Bot commands</h2>
                </div>
                <span className="bot-panel-meta">
                  Owner only · {displayPrefix} prefix
                </span>
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
                Commands are sent in public chat. Senders that are not in the owner list are
                ignored.
              </p>
            </section>
          </div>
        )}

        <div className="bot-nav">
          {step > 1 && (
            <button className="bot-btn secondary" onClick={() => goToStep(step - 1)}>
              <Icon name="arrow-left" size={14} />
              Back
            </button>
          )}
          {step < 4 ? (
            <button className="bot-btn primary bot-nav-next" onClick={() => goToStep(step + 1)}>
              Next
              <Icon name="arrow-right" size={14} />
            </button>
          ) : (
            <button className="bot-btn primary bot-nav-next" onClick={openStatics}>
              <Icon name="external-link" size={14} />
              Check Server
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
