import BrandLogo from "./BrandLogo";
import Icon, { type IconName } from "./Icon";
import "./PageHero.css";

type PageHeroProps = {
  icon: IconName;
  logoSrc?: string;
  title: string;
  subtitle?: string;
  kicker?: string;
  variant?: "card" | "inline";
  className?: string;
};

export default function PageHero({
  icon,
  logoSrc,
  title,
  subtitle,
  kicker,
  variant = "card",
  className = "",
}: PageHeroProps) {
  return (
    <header
      className={[
        "page-hero",
        variant === "inline" ? "page-hero--inline" : "page-hero--card",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {logoSrc ? (
        <BrandLogo className="page-hero-icon page-hero-logo" src={logoSrc} fallback={icon} iconSize={22} />
      ) : (
        <span className="page-hero-icon" aria-hidden>
          <Icon name={icon} size={22} />
        </span>
      )}
      <div className="page-hero-text">
        {kicker && <span className="page-hero-kicker">{kicker}</span>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </header>
  );
}
