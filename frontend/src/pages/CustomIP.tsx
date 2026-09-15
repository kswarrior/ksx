import { useState } from "react";
import "./CustomIP.css";

type IpInfo = {
  ip: string;
  city?: string;
  region?: string;
  country_name?: string;
  org?: string;
  timezone?: string;
};

export default function CustomIP() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<IpInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4]\d|1?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|1?\d{1,2})$/;

  async function resolveDomain(domain: string): Promise<string | null> {
    try {
      const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`);
      const data = await res.json();
      if (data.Answer && data.Answer.length > 0) {
        const record = data.Answer.find((a: { type: number }) => a.type === 1);
        return record ? record.data : null;
      }
      return null;
    } catch {
      return null;
    }
  }

  async function loadIPInfo() {
    const trimmed = input.trim();
    if (!trimmed) { alert("Please enter an IP or domain"); return; }
    setLoading(true);
    setError(null);
    setResult(null);
    let targetIP = trimmed;
    if (!ipv4Regex.test(trimmed)) {
      if (!trimmed.includes(":")) {
        const resolved = await resolveDomain(trimmed);
        if (!resolved) {
          setError("❌ Domain cannot be resolved.");
          setLoading(false);
          return;
        }
        targetIP = resolved;
      }
    }
    try {
      const res = await fetch(`https://ipapi.co/${targetIP}/json/`);
      const data = await res.json();
      if (data.error) {
        setError(`❌ ${data.reason || "Invalid IP Address"}`);
      } else {
        setResult(data);
      }
    } catch {
      setError("❌ Failed to fetch IP info");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(()=>setCopied(false),1200);
  }

  return (
    <div className="customip-page">
      <div className="ci-bg" aria-hidden>
        <div className="ci-bg-grad" />
        <div className="ci-bg-orb o1" />
        <div className="ci-bg-orb o2" />
      </div>
      <div className="ci-shell">
        <header className="ci-header">
          <div className="ci-kicker"><span className="ci-kicker-dot" /> MAKE SERVER • CUSTOM IP</div>
          <h1 className="ci-title">Custom <span>IP Address</span></h1>
          <p className="ci-sub">By KS Warrior • Resolve domain → get geodata → create free subdomain instantly.</p>
        </header>

        <div className="ci-grid">
          <div className="ci-card">
            <h3><span>1</span> Resolve IP / Domain</h3>
            <p>Enter your server IP or domain to fetch location & ISP info.</p>
            <div className="ci-input-row">
              <input className="ci-input" placeholder="e.g. aternos.org or 8.8.8.8" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e)=> e.key==="Enter" && loadIPInfo()} />
              <button className="ci-btn" onClick={loadIPInfo}>{loading ? "Checking…" : "Search ↗"}</button>
            </div>
            <div className="ci-result">
              {loading && <p>🔍 Fetching data...</p>}
              {error && <p style={{ color: "#f87171", fontWeight: 800 }}>{error}</p>}
              {result && (
                <>
                  <p><b>IP Address:</b> <span>{result.ip} <button className="ci-copy" onClick={() => copyToClipboard(result.ip)}>{copied?"Copied ✓":"Copy"}</button></span></p>
                  <p><b>City:</b> <span>{result.city || "N/A"}</span></p>
                  <p><b>Region:</b> <span>{result.region || "N/A"}</span></p>
                  <p><b>Country:</b> <span>{result.country_name || "N/A"}</span></p>
                  <p><b>ISP:</b> <span>{result.org || "N/A"}</span></p>
                  <p><b>Timezone:</b> <span>{result.timezone || "N/A"}</span></p>
                </>
              )}
              {!loading && !error && !result && <p style={{ color: "var(--ci-muted)" }}>Result will appear here</p>}
            </div>
          </div>

          <div className="ci-card">
            <h3><span>2</span> Create Free Subdomain</h3>
            <p>Fill all information and click create — free subdomain for your server.</p>
            <iframe title="subdomain" className="ci-frame" height={455} width="100%" src="https://shockbyte.com/es/subdomain-creator" loading="lazy" />
          </div>
        </div>

        <div className="ci-footer">
          <div style={{fontWeight:900, fontSize:18, letterSpacing:-0.4}}>Enjoy Custom IP ✨</div>
          <a href="https://zhhdy.com" target="_blank" rel="noreferrer">Join Discord ↗</a>
          <span>For more things like this — also support me 💙</span>
        </div>
      </div>
    </div>
  );
}
