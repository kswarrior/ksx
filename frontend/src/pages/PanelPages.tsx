import { useState } from "react";
import Icon, { type IconName } from "../components/Icon";
import PageHero from "../components/PageHero";
import "./Panel.css";

type PanelProps = {
  title: string;
  subtitle?: string;
  kicker?: string;
  icon?: IconName;
  links?: { label: string; href: string }[];
  commands: { label: string; code: string; icon?: IconName }[];
};

function CopySection({ label, code, icon }: { label: string; code: string; icon?: IconName }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="p-card">
      <h2>
        <span className="p-card-title">{icon && <Icon name={icon} size={16} />} {label}</span>
        <button
          className={`copy-icon-btn ${copied ? "is-copied" : ""}`}
          type="button"
          aria-label={copied ? "Copied" : "Copy command"}
          title={copied ? "Copied" : "Copy command"}
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
        >
          <Icon name={copied ? "check" : "copy"} size={15} />
        </button>
      </h2>
      <pre className="codespre">{code}</pre>
    </div>
  );
}

export default function PanelPages({ title, subtitle, kicker, icon = "package", links, commands }: PanelProps) {
  return (
    <div className="panel-page">
      <div className="panel-bg" aria-hidden>
        <div className="panel-bg-grad" />
        <div className="panel-bg-orb o1" />
        <div className="panel-bg-orb o2" />
      </div>
      <div className="p-shell">
        <PageHero icon={icon} title={title} subtitle={subtitle} kicker={kicker} />

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
      icon="rocket"
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
      icon="package"
      subtitle="Lightweight, fast & modern panel — perfect for small VPS & free hosts."
      commands={[
        { label: "Install PufferPanel", icon: "package", code: "bash <(curl -sSL https://ksweb.vercel.app/code/moh/puffer/install)" },
      ]}
    />
  );
}

export function AirlinkPage() {
  return (
    <PanelPages
      title="Airlink Panel"
      kicker="MAKE HOSTING • AIRLINK"
      icon="cloud"
      subtitle="Modern game panel — sleek UI, blazing fast, easy deploy."
      links={[
        { label: "Official Website", href: "https://airlinklabs.xyz" },
        { label: "Documentation", href: "https://airlinklabs.xyz/docs/quick-start/" },
      ]}
      commands={[
        { label: "Install Airlink", icon: "cloud", code: "curl -fsSL https://airlinklabs.xyz/install | bash" },
      ]}
    />
  );
}
