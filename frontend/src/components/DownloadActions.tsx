import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

type DownloadActionsProps = {
  url: string;
  name?: string;
};

export default function DownloadActions({ url, name }: DownloadActionsProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="jd-file-actions" ref={wrapRef}>
      <button
        type="button"
        className="jd-file-menu-btn"
        aria-label={`Options for ${name ?? "file"}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>
      {open && (
        <div className="jd-file-menu" role="menu">
          <button type="button" className="jd-file-menu-item" role="menuitem" onClick={copyUrl}>
            <Icon name="copy" size={14} /> {copied ? "Copied!" : "Copy URL"}
          </button>
          <a className="jd-file-menu-item" role="menuitem" href={url} target="_blank" rel="noreferrer">
            <Icon name="download" size={14} /> Download
          </a>
        </div>
      )}
    </div>
  );
}
