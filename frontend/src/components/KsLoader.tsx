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
      <div className="ks-loader-lines" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}
