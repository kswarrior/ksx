export type BotEnvironmentId = "linux" | "powershell" | "cmd" | "termux" | "macos";
export type BotProcessManagerId = "pm2" | "screen" | "foreground";

export const DEFAULT_BOT_FOLDER = "~/ks-bot";

const BOT_DEPENDENCIES = "mineflayer mineflayer-pathfinder vec3";
const NPM_INSTALL_FLAGS = "--no-audit --no-fund";

export type BotEnvironment = {
  id: BotEnvironmentId;
  label: string;
  description: string;
  managers: BotProcessManagerId[];
  installNode: string;
  installNodeNote?: string;
  verifyNode: string;
  createProject: (folder: string) => string;
  installPm2: string;
  installScreen?: string;
  writeFile: (folder: string, code: string) => string;
  writeHint: string;
};

export type BotProcessManager = {
  id: BotProcessManagerId;
  label: string;
  description: string;
};

export type BotManageCommand = {
  id: string;
  label: string;
  command?: string;
  note?: string;
};

type FolderPath = {
  kind: "home" | "absolute" | "drive";
  parts: string[];
  drive?: string;
};

function cleanPart(value: string): string {
  return value
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseFolder(value: string): FolderPath {
  const trimmed = value.trim().replace(/\\/g, "/");
  const driveMatch = trimmed.match(/^([A-Za-z]):(?:\/|$)/);
  const isHome = trimmed === "~" || trimmed.startsWith("~/");
  const isAbsolute = !isHome && !driveMatch && trimmed.startsWith("/");

  let rest = trimmed;
  if (isHome) rest = trimmed.slice(1);
  else if (driveMatch) rest = trimmed.slice(driveMatch[0].length);
  else if (isAbsolute) rest = trimmed.slice(1);

  const parts = rest
    .split("/")
    .map(cleanPart)
    .filter((part) => part && part !== "." && part !== "..");

  if (!parts.length) parts.push("ks-bot");

  if (isHome) return { kind: "home", parts };
  if (isAbsolute) return { kind: "absolute", parts };
  if (driveMatch) return { kind: "drive", parts, drive: driveMatch[1].toUpperCase() };
  return { kind: "home", parts };
}

export function safeFolderName(value: string): string {
  const safe = cleanPart(value);
  return safe || "mc-bot";
}

export function safeFolderPath(value: string): string {
  if (!value.trim()) return DEFAULT_BOT_FOLDER;

  const parsed = parseFolder(value);
  if (parsed.kind === "home") return `~/${parsed.parts.join("/")}`;
  if (parsed.kind === "drive") return `${parsed.drive}:\\${parsed.parts.join("\\")}`;
  return `/${parsed.parts.join("/")}`;
}

export function safeProcessName(value: string): string {
  const safe = cleanPart(value);
  return safe || "minecraft-bot";
}

function shellFolder(folder: string, environmentId: BotEnvironmentId): string {
  const parsed = parseFolder(folder);
  const parts = parsed.parts.join("/");
  const windowsParts = parsed.parts.join("\\");

  if (environmentId === "powershell") {
    if (parsed.kind === "home") return `$HOME/${parts}`;
    if (parsed.kind === "drive") return `'${parsed.drive}:\\${windowsParts}'`;
    return `'/${parts}'`;
  }

  if (environmentId === "cmd") {
    if (parsed.kind === "home") return `"%USERPROFILE%\\${windowsParts}"`;
    if (parsed.kind === "drive") return `"${parsed.drive}:\\${windowsParts}"`;
    return `"\\${windowsParts}"`;
  }

  if (parsed.kind === "home") return `"$HOME/${parts}"`;
  if (parsed.kind === "drive") return `"${parsed.drive}:/${parts}"`;
  return `"/${parts}"`;
}

function bashWrite(folder: string, code: string): string {
  const dir = shellFolder(folder, "linux");
  const body = code.endsWith("\n") ? code : `${code}\n`;
  return `mkdir -p ${dir} && cat > ${dir}/bot.js <<'EOF'\n${body}EOF`;
}

function powershellWrite(folder: string, code: string): string {
  const dir = shellFolder(folder, "powershell");
  const body = code.endsWith("\n") ? code : `${code}\n`;
  return `New-Item -ItemType Directory -Force -Path ${dir} | Out-Null; @'\n${body}'@ | Set-Content -Path (Join-Path ${dir} 'bot.js') -Encoding UTF8`;
}

function cmdWrite(folder: string, _code: string): string {
  const dir = shellFolder(folder, "cmd");
  const file = `${dir.slice(1, -1)}\\bot.js`;
  return `if not exist ${dir} mkdir ${dir} & powershell -NoProfile -Command "Get-Clipboard | Set-Content -Path '${file}' -Encoding UTF8"`;
}

function unixProject(folder: string): string {
  const dir = shellFolder(folder, "linux");
  return `mkdir -p ${dir} && cd ${dir} && { [ -f package.json ] || npm init -y; } && npm install ${NPM_INSTALL_FLAGS} ${BOT_DEPENDENCIES}`;
}

function powershellProject(folder: string): string {
  const dir = shellFolder(folder, "powershell");
  return `New-Item -ItemType Directory -Force -Path ${dir} | Out-Null; Set-Location ${dir}; if (-not (Test-Path package.json)) { npm init -y }; npm install ${NPM_INSTALL_FLAGS} ${BOT_DEPENDENCIES}`;
}

function cmdProject(folder: string): string {
  const dir = shellFolder(folder, "cmd");
  return `if not exist ${dir} mkdir ${dir} & cd /d ${dir} && npm init -y && npm install ${NPM_INSTALL_FLAGS} ${BOT_DEPENDENCIES}`;
}

export const BOT_ENVIRONMENTS: BotEnvironment[] = [
  {
    id: "linux",
    label: "Linux (Bash)",
    description: "Debian, Ubuntu, or another Linux VPS with a Bash shell.",
    managers: ["pm2", "screen", "foreground"],
    installNode:
      "curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs",
    installNodeNote: "Uses the NodeSource setup script for Debian / Ubuntu.",
    verifyNode: "node -v && npm -v",
    createProject: unixProject,
    installPm2: "npm install -g pm2",
    installScreen: "sudo apt install -y screen",
    writeFile: bashWrite,
    writeHint:
      "Creates the project folder if needed and writes the generated code directly to bot.js. Safe to run again.",
  },
  {
    id: "powershell",
    label: "Windows (PowerShell)",
    description: "Windows 10 or 11 using PowerShell.",
    managers: ["pm2", "foreground"],
    installNode:
      "winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements",
    installNodeNote: "Uses winget. If winget is unavailable, install Node.js 22 LTS from nodejs.org.",
    verifyNode: "node -v; npm -v",
    createProject: powershellProject,
    installPm2: "npm install -g pm2",
    writeFile: powershellWrite,
    writeHint:
      "Creates the project folder if needed. The single-quoted here-string writes bot.js without changing its contents. Safe to run again.",
  },
  {
    id: "cmd",
    label: "Windows (CMD)",
    description: "Windows 10 or 11 using Command Prompt.",
    managers: ["pm2", "foreground"],
    installNode:
      "winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements",
    installNodeNote: "Uses winget. If winget is unavailable, install Node.js 22 LTS from nodejs.org.",
    verifyNode: "node -v && npm -v",
    createProject: cmdProject,
    installPm2: "npm install -g pm2",
    writeFile: cmdWrite,
    writeHint:
      "Click Copy Code first. Then run this command to create the folder if needed and save the clipboard contents as bot.js. Safe to run again.",
  },
  {
    id: "termux",
    label: "Android (Termux)",
    description: "Termux terminal on an Android phone or tablet.",
    managers: ["pm2", "screen", "foreground"],
    installNode: "pkg update -y && pkg install -y nodejs-lts",
    installNodeNote: "Installs the Termux Node.js LTS package.",
    verifyNode: "node -v && npm -v",
    createProject: unixProject,
    installPm2: "npm install -g pm2",
    installScreen: "pkg install -y screen",
    writeFile: bashWrite,
    writeHint:
      "Creates the project folder if needed and writes the generated code directly to bot.js. Safe to run again.",
  },
  {
    id: "macos",
    label: "macOS (Zsh)",
    description: "Terminal on macOS.",
    managers: ["pm2", "screen", "foreground"],
    installNode: "brew install node",
    installNodeNote: "Requires Homebrew. Skip this step if Node.js is already installed.",
    verifyNode: "node -v && npm -v",
    createProject: unixProject,
    installPm2: "npm install -g pm2",
    writeFile: bashWrite,
    writeHint:
      "Creates the project folder if needed and writes the generated code directly to bot.js. Safe to run again.",
  },
];

export const BOT_PROCESS_MANAGERS: BotProcessManager[] = [
  {
    id: "pm2",
    label: "PM2",
    description: "Runs the bot in the background with status, logs, and restart commands.",
  },
  {
    id: "screen",
    label: "screen",
    description: "Runs the bot inside a detachable terminal session.",
  },
  {
    id: "foreground",
    label: "Foreground terminal",
    description: "Runs the bot attached to the current terminal window.",
  },
];

export function getBotEnvironment(id: BotEnvironmentId): BotEnvironment {
  return BOT_ENVIRONMENTS.find((item) => item.id === id) ?? BOT_ENVIRONMENTS[0];
}

export function getBotProcessManager(id: BotProcessManagerId): BotProcessManager {
  return BOT_PROCESS_MANAGERS.find((item) => item.id === id) ?? BOT_PROCESS_MANAGERS[0];
}

function cdPrefix(folder: string, environmentId: BotEnvironmentId): string {
  const dir = shellFolder(folder, environmentId);
  if (environmentId === "powershell") return `Set-Location ${dir}; `;
  if (environmentId === "cmd") return `cd /d ${dir} && `;
  return `cd ${dir} && `;
}

function termuxLock(environmentId: BotEnvironmentId): string {
  return environmentId === "termux" ? "termux-wake-lock && " : "";
}

export function buildManageCommands(
  environmentId: BotEnvironmentId,
  managerId: BotProcessManagerId,
  folder: string,
  botName: string
): BotManageCommand[] {
  const cwd = cdPrefix(folder, environmentId);

  if (managerId === "pm2") {
    return [
      {
        id: "start",
        label: "Start",
        command: `${cwd}pm2 start bot.js --name ${botName}`,
      },
      { id: "status", label: "Status", command: "pm2 status" },
      { id: "logs", label: "Logs", command: `pm2 logs ${botName}` },
      { id: "restart", label: "Restart", command: `pm2 restart ${botName}` },
      { id: "stop", label: "Stop", command: `pm2 stop ${botName}` },
      { id: "delete", label: "Remove process", command: `pm2 delete ${botName}` },
    ];
  }

  if (managerId === "screen") {
    const start = `${termuxLock(environmentId)}${cwd}screen -dmS ${botName} node bot.js`;
    return [
      { id: "start", label: "Start", command: start },
      { id: "status", label: "Status", command: "screen -ls" },
      { id: "attach", label: "Attach", command: `screen -r ${botName}`, note: "Detach with Ctrl+A, then D." },
      { id: "restart", label: "Restart", command: `screen -S ${botName} -X quit; ${start}` },
      { id: "stop", label: "Stop", command: `screen -S ${botName} -X quit` },
    ];
  }

  return [
    {
      id: "start",
      label: "Start",
      command: `${cwd}node bot.js`,
      note: "Keep this terminal open while the bot runs.",
    },
    {
      id: "status",
      label: "Status",
      note: "Watch the terminal output for the login and spawn messages.",
    },
    {
      id: "restart",
      label: "Restart",
      note: "Press Ctrl+C, then run the start command again.",
    },
    {
      id: "stop",
      label: "Stop",
      note: "Press Ctrl+C in the terminal.",
    },
  ];
}
