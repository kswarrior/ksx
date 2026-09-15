import { useParams, useNavigate } from "react-router-dom";
import "./About.css";

export default function GenericPlaceholder() {
  const params = useParams();
  const path = window.location.pathname;
  const navigate = useNavigate();
  return (
    <div className="about-page">
      <div className="ab-bg" aria-hidden>
        <div className="ab-bg-grad" />
        <div className="ab-bg-orb o1" />
        <div className="ab-bg-orb o2" />
      </div>
      <div className="ab-shell">
        <header className="ab-header">
          <div className="ab-kicker"><span className="ab-kicker-dot" /> COMING SOON</div>
          <h1 className="ab-title">Coming <span>Soon</span></h1>
          <p className="ab-sub">
            This page <code style={{background:"rgba(255,255,255,0.08)", padding:"2px 6px", borderRadius:6, border:"1px solid rgba(255,255,255,0.08)"}}>{path}</code> is being migrated to React.
          </p>
        </header>
        <div className="ab-card">
          <div style={{fontSize:28, marginBottom:8}}>🚧</div>
          <div style={{fontWeight:900, marginBottom:6}}>Under migration</div>
          <p style={{color:"var(--ab-muted)", fontSize:13, lineHeight:1.6}}>
            Original file: <code style={{background:"rgba(255,255,255,0.06)", padding:"2px 6px", borderRadius:6}}>{path.endsWith(".html") ? path : `${path}.html`}</code> — migrating to React Router.
          </p>
          <pre style={{marginTop:14, background:"rgba(10,10,18,0.96)", padding:14, borderRadius:12, overflow:"auto", border:"1px solid rgba(255,255,255,0.09)", fontSize:12, textAlign:"left", color:"#a0e0ff"}}>
            {JSON.stringify(params, null, 2)}
          </pre>
          <div className="ab-actions" style={{marginTop:16}}>
            <button className="ab-btn primary" onClick={()=> navigate("/map")}>🗺️ Browse Map</button>
            <button className="ab-btn" onClick={()=> navigate("/")}>🏠 Home</button>
          </div>
        </div>
      </div>
    </div>
  );
}
