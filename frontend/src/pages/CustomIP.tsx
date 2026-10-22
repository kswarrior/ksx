import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const [customIp, setCustomIp] = useState("");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<IpInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [frameBlocked, setFrameBlocked] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const frameStartRef = useRef(0);
  const frameTimerRef = useRef<number | undefined>(undefined);

  const startFrameTimer = useCallback(() => {
    frameStartRef.current = performance.now();
    setFrameBlocked(false);
    window.clearTimeout(frameTimerRef.current);
    frameTimerRef.current = window.setTimeout(() => setFrameBlocked(true), 5000);
  }, []);

  useEffect(() => {
    if (step !== 2) return;
    startFrameTimer();
    return () => window.clearTimeout(frameTimerRef.current);
  }, [step, provider, startFrameTimer]);

  function handleFrameLoad() {
    window.clearTimeout(frameTimerRef.current);
    let blocked = performance.now() - frameStartRef.current < 500;
    try {
      if (frameRef.current?.contentWindow?.location.href === "about:blank") blocked = true;
    } catch {
      // Cross-origin page loaded normally.
    }
    setFrameBlocked(blocked);
  }

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
  const navigate = useNavigate();

  function openStatics() {
    const value = customIp.trim();
    navigate(`/minecraft/server/statics.html${value ? `?ip=${encodeURIComponent(value)}` : ""}`);
  }

  return (
    <div className={`customip-page${step === 2 ? " ci-fullscreen" : ""}`}>
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
                <div className="ci-head-actions">
                  {frameBlocked && (
                    <a className="ci-btn secondary ci-view" href={activeProvider.url} target="_blank" rel="noreferrer">
                      <Icon name="external-link" size={13} /> View
                    </a>
                  )}
                  <Select
                    className="ci-provider"
                    value={provider}
                    onChange={setProvider}
                    options={PROVIDERS.map((p) => ({ value: p.value, label: p.label }))}
                    ariaLabel="Select subdomain provider"
                  />
                </div>
              </div>
              <p>Fill all information and click create — free subdomain for your server.</p>
              <div className="ci-frame-wrap">
                <iframe
                  ref={frameRef}
                  key={activeProvider.value}
                  title={`${activeProvider.label} subdomain`}
                  className="ci-frame"
                  src={activeProvider.url}
                  onLoad={handleFrameLoad}
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="ci-stage ci-anim" key="step-3">
            <div className="ci-card ci-done">
              <div className="ci-done-icon"><Icon name="sparkles" size={26} /></div>
              <h3>3 Test Your Custom IP</h3>
              <p>If your server isn't running, start it first. Then open MC Statics and check the custom IP you created to make sure it works.</p>
              <div className="ci-done-form">
                <TextField
                  className="ci-done-input"
                  value={customIp}
                  onChange={(e) => setCustomIp(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && openStatics()}
                  placeholder="Your custom IP (e.g. myserver.shockbyte.me)"
                  aria-label="Custom IP"
                />
                <button className="ci-btn" onClick={openStatics}>
                  <Icon name="globe" size={14} /> Open MC Statics
                </button>
              </div>
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
