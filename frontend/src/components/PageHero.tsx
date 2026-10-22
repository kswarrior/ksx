import Icon, { type IconName } from "./Icon";
import "./PageHero.css";

type PageHeroProps = {
  icon: IconName;
  title: string;
  subtitle?: string;
  kicker?: string;
  variant?: "card" | "inline";
  className?: string;
};

export default function PageHero({
  icon,
  title,
  subtitle,
  kicker,
  variant = "card",
  className = "",
}: PageHeroProps) {
  const classes = [
    "page-hero",
    variant === "inline" ? "page-hero--inline" : "page-hero--card",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span className="page-hero-icon" aria-hidden>
        <Icon name={icon} size={22} />
      </span>
      <div className="page-hero-text">
        {kicker && <span className="page-hero-kicker">{kicker}</span>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </>
  );

  if (variant === "inline") {
    return <div className={classes}>{content}</div>;
  }

  return <header className={classes}>{content}</header>;
}
