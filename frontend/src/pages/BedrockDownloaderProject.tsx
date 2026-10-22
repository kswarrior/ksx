import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Icon from "../components/Icon";
import { API_BASE } from "../lib/api";
import "./JavaDownloader.css";

type BedrockDownload = {
  display_name: string;
  name: string;
  file: string;
  type: number;
};

type BedrockProject = {
  title: string;
  slug: string;
  description: string;
  short_description?: string;
  image?: string;
  download_count?: number;
  average_rating?: number;
  username?: string;
  update_date?: string;
  type_id?: number;
  categories?: { name: string; slug: string }[];
  minecraft_versions?: { name: string; slug: string }[];
  downloads?: BedrockDownload[];
  website_link?: string | null;
  cf_link?: string | null;
};

const MCPEDL_API = `${API_BASE}/api/mcpedl`;

const bedrockTypeLabels: Record<string, string> = {
  "1": "Addons",
  "2": "Maps",
  "3": "Textures",
  "6": "Skins",
  "9": "Scripts",
};

function formatDate(value?: string): string {
  if (!value) return "unknown";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "unknown";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, style, iframe, object, embed, form, input, button, link, meta").forEach((el) => el.remove());
  doc.querySelectorAll("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on")) {
        el.removeAttribute(attr.name);
        continue;
      }
      if ((name === "href" || name === "src") && /^\s*javascript:/i.test(attr.value)) {
        el.removeAttribute(attr.name);
      }
    }
    if (el.tagName === "A") {
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noreferrer noopener");
    }
  });
  return doc.body.innerHTML;
}

export default function BedrockDownloaderProject() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<BedrockProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    setProject(null);
    fetch(`${MCPEDL_API}/route/slug/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: { data?: BedrockProject }) => {
        if (cancelled) return;
        if (!data.data) throw new Error("Missing project");
        setProject(data.data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, reload]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (!project) return;
    const previous = document.title;
    document.title = `${project.title} — KS Warrior`;
    return () => {
      document.title = previous;
    };
  }, [project]);

  const description = useMemo(
    () => (project?.description ? sanitizeHtml(project.description) : ""),
    [project?.description]
  );

  const typeLabel = project ? bedrockTypeLabels[String(project.type_id)] ?? "Bedrock" : "";

  return (
    <div className="jd-page">
      <div className="jd-bg" aria-hidden>
        <div className="jd-bg-grad" />
        <div className="jd-bg-orb o1" />
        <div className="jd-bg-orb o2" />
      </div>
      <div className="jd-shell">
        <Link className="jd-back" to="/minecraft/java/downloader?platform=bedrock">
          <Icon name="chevron-left" size={16} /> Back to Universal Downloader
        </Link>

        {loading && <div className="jd-loading">Loading project…</div>}

        {!loading && error && (
          <div className="jd-empty">
            Couldn't load this project.{" "}
            <button type="button" className="jd-retry" onClick={() => setReload((value) => value + 1)}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && project && (
          <>
            <header className="jd-detail-hero">
              <img
                className="jd-detail-icon"
                src={project.image || "https://via.placeholder.com/96"}
                alt=""
                decoding="async"
              />
              <div className="jd-detail-head">
                <div className="jd-detail-tags">
                  <span className="jd-tag jd-tag-primary">{typeLabel}</span>
                  {(project.categories ?? []).map((category) => (
                    <span key={category.slug} className="jd-tag">{category.name}</span>
                  ))}
                </div>
                <h1 className="jd-detail-title">{project.title}</h1>
                <p className="jd-detail-desc">{project.short_description || ""}</p>
                <div className="jd-detail-meta">
                  <span><strong>{(project.download_count ?? 0).toLocaleString()}</strong> downloads</span>
                  {typeof project.average_rating === "number" && project.average_rating > 0 && (
                    <span><strong>{project.average_rating.toFixed(1)}</strong> rating</span>
                  )}
                  <span>Updated {formatDate(project.update_date)}</span>
                  {project.username && <span>By {project.username}</span>}
                </div>
                <div className="jd-detail-actions">
                  {project.cf_link && (
                    <a className="jd-btn jd-btn-ghost" href={project.cf_link} target="_blank" rel="noreferrer">CurseForge</a>
                  )}
                  {project.website_link && (
                    <a className="jd-btn jd-btn-ghost" href={project.website_link} target="_blank" rel="noreferrer">Website</a>
                  )}
                </div>
              </div>
            </header>

            <section className="jd-detail-body">
              {downloads.length > 0 && (
                <>
                  <h2 className="jd-detail-section-title">Downloads</h2>
                  <ul className="jd-downloads">
                    {downloads.map((download) => (
                      <li key={download.file}>
                        <a href={download.file} target="_blank" rel="noreferrer">
                          <Icon name="download" size={15} />
                          <span>{download.display_name || download.name}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {description && (
                <>
                  <h2 className="jd-detail-section-title">Description</h2>
                  <div className="jd-detail-html" dangerouslySetInnerHTML={{ __html: description }} />
                </>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
