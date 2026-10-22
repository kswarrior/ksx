import { useState, type ReactNode } from "react";
import Icon, { type IconName } from "./Icon";
import "./Guide.css";

export function GuidePanel({
  id,
  number,
  icon,
  title,
  meta,
  children,
}: {
  id: string;
  number: number;
  icon: IconName;
  title: string;
  meta?: string;
  children: ReactNode;
}) {
  return (
    <section className="setup-panel" id={`guide-${id}`}>
      <div className="setup-panel-head">
        <div className="setup-panel-title">
          <span className="setup-step-number">{number}</span>
          <Icon name={icon} size={15} />
          <h2>{title}</h2>
        </div>
        {meta && <span className="setup-panel-meta">{meta}</span>}
      </div>
      {children}
    </section>
  );
}

export function GuideCodeBlock({ code, label = "Command" }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="setup-code-box">
      <div className="setup-code-head">
        <span>{label}</span>
        <button
          type="button"
          className="setup-mini-btn"
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          }}
        >
          <Icon name={copied ? "check" : "copy"} size={12} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="setup-code">{code}</pre>
    </div>
  );
}
