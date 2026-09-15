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
      // try resolve as domain if not ipv4
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
  }

  return (
    <div className="customip-page">
      <h1 className="title">Custom IP Address</h1>
      <h2 className="my-name">KS Warrior</h2>
      <div className="all-step">
        <div className="step-one">
          <h3 className="step"><pre>  Step {1}  </pre></h3>
          <p>Enter your server IP or domain:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <input className="ip-input" placeholder="e.g. aternos.org or 8.8.8.8" value={input} onChange={(e) => setInput(e.target.value)} />
            <button className="ip-search" onClick={loadIPInfo}>{loading ? "Loading..." : "Search"}</button>
          </div>
          <div className="result-box">
            {loading && <p>🔍 Fetching data...</p>}
            {error && <p style={{ color: "#b91c1c", fontWeight: 700 }}>{error}</p>}
            {result && (
              <>
                <p><span className="label">IP Address:</span> {result.ip} <button className="copy-btn" onClick={() => copyToClipboard(result.ip)}>Copy</button></p>
                <p><span className="label">City:</span> {result.city || "N/A"}</p>
                <p><span className="label">Region:</span> {result.region || "N/A"}</p>
                <p><span className="label">Country:</span> {result.country_name || "N/A"}</p>
                <p><span className="label">ISP:</span> {result.org || "N/A"}</p>
                <p><span className="label">Timezone:</span> {result.timezone || "N/A"}</p>
              </>
            )}
            {!loading && !error && !result && <p style={{ color: "#aaa" }}>Result will appear here</p>}
          </div>
        </div>

        <div className="step-two">
          <h3 className="step"><pre>  Step {2}  </pre></h3>
          <p>Fill all information</p>
          <p>Click on create button</p>
          <iframe title="subdomain" className="link-two" height={455} width="100%" src="https://shockbyte.com/es/subdomain-creator" style={{ border: "none" }} />
        </div>

        <h1 className="injoy">Enjoy Custom IP</h1>
        <a className="discord" href="https://zhhdy.com" target="_blank" rel="noreferrer">Join Discord</a>
        <p className="end">For more things like this</p>
        <p className="end">Also support me</p>
      </div>
    </div>
  );
}
