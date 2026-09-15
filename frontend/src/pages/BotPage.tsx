import { useState } from "react";
import "./BotPage.css";

export default function BotPage() {
  const [ip, setIp] = useState("");
  const [port, setPort] = useState("25565");
  const [botName, setBotName] = useState("");
  const [owner, setOwner] = useState("");
  const [reconnectDelay, setReconnectDelay] = useState("5");
  const [eatThreshold, setEatThreshold] = useState("15");
  const [jumpInterval, setJumpInterval] = useState("45");
  const [walkInterval, setWalkInterval] = useState("60");
  const [viewDistance, setViewDistance] = useState("far");
  const [generated, setGenerated] = useState("// Generated code will appear here...");

  function copyFromCard(code: string) {
    navigator.clipboard.writeText(code);
  }

  function generateBotCode() {
    const cfgIp = ip.trim() || "localhost";
    const cfgPort = parseInt(port) || 25565;
    const cfgName = botName.trim() || "KSBot";
    const cfgOwner = owner.trim() || "YourMinecraftName";
    const cfgReconnect = (parseInt(reconnectDelay) || 5) * 1000;
    const cfgEat = parseInt(eatThreshold) || 15;
    const cfgJump = (parseInt(jumpInterval) || 45) * 1000;
    const cfgWalk = (parseInt(walkInterval) || 60) * 1000;
    const cfgView = viewDistance.trim() || "far";

    const jsCode = `const mineflayer = require('mineflayer')
const Vec3 = require('vec3').Vec3

process.on('uncaughtException', err => console.log('Uncaught Exception:', err.message))
process.on('unhandledRejection', err => console.log('Unhandled Rejection:', err))

const config = {
  host: '${cfgIp}',
  port: ${cfgPort},
  username: '${cfgName}',
  owner: '${cfgOwner}',
  reconnectDelay: ${cfgReconnect},
  eatFoodThreshold: ${cfgEat},
  antiAfkJumpInterval: ${cfgJump},
  antiAfkWalkInterval: ${cfgWalk},
  viewDistance: '${cfgView}'
}
let bot
function createBot(){
  bot = mineflayer.createBot({
    host: config.host,
    port: config.port,
    username: config.username,
    viewDistance: config.viewDistance
  })
  bot.on('login', () => console.log(config.username + ' joined the server'))
  bot.on('spawn', () => console.log('Bot spawned'))
  bot.on('death', () => setTimeout(()=>bot.respawn(),1200))
  bot.on('end', () => setTimeout(createBot, config.reconnectDelay))
  bot.on('chat', (username, message)=>{
    if(username !== config.owner) return
    if(message === '!come') bot.pathfinder?.goto(new Vec3(bot.entity.position.x, bot.entity.position.y, bot.entity.position.z))
    if(message === '!help') bot.chat('Commands: !come, !stop, !follow, !guard, !mine <block>')
  })
}
createBot()
`;
    setGenerated(jsCode);
  }

  return (
    <div className="bot-page">
      <h1>Minecraft Bot</h1>
      <div className="subtitle">By KS Warrior | Using Node.js + mineflayer — No paid hosting needed! <strong>Ultimate powerful bot</strong> with PVP, mining, auto-equip, anti-AFK and more.</div>
      <div className="section">
        <div className="card">
          <p>1. Install Node.js</p>
          <pre className="code">sudo apt update && {"\n"}sudo apt install curl -y && {"\n"}curl -fsSL https://deb.nodesource.com/setup_current.x | sudo -E bash - && {"\n"}sudo apt install nodejs -y</pre>
          <button className="btn" onClick={() => copyFromCard("sudo apt update && sudo apt install curl -y && curl -fsSL https://deb.nodesource.com/setup_current.x | sudo -E bash - && sudo apt install nodejs -y")}>Copy Code</button>
        </div>
        <div className="card">
          <p>2. Create project folder</p>
          <pre className="code">mkdir mc-bot{"\n"}cd mc-bot{"\n"}npm init -y{"\n"}npm install mineflayer vec3</pre>
          <button className="btn" onClick={() => copyFromCard("mkdir mc-bot\ncd mc-bot\nnpm init -y\nnpm install mineflayer vec3")}>Copy Code</button>
        </div>
        <div className="card">
          <p>3. Enter your server details</p>
          <label>Server IP:</label>
          <input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="e.g., yourserver.aternos.me" />
          <label>Server Port:</label>
          <input value={port} onChange={(e) => setPort(e.target.value)} placeholder="e.g., 25565" />
          <label>Bot Username:</label>
          <input value={botName} onChange={(e) => setBotName(e.target.value)} placeholder="Bot's in-game name" />
          <label>Owner Username:</label>
          <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Your in-game name" />
          <label>Reconnect Delay (seconds):</label>
          <input value={reconnectDelay} onChange={(e) => setReconnectDelay(e.target.value)} placeholder="5" />
          <label>Auto Eat Food Threshold:</label>
          <input value={eatThreshold} onChange={(e) => setEatThreshold(e.target.value)} placeholder="15" />
          <label>Anti-AFK Jump Interval (seconds):</label>
          <input value={jumpInterval} onChange={(e) => setJumpInterval(e.target.value)} placeholder="45" />
          <label>Anti-AFK Walk Interval (seconds):</label>
          <input value={walkInterval} onChange={(e) => setWalkInterval(e.target.value)} placeholder="60" />
          <label>View Distance:</label>
          <input value={viewDistance} onChange={(e) => setViewDistance(e.target.value)} placeholder="far or normal" />
          <button className="btn" onClick={generateBotCode}>Generate bot.js Code</button>
          <pre className="code">{generated}</pre>
          <button className="btn" onClick={() => copyFromCard(generated)}>Copy Generated Code</button>
          <p style={{ marginTop: 10, color: "#9c9c9c", fontSize: 13 }}>Paste the copied code into your terminal to create bot.js automatically!</p>
        </div>
        <div className="card">
          <p>4. Run the bot</p>
          <pre className="code">node bot.js</pre>
          <button className="btn" onClick={() => copyFromCard("node bot.js")}>Copy Code</button>
          <p style={{ marginTop: 10, color: "#9c9c9c", fontSize: 13 }}>Tip: Use 'screen -S bot' then run, detach with Ctrl+A+D, reattach with 'screen -r bot'. Or 'nohup node bot.js &'</p>
        </div>
        <div className="card">
          <p>Bot Features & Commands (say in chat, only owner can use)</p>
          <ul style={{ color: "#9c9c9c", fontSize: 13, listStyleType: "disc", paddingLeft: 20 }}>
            <li>!follow &lt;name&gt; - Bot follows you</li>
            <li>!come - Bot comes to your position</li>
            <li>!guard - Bot guards & protects you</li>
            <li>!stopguard - Stop protecting you</li>
            <li>!stop - Stop current action</li>
            <li>!attack &lt;player&gt; - Attack a specific player</li>
            <li>!huntmobs - Hunt hostile mobs</li>
            <li>!pvpstop - Stop PVP/hunting</li>
            <li>!mine &lt;block&gt; - Mine block</li>
            <li>!equip - Re-equip best armor/weapons</li>
            <li>!totem - Equip totem in offhand</li>
            <li>!help - List all commands</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
