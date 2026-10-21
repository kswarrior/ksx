import { useEffect, useRef, useState, type ReactNode } from "react";
import "./FilterMenu.css";

type FilterMenuProps = {
  children: ReactNode;
  activeCount?: number;
  label?: string;
};

export default function FilterMenu({ children, activeCount = 0, label = "Filters" }: FilterMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest(".ks-select-menu")) return;
      if (!wrapRef.current?.contains(target as Node)) setOpen(false);
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

  return (
    <div className="filter-menu" ref={wrapRef}>
      <button
        type="button"
        className={`filter-toggle ${open ? "open" : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <svg className="filter-ico" viewBox="0 0 24 24" aria-hidden>
          <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>
        {label}
        {activeCount > 0 && <span className="filter-count">{activeCount}</span>}
        <svg className="filter-chev" viewBox="0 0 24 24" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && <div className="filter-panel">{children}</div>}
    </div>
  );
}
