import { useState } from "react";

type PanelProps = {
  title: string;
  links?: { label: string; href: string }[];
  commands: { label: string; code: string }[];
};

function CopySection({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="panel-section">
      <h2>{label}</h2>
      <pre className="codespre">{code}</pre>
      <button
        className="panel-btn"
        onClick={async () => {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
      >
        Copy Command
      </button>
      <span className={`copied ${copied ? "show" : ""}`}>Copied ✓</span>
    </div>
  );
}

export default function PanelPages({ title, links, commands }: PanelProps) {
  return (
    <div className="panel-page">
      <div className="panel-title">{title}</div>
      {links && links.length > 0 && (
        <div className="panel-section">
          <h2>🔗 Useful Links</h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {links.map((l) => (
              <button key={l.href} className="panel-btn" onClick={() => window.open(l.href, "_blank")}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {commands.map((c) => (
        <CopySection key={c.label} label={c.label} code={c.code} />
      ))}
    </div>
  );
}

// Pre-configured exports
export function PterodactylPage() {
  return (
    <PanelPages
      title="Pterodactyl Panel"
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
      title="Puffer Panel"
      commands={[
        { label: "Install PufferPanel", code: "bash <(curl -sSL https://ksweb.vercel.app/code/moh/puffer/install)" },
      ]}
    />
  );
}

export function SkyportPage() {
  return (
    <PanelPages
      title="Skyport Panel"
      commands={[
        { label: "Install Skyport", code: "bash <(curl -sSL https://ksweb.vercel.app/code/moh/skyport/install)" },
      ]}
    />
  );
}
