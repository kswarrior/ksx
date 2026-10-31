import { Link } from "react-router-dom";
import Icon, { type IconName } from "../components/Icon";
import PageHero from "../components/PageHero";
import "./Placeholder.css";

type PlaceholderProps = {
  icon: IconName;
  kicker: string;
  title: string;
  subtitle: string;
};

export default function Placeholder({ icon, kicker, title, subtitle }: PlaceholderProps) {
  return (
    <div className="placeholder-page">
      <PageHero icon={icon} kicker={kicker} title={title} subtitle={subtitle} />

      <section className="panel-3d placeholder-panel">
        <span className="placeholder-icon" aria-hidden="true">
          <Icon name={icon} size={28} />
        </span>
        <h2>Coming soon</h2>
        <p>
          The layout and navigation are ready. This module will be wired to the API
          in a later step.
        </p>
        <Link to="/" className="btn">
          <Icon name="arrow-left" size={13} />
          Back to overview
        </Link>
      </section>
    </div>
  );
}
