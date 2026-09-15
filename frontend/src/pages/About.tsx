import "./About.css";

export default function About() {
  return (
    <div className="about-page">
      <div className="ab-bg" aria-hidden>
        <div className="ab-bg-grad" />
        <div className="ab-bg-orb o1" />
        <div className="ab-bg-orb o2" />
      </div>
      <div className="ab-shell">
        <header className="ab-header">
          <div className="ab-kicker"><span className="ab-kicker-dot" /> ABOUT • KS WARRIOR</div>
          <h1 className="ab-title">About <span>KS Warrior</span></h1>
          <p className="ab-sub">
            The ultimate Minecraft hub — free hosting lists, VPS picks, launchers, mod downloaders, server setups & more. Built with ❤️ for the community. Fast, stylish, lag-less.
          </p>
        </header>

        <div className="ab-card">
          <div style={{fontSize:40, marginBottom:10}}>⛏️</div>
          <div style={{fontWeight:900, fontSize:16, letterSpacing:-0.3}}>KS Warrior Hub</div>
          <div style={{color:"var(--ab-muted)", fontSize:13, lineHeight:1.6, marginTop:8, maxWidth:560, marginLeft:"auto", marginRight:"auto"}}>
            One hub for Minecraft • Website • Hosting • VPS • AI — many builds, many tools, one KS Hub. Explore everything from the map, save favorites, stay updated.
          </div>
          <div className="ab-stats">
            <div className="ab-stat"><b>15+</b><span>Tools</span></div>
            <div className="ab-stat"><b>100%</b><span>Free</span></div>
            <div className="ab-stat"><b>24/7</b><span>Community</span></div>
          </div>
          <div className="ab-actions">
            <a href="https://youtube.com/@ks_warrior_pro" target="_blank" rel="noreferrer" className="ab-btn primary">▶ YouTube</a>
            <a href="https://discord.gg/2kAYnH655h" target="_blank" rel="noreferrer" className="ab-btn">💬 Discord</a>
            <a href="/map" className="ab-btn">🗺️ Explore Map</a>
          </div>
        </div>

        <div className="ab-card" style={{textAlign:"left"}}>
          <div style={{fontWeight:800, fontSize:14, marginBottom:8}}>What I build</div>
          <div style={{display:"grid", gap:8, fontSize:12, color:"var(--ab-muted)", lineHeight:1.6}}>
            <span style={{background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.06)", padding:"10px 12px", borderRadius:12}}>⛏️ Minecraft — Hosting, Java/Bedrock tools, panels, server setups</span>
            <span style={{background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.06)", padding:"10px 12px", borderRadius:12}}>🌐 Website & VPS — Free lists, guides & deploy scripts</span>
            <span style={{background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.06)", padding:"10px 12px", borderRadius:12}}>🤖 AI & Tools — KS Infinity, downloaders, statics & bots</span>
          </div>
        </div>
      </div>
    </div>
  );
}
