export type BotEnvironmentId = "linux" | "powershell" | "cmd" | "termux" | "macos";
export type BotProcessManagerId = "pm2" | "screen" | "foreground";

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

export function safeFolderName(value: string): string {
  const safe = value
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return safe || "mc-bot";
}

export function safeProcessName(value: string): string {
  const safe = value
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return safe || "minecraft-bot";
}

function bashWrite(folder: string, code: string): string {
  const body = code.endsWith("\n") ? code : `${code}\n`;
  return `cat > ${folder}/bot.js <<'EOF'\n${body}EOF`;
}

function powershellWrite(folder: string, code: string): string {
  const body = code.endsWith("\n") ? code : `${code}\n`;
  return `@'\n${body}'@ | Set-Content -Path '${folder}\\bot.js' -Encoding UTF8`;
}

function unixProject(folder: string): string {
  return `mkdir -p ${folder} && cd ${folder} && npm init -y && npm install mineflayer mineflayer-pathfinder vec3`;
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
    writeHint: "Run this from the folder that contains your project folder. It writes the generated code directly to bot.js.",
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
    createProject: (folder) =>
      `New-Item -ItemType Directory -Force ${folder} | Out-Null; Set-Location ${folder}; npm init -y; npm install mineflayer mineflayer-pathfinder vec3`,
    installPm2: "npm install -g pm2",
    writeFile: powershellWrite,
    writeHint: "Run this from the folder that contains your project folder. The single-quoted here-string writes bot.js without changing its contents.",
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
    createProject: (folder) =>
      `mkdir ${folder} 2>nul & cd ${folder} && npm init -y && npm install mineflayer mineflayer-pathfinder vec3`,
    installPm2: "npm install -g pm2",
    writeFile: (folder, _code) =>
      `powershell -NoProfile -Command "Get-Clipboard | Set-Content -Path '${folder}\\bot.js' -Encoding UTF8"`,
    writeHint: "Click Copy Code first. Then run this command to save the clipboard contents as bot.js.",
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
    writeHint: "Run this from the folder that contains your project folder. It writes the generated code directly to bot.js.",
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
    writeHint: "Run this from the folder that contains your project folder. It writes the generated code directly to bot.js.",
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
  return environmentId === "powershell" ? `Set-Location ${folder}; ` : `cd ${folder} && `;
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
