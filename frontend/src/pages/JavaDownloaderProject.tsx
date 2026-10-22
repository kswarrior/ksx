import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Icon from "../components/Icon";
import Markdown from "../components/Markdown";
import { API_BASE } from "../lib/api";
import "./JavaDownloader.css";

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
    setVersions([]);
    Promise.all([
      fetch(`${API}/project/${projectId}`).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<ProjectDetail>;
      }),
      fetch(`${API}/project/${projectId}/version?featured=true`)
        .then((r) => (r.ok ? (r.json() as Promise<ModrinthVersion[]>) : []))
        .catch(() => [] as ModrinthVersion[]),
    ])
      .then(([projectData, versionData]) => {
        if (cancelled) return;
        setProject(projectData);
        setVersions(Array.isArray(versionData) ? versionData : []);
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

  const downloads = useMemo(() => {
    const seen = new Set<string>();
    const list: { url: string; filename: string }[] = [];
    for (const version of versions.slice(0, 12)) {
      const file = version.files.find((f) => f.primary) ?? version.files[0];
      if (!file || seen.has(file.url)) continue;
      seen.add(file.url);
      list.push({ url: file.url, filename: file.filename });
    }
    return list;
  }, [versions]);

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
              {downloads.length > 0 && (
                <>
                  <h2 className="jd-detail-section-title">Downloads</h2>
                  <ul className="jd-downloads">
                    {downloads.map((download) => (
                      <li key={download.url}>
                        <a href={download.url} target="_blank" rel="noreferrer">
                          <Icon name="download" size={15} />
                          <span>{download.filename}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {project.body ? <Markdown source={project.body} /> : <p className="jd-detail-empty">No description provided.</p>}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
