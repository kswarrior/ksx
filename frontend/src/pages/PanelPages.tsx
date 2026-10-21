import { useState } from "react";
import Icon, { type IconName } from "../components/Icon";
import "./Panel.css";

type PanelProps = {
  title: string;
  subtitle?: string;
  kicker?: string;
  links?: { label: string; href: string }[];
  commands: { label: string; code: string; icon?: IconName }[];
};

function CopySection({ label, code, icon }: { label: string; code: string; icon?: IconName }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="p-card">
      <h2>{icon && <Icon name={icon} size={16} />} {label}</h2>
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
          <Icon name={copied ? "check" : "copy"} size={14} /> {copied ? "Copied" : "Copy Command"}
        </button>
        <span className={`copied ${copied ? "show" : ""}`}><Icon name="check" size={12} /> Copied</span>
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
        {links && links.length > 0 && (
          <div className="p-card">
            <h2><Icon name="link" size={16} /> Useful Links</h2>
            <div className="p-links" style={{ marginTop: 10 }}>
              {links.map((l) => (
                <button key={l.href} className="panel-btn" onClick={() => window.open(l.href, "_blank")}>
                  {l.label} <Icon name="external-link" size={12} />
                </button>
              ))}
            </div>
          </div>
        )}
        {commands.map((c) => (
          <CopySection key={c.label} label={c.label} code={c.code} icon={c.icon} />
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
        { label: "Install Pterodactyl Panel", icon: "rocket", code: "bash <(curl -sSL https://ksweb.vercel.app/code/moh/pterodactyl/panel)" },
        { label: "Install Wings", icon: "satellite", code: "bash <(curl -sSL https://ksweb.vercel.app/code/moh/pterodactyl/wings)" },
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
        { label: "Install PufferPanel", icon: "package", code: "bash <(curl -sSL https://ksweb.vercel.app/code/moh/puffer/install)" },
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
        { label: "Install Skyport", icon: "cloud", code: "bash <(curl -sSL https://ksweb.vercel.app/code/moh/skyport/install)" },
      ]}
    />
  );
}
