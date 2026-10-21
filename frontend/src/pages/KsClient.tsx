import Icon from "../components/Icon";
import "./KsClient.css";

export default function KsClient() {
  const feats = [
    "Better Minecraft performance",
    "Less lag and smoother gameplay",
    "Quick and easy settings",
    "3D Mace model",
    "3D Shield (front & side)",
    "3D Bow and Crossbow",
    "3D Player Skin Totem",
    "New and modern UI",
    "Armor and offhand HUD",
    "Player health indicator",
    "Item durability viewer",
    "Bright and beautiful textures",
    "Clear water visuals",
    "Low fire effect for visibility",
    "Overall smooth gameplay",
  ];
  return (
    <div className="ks-page">
      <div className="ks-bg" aria-hidden>
        <div className="ks-bg-grad" />
        <div className="ks-bg-orb o1" />
        <div className="ks-bg-orb o2" />
      </div>
      <div className="ks-shell">
        <div className="ks-card">
          <div className="ks-card-title"><Icon name="sparkles" size={15} /> What you get</div>
          <div style={{color:"var(--ks-muted)", fontSize:13, lineHeight:1.6}}>Packed for performance + visuals. One tap install, works on Bedrock PE.</div>
          <div className="ks-feat">
            {feats.map((t,i)=> (
              <span key={t}><i>{i+1}</i> {t}</span>
            ))}
          </div>
          <div style={{marginTop:14, display:"flex", gap:10, flexWrap:"wrap"}}>
            <a href="https://www.mediafire.com/file/o78xzmld09b5nw9/KS_Client_V3.mcpack/file" target="_blank" rel="noreferrer" className="ks-dl" style={{background:"#fff", color:"#000", borderColor:"transparent"}}><Icon name="download" size={14} /> Get KS Client V3</a>
            <span style={{fontSize:12, color:"var(--ks-muted)", alignSelf:"center"}}>Tap to download • Import in Minecraft PE</span>
          </div>
        </div>

        <div className="ks-card" style={{textAlign:"center"}}>
          <div style={{fontWeight:900, fontSize:14, marginBottom:6}}>How to install</div>
          <div style={{color:"var(--ks-muted)", fontSize:12, lineHeight:1.6}}>1) Download .mcpack • 2) Open with Minecraft PE • 3) Enable in Resource Packs • 4) Restart world • Enjoy smooth 3D visuals.</div>
        </div>
      </div>
    </div>
  );
}
