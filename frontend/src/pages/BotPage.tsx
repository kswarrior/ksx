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
  const [copiedIdx, setCopiedIdx] = useState<number|null>(null);

  function copy(text: string, idx?: number){
    navigator.clipboard.writeText(text);
    if(idx!==undefined){ setCopiedIdx(idx); setTimeout(()=>setCopiedIdx(null),1200); }
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

  const installCode = "sudo apt update && sudo apt install curl -y && curl -fsSL https://deb.nodesource.com/setup_current.x | sudo -E bash - && sudo apt install nodejs -y";
  const projectCode = "mkdir mc-bot\ncd mc-bot\nnpm init -y\nnpm install mineflayer vec3";

  return (
    <div className="bot-page">
      <div className="bot-bg" aria-hidden>
        <div className="bot-bg-grad" />
        <div className="bot-bg-orb o1" />
        <div className="bot-bg-orb o2" />
      </div>
      <div className="bot-shell">
        <header className="bot-header">
          <div className="bot-kicker"><span className="bot-kicker-dot" /> SERVER • BOTS</div>
          <h1 className="bot-title">Minecraft <span>Bot</span></h1>
          <p className="bot-sub">By KS Warrior • Node.js + mineflayer • No paid hosting • PVP, mining, auto-equip, anti-AFK.</p>
        </header>

        <div className="bot-card">
          <h3>1️⃣ Install Node.js</h3>
          <pre className="bot-code">{installCode}</pre>
          <button className="bot-btn" onClick={() => copy(installCode,1)}>{copiedIdx===1?"Copied ✓":"⎘ Copy Code"}</button>
        </div>

        <div className="bot-card">
          <h3>2️⃣ Create project folder</h3>
          <pre className="bot-code">{projectCode}</pre>
          <button className="bot-btn" onClick={() => copy(projectCode,2)}>{copiedIdx===2?"Copied ✓":"⎘ Copy Code"}</button>
        </div>

        <div className="bot-card">
          <h3>3️⃣ Enter your server details</h3>
          <label className="bot-label">Server IP</label>
          <input className="bot-input" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="e.g., yourserver.aternos.me" />
          <label className="bot-label">Server Port</label>
          <input className="bot-input" value={port} onChange={(e) => setPort(e.target.value)} placeholder="e.g., 25565" />
          <label className="bot-label">Bot Username</label>
          <input className="bot-input" value={botName} onChange={(e) => setBotName(e.target.value)} placeholder="Bot's in-game name" />
          <label className="bot-label">Owner Username</label>
          <input className="bot-input" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Your in-game name" />
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
            <div>
              <label className="bot-label">Reconnect Delay (s)</label>
              <input className="bot-input" value={reconnectDelay} onChange={(e) => setReconnectDelay(e.target.value)} placeholder="5" />
            </div>
            <div>
              <label className="bot-label">Eat Threshold</label>
              <input className="bot-input" value={eatThreshold} onChange={(e) => setEatThreshold(e.target.value)} placeholder="15" />
            </div>
            <div>
              <label className="bot-label">Jump Interval (s)</label>
              <input className="bot-input" value={jumpInterval} onChange={(e) => setJumpInterval(e.target.value)} placeholder="45" />
            </div>
            <div>
              <label className="bot-label">Walk Interval (s)</label>
              <input className="bot-input" value={walkInterval} onChange={(e) => setWalkInterval(e.target.value)} placeholder="60" />
            </div>
          </div>
          <label className="bot-label">View Distance</label>
          <input className="bot-input" value={viewDistance} onChange={(e) => setViewDistance(e.target.value)} placeholder="far or normal" />
          <div style={{display:"flex", gap:8, marginTop:12, flexWrap:"wrap"}}>
            <button className="bot-btn primary" onClick={generateBotCode}>⚡ Generate bot.js</button>
            <button className="bot-btn" onClick={() => copy(generated,3)}>{copiedIdx===3?"Copied ✓":"⎘ Copy Generated"}</button>
          </div>
          <pre className="bot-code" style={{marginTop:12}}>{generated}</pre>
          <p style={{marginTop:8, color:"#9aa0b4", fontSize:11}}>Paste the copied code into bot.js</p>
        </div>

        <div className="bot-card">
          <h3>4️⃣ Run the bot</h3>
          <pre className="bot-code">node bot.js</pre>
          <button className="bot-btn" onClick={() => copy("node bot.js",4)}>{copiedIdx===4?"Copied ✓":"⎘ Copy Code"}</button>
          <p style={{marginTop:10, color:"#9aa0b4", fontSize:11, lineHeight:1.6}}>Tip: Use <code style={{background:"rgba(255,255,255,0.06)", padding:"2px 6px", borderRadius:6}}>screen -S bot</code> then run, detach with Ctrl+A+D, reattach with <code style={{background:"rgba(255,255,255,0.06)", padding:"2px 6px", borderRadius:6}}>screen -r bot</code> or <code style={{background:"rgba(255,255,255,0.06)", padding:"2px 6px", borderRadius:6}}>nohup node bot.js &amp;</code></p>
        </div>

        <div className="bot-card">
          <h3>🤖 Commands (owner only)</h3>
          <div className="bot-list">
            <span>!follow &lt;name&gt; — Bot follows you</span>
            <span>!come — Bot comes to your position</span>
            <span>!guard — Guard & protect you</span>
            <span>!stopguard — Stop protecting</span>
            <span>!stop — Stop current action</span>
            <span>!attack &lt;player&gt; — Attack player</span>
            <span>!huntmobs — Hunt hostile mobs</span>
            <span>!mine &lt;block&gt; — Mine block</span>
            <span>!equip — Re-equip best gear</span>
            <span>!totem — Equip totem offhand</span>
            <span>!help — List all commands</span>
          </div>
        </div>
      </div>
    </div>
  );
}
