import Icon, { type IconName } from "./Icon";
import "./PageHero.css";

type PageHeroProps = {
  icon: IconName;
  title: string;
  subtitle?: string;
  kicker?: string;
  className?: string;
};

export default function PageHero({
  icon,
  title,
  subtitle,
  kicker,
  className = "",
}: PageHeroProps) {
  return (
    <header className={["page-hero", "page-hero--card", className].filter(Boolean).join(" ")}>
      <span className="page-hero-icon" aria-hidden>
        <Icon name={icon} size={22} />
      </span>
      <div className="page-hero-text">
        {kicker && <span className="page-hero-kicker">{kicker}</span>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </header>
  );
}
