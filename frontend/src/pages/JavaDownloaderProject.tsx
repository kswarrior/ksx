import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Icon from "../components/Icon";
import Markdown from "../components/Markdown";
import { API_BASE } from "../lib/api";
import "./JavaDownloader.css";

type ModrinthFile = {
  url: string;
  filename: string;
  primary: boolean;
};

type ModrinthVersion = {
  id: string;
  version_number: string;
  files: ModrinthFile[];
};

type ProjectDetail = {
  project_id: string;
  title: string;
  description: string;
  icon_url: string | null;
  body: string;
  categories: string[];
  downloads: number;
  followers: number;
  project_type: string;
  slug: string;
  source_url: string | null;
  issues_url: string | null;
  published: string;
  updated: string;
};

const API = `${API_BASE}/api/modrinth`;

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function JavaDownloaderProject() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [versions, setVersions] = useState<ModrinthVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    setProject(null);
    fetch(`${API}/project/${projectId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: ProjectDetail) => {
        if (!cancelled) setProject(data);
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
  }, [projectId, reload]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [projectId]);

  useEffect(() => {
    if (!project) return;
    const previous = document.title;
    document.title = `${project.title} — KS Warrior`;
    return () => {
      document.title = previous;
    };
  }, [project]);

  const modrinthUrl = project ? `https://modrinth.com/${project.project_type}/${project.slug}` : "";

  return (
    <div className="jd-page">
      <div className="jd-bg" aria-hidden>
        <div className="jd-bg-grad" />
        <div className="jd-bg-orb o1" />
        <div className="jd-bg-orb o2" />
      </div>
      <div className="jd-shell">
        <Link className="jd-back" to="/minecraft/java/downloader">
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
                src={project.icon_url || "https://via.placeholder.com/96"}
                alt=""
                decoding="async"
              />
              <div className="jd-detail-head">
                <div className="jd-detail-tags">
                  <span className="jd-tag jd-tag-primary">{project.project_type}</span>
                  {(project.categories ?? []).slice(0, 6).map((category) => (
                    <span key={category} className="jd-tag">{category}</span>
                  ))}
                </div>
                <h1 className="jd-detail-title">{project.title}</h1>
                <p className="jd-detail-desc">{project.description}</p>
                <div className="jd-detail-meta">
                  <span><strong>{project.downloads.toLocaleString()}</strong> downloads</span>
                  <span><strong>{(project.followers ?? 0).toLocaleString()}</strong> followers</span>
                  <span>Updated {formatDate(project.updated)}</span>
                </div>
                <div className="jd-detail-actions">
                  <a className="jd-btn" href={modrinthUrl} target="_blank" rel="noreferrer">
                    <Icon name="external-link" size={15} /> View on Modrinth
                  </a>
                  {project.source_url && (
                    <a className="jd-btn jd-btn-ghost" href={project.source_url} target="_blank" rel="noreferrer">Source</a>
                  )}
                  {project.issues_url && (
                    <a className="jd-btn jd-btn-ghost" href={project.issues_url} target="_blank" rel="noreferrer">Issues</a>
                  )}
                </div>
              </div>
            </header>

            <section className="jd-detail-body">
              {project.body ? <Markdown source={project.body} /> : <p className="jd-detail-empty">No description provided.</p>}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
