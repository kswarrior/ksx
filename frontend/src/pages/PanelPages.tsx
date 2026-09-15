import { useState } from "react";

type PanelProps = {
  title: string;
  subtitle?: string;
  kicker?: string;
  links?: { label: string; href: string }[];
  commands: { label: string; code: string }[];
};

function CopySection({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="p-card">
      <h2>{label}</h2>
      <pre className="codespre">{code}</pre>
      <div style={{ display: "flex", alignItems: "center", marginTop: 12, flexWrap: "wrap", gap: 8 }}>
        <button
          className="panel-btn primary"
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
        >
          ⎘ Copy Command
        </button>
        <span className={`copied ${copied ? "show" : ""}`}>Copied ✓</span>
      </div>
    </div>
  );
}

export default function PanelPages({ title, subtitle, kicker, links, commands }: PanelProps) {
  return (
    <div className="panel-page">
      <div className="panel-bg" aria-hidden>
        <div className="panel-bg-grad" />
        <div className="panel-bg-orb o1" />
        <div className="panel-bg-orb o2" />
      </div>
      <div className="p-shell">
        <header className="p-header">
          <div className="p-kicker"><span className="p-kicker-dot" /> {kicker || "PANEL • INSTALL"}</div>
          <h1 className="p-title">{title}</h1>
          <p className="p-sub">{subtitle || "One-click install commands — copy, paste in VPS & deploy in minutes. Optimized for lag-less setup."}</p>
        </header>

        {links && links.length > 0 && (
          <div className="p-card">
            <h2>🔗 Useful Links</h2>
            <div className="p-links" style={{ marginTop: 10 }}>
              {links.map((l) => (
                <button key={l.href} className="panel-btn" onClick={() => window.open(l.href, "_blank")}>
                  {l.label} ↗
                </button>
              ))}
            </div>
          </div>
        )}
        {commands.map((c) => (
          <CopySection key={c.label} label={c.label} code={c.code} />
        ))}
      </div>
    </div>
  );
}

// Pre-configured exports
export function PterodactylPage() {
  return (
    <PanelPages
      title="Pterodactyl Panel"
      kicker="MAKE HOSTING • PTERODACTYL"
      subtitle="Industry-standard game panel. Install panel + wings with optimized bash scripts."
      links={[
        { label: "Official Website", href: "https://pterodactyl.io" },
        { label: "YouTube Tutorials", href: "https://youtube.com/results?search_query=pterodactyl+panel+install" },
      ]}
      commands={[
        { label: "🚀 Install Pterodactyl Panel", code: "bash <(curl -sSL https://ksweb.vercel.app/code/moh/pterodactyl/panel)" },
        { label: "🛰️ Install Wings", code: "bash <(curl -sSL https://ksweb.vercel.app/code/moh/pterodactyl/wings)" },
      ]}
    />
  );
}

export function PufferPage() {
  return (
    <PanelPages
      title="PufferPanel"
      kicker="MAKE HOSTING • PUFFER"
      subtitle="Lightweight, fast & modern panel — perfect for small VPS & free hosts."
      commands={[
        { label: "📦 Install PufferPanel", code: "bash <(curl -sSL https://ksweb.vercel.app/code/moh/puffer/install)" },
      ]}
    />
  );
}

export function SkyportPage() {
  return (
    <PanelPages
      title="Skyport Panel"
      kicker="MAKE HOSTING • SKYPORT"
      subtitle="Next-gen Skyport — sleek UI, blazing fast, easy deploy."
      commands={[
        { label: "☁️ Install Skyport", code: "bash <(curl -sSL https://ksweb.vercel.app/code/moh/skyport/install)" },
      ]}
    />
  );
}
