import { useState } from "react";
import Icon from "../components/Icon";
import { Select, TextField } from "../components/ui";
import "./CustomIP.css";

type IpInfo = {
  ip: string;
  city?: string;
  region?: string;
  country_name?: string;
  org?: string;
  timezone?: string;
};

const PROVIDERS = [
  { value: "shockbyte", label: "Shockbyte", url: "https://shockbyte.com/en-gb/subdomain-creator" },
  { value: "hosthorde", label: "HostHorde", url: "https://hosthorde.net/create" },
  { value: "endercloud", label: "Endercloud", url: "https://endercloud.in/subdomain" },
  { value: "voltra", label: "Voltra", url: "https://voltra.gg/minecraft-subdomain" },
] as const;

export default function CustomIP() {
  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState<string>(PROVIDERS[0].value);
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
          setError("Domain cannot be resolved.");
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
        setError(data.reason || "Invalid IP Address");
      } else {
        setResult(data);
      }
    } catch {
      setError("Failed to fetch IP info");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(()=>setCopied(false),1200);
  }

  const activeProvider = PROVIDERS.find((p) => p.value === provider) ?? PROVIDERS[0];

  return (
    <div className="customip-page">
      <div className="ci-bg" aria-hidden>
        <div className="ci-bg-grad" />
        <div className="ci-bg-orb o1" />
        <div className="ci-bg-orb o2" />
      </div>
      <div className="ci-shell">
        {step === 1 && (
          <div className="ci-stage ci-anim" key="step-1">
            <div className="ci-card">
              <h3><span>1</span> Resolve IP / Domain</h3>
              <p>Enter your server IP or domain to fetch location & ISP info.</p>
              <div className="ci-input-row">
                <TextField className="ci-input" placeholder="e.g. aternos.org or 8.8.8.8" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e)=> e.key==="Enter" && loadIPInfo()} />
                <button className="ci-btn" onClick={loadIPInfo}><Icon name="search" size={14} /> {loading ? "Checking…" : "Search"}</button>
              </div>
              <div className="ci-result">
                {loading && <p style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="search" size={14} /> Fetching data...</p>}
                {error && <p style={{ color: "#f87171", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}><Icon name="warning" size={14} /> {error}</p>}
                {result && (
                  <>
                    <p><b>IP Address:</b> <span>{result.ip} <button className="ci-copy" onClick={() => copyToClipboard(result.ip)}><Icon name={copied ? "check" : "copy"} size={12} /> {copied ? "Copied" : "Copy"}</button></span></p>
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
          </div>
        )}

        {step === 2 && (
          <div className="ci-stage wide ci-anim" key="step-2">
            <div className="ci-card">
              <div className="ci-card-head">
                <h3><span>2</span> Create Free Subdomain</h3>
                <Select
                  className="ci-provider"
                  value={provider}
                  onChange={setProvider}
                  options={PROVIDERS.map((p) => ({ value: p.value, label: p.label }))}
                  ariaLabel="Select subdomain provider"
                />
              </div>
              <p>Fill all information and click create — free subdomain for your server.</p>
              <div className="ci-embed">
                <div className="ci-embed-icon"><Icon name="globe" size={26} /></div>
                <h4>{activeProvider.label} Subdomain Creator</h4>
                <p>{activeProvider.label} blocks embedding its website on other sites for security, so it can't be shown here. Open it in a new tab to create your free subdomain.</p>
                <a className="ci-btn ci-embed-link" href={activeProvider.url} target="_blank" rel="noreferrer">
                  Open {activeProvider.label} <Icon name="external-link" size={14} />
                </a>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="ci-stage ci-anim" key="step-3">
            <div className="ci-card ci-coming">
              <div className="ci-coming-icon"><Icon name="rocket" size={26} /></div>
              <h3>3 More coming soon</h3>
              <p>This page is still under construction — something new is on the way. Check back soon!</p>
            </div>
          </div>
        )}

        <div className="ci-nav">
          {step > 1 && (
            <button className="ci-btn secondary" onClick={() => setStep(step - 1)}>
              <Icon name="arrow-left" size={14} /> Back
            </button>
          )}
          {step < 3 && (
            <button className="ci-btn ci-nav-next" onClick={() => setStep(step + 1)}>
              Next <Icon name="arrow-right" size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
