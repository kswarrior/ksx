import aboutMarkdown from "./about.md?raw";
import Markdown from "../components/Markdown";
import PageHero from "../components/PageHero";
import "./About.css";

export default function About() {
  return (
    <div className="about-page">
      <div className="ab-bg" aria-hidden>
        <div className="ab-bg-grad" />
        <div className="ab-bg-orb o1" />
        <div className="ab-bg-orb o2" />
      </div>
      <div className="ab-shell">
        <PageHero icon="heart" title="About" />

        <article className="ab-md">
          <Markdown source={aboutMarkdown} />
        </article>
      </div>
    </div>
  );
}
