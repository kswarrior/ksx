import "./KsLoader.css";

type KsLoaderProps = {
  label?: string;
  fullscreen?: boolean;
  className?: string;
};

export default function KsLoader({ label = "Loading", fullscreen = false, className }: KsLoaderProps) {
  return (
    <div
      className={`ks-loader${fullscreen ? " ks-loader-full" : ""}${className ? ` ${className}` : ""}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="ks-loader-mark" aria-hidden="true">
        <svg className="ks-loader-svg" viewBox="0 0 160 100" fill="none">
          <defs>
            <linearGradient id="ks-loader-gradient" x1="80" y1="8" x2="80" y2="92" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.55" stopColor="#d4d4d4" />
              <stop offset="1" stopColor="#6b6b6b" />
            </linearGradient>
          </defs>
          <g
            className="ks-loader-strokes"
            stroke="url(#ks-loader-gradient)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path pathLength="100" d="M18 14V86" />
            <path pathLength="100" d="M18 52L58 14" />
            <path pathLength="100" d="M30 42L62 86" />
            <path
              pathLength="100"
              d="M132 25C132 12 116 8 102 10C86 12 80 24 84 33C88 42 102 44 112 46C128 49 136 56 134 68C132 84 114 92 98 90C86 89 76 84 74 76"
            />
          </g>
        </svg>
        <span className="ks-loader-scan" />
      </div>

      <div className="ks-loader-bar" aria-hidden="true">
        <i />
      </div>

      <div className="ks-loader-label">
        {label}
        <span className="ks-loader-dots" aria-hidden="true">
          <i>.</i>
          <i>.</i>
          <i>.</i>
        </span>
      </div>
    </div>
  );
}
