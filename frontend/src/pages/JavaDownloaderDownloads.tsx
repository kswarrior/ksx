import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DownloadActions from "../components/DownloadActions";
import Icon from "../components/Icon";
import { SearchField, Select, type SelectOption } from "../components/ui";
import { API_BASE } from "../lib/api";
import { readSession, writeSession } from "../lib/sessionCache";
import "./JavaDownloader.css";

type ProjectDetail = {
  project_id: string;
  title: string;
  icon_url: string | null;
};

type ModrinthFile = {
  url: string;
  filename: string;
  size: number;
  primary: boolean;
};

type ModrinthVersion = {
  id: string;
  version_number: string;
  game_versions: string[];
  loaders: string[];
  date_published: string;
  files: ModrinthFile[];
};

type DownloadFile = {
  url: string;
  filename: string;
  version: string;
  gameVersions: string[];
  loaders: string[];
  date: string;
  size: number;
};

const API = `${API_BASE}/api/modrinth`;

const sortOptions: SelectOption[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
];

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatSize(bytes: number): string {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function JavaDownloaderDownloads() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [versions, setVersions] = useState<ModrinthVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const [query, setQuery] = useState("");
  const [version, setVersion] = useState("");
  const [loader, setLoader] = useState("");
  const [sort, setSort] = useState("newest");

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
      fetch(`${API}/project/${projectId}/version?featured=true`).then((r) =>
        r.ok ? (r.json() as Promise<ModrinthVersion[]>) : ([] as ModrinthVersion[])
      ),
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
    setQuery("");
    setVersion("");
    setLoader("");
    setSort("newest");
    window.scrollTo(0, 0);
  }, [projectId]);

  useEffect(() => {
    if (!project) return;
    const previous = document.title;
    document.title = `${project.title} downloads — KS Warrior`;
    return () => {
      document.title = previous;
    };
  }, [project]);

  const files = useMemo<DownloadFile[]>(() => {
    const seen = new Set<string>();
    const list: DownloadFile[] = [];
    for (const entry of versions) {
      for (const file of entry.files ?? []) {
        if (!file.url || seen.has(file.url)) continue;
        seen.add(file.url);
        list.push({
          url: file.url,
          filename: file.filename,
          version: entry.version_number,
          gameVersions: entry.game_versions ?? [],
          loaders: entry.loaders ?? [],
          date: entry.date_published,
          size: file.size,
        });
      }
    }
    return list;
  }, [versions]);

  const versionOptions = useMemo<SelectOption[]>(() => {
    const values = new Set<string>();
    files.forEach((file) => file.gameVersions.forEach((value) => values.add(value)));
    return [
      { value: "", label: "All versions" },
      ...Array.from(values).map((value) => ({ value, label: value })),
    ];
  }, [files]);

  const loaderOptions = useMemo<SelectOption[]>(() => {
    const values = new Set<string>();
    files.forEach((file) => file.loaders.forEach((value) => values.add(value)));
    return [
      { value: "", label: "All loaders" },
      ...Array.from(values).map((value) => ({ value, label: capitalize(value) })),
    ];
  }, [files]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return [...files]
      .filter(
        (file) =>
          !search ||
          file.filename.toLowerCase().includes(search) ||
          file.version.toLowerCase().includes(search)
      )
      .filter((file) => !version || file.gameVersions.includes(version))
      .filter((file) => !loader || file.loaders.includes(loader))
      .sort((a, b) => {
        const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
        return sort === "oldest" ? diff : -diff;
      });
  }, [files, query, version, loader, sort]);

  return (
    <div className="jd-page">
      <div className="jd-bg" aria-hidden>
        <div className="jd-bg-grad" />
        <div className="jd-bg-orb o1" />
        <div className="jd-bg-orb o2" />
      </div>
      <div className="jd-shell">
        <Link className="jd-back" to={`/minecraft/java/downloader/${projectId}`}>
          <Icon name="chevron-left" size={16} /> Back to {project?.title ?? "project"}
        </Link>

        {loading && <div className="jd-loading">Loading downloads…</div>}

        {!loading && error && (
          <div className="jd-empty">
            Couldn't load downloads.{" "}
            <button type="button" className="jd-retry" onClick={() => setReload((value) => value + 1)}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <header className="jd-download-head">
              <img
                className="jd-download-head-icon"
                src={project?.icon_url || "https://via.placeholder.com/48"}
                alt=""
                decoding="async"
              />
              <div>
                <h1 className="jd-download-title">{project?.title ?? "Downloads"}</h1>
                <p className="jd-download-sub">
                  {filtered.length} of {files.length} files
                </p>
              </div>
            </header>

            <div className="jd-download-toolbar">
              <SearchField
                className="jd-download-search"
                value={query}
                onValueChange={setQuery}
                placeholder="Search files…"
                ariaLabel="Search files"
              />
              <Select
                className="jd-toolbar-select"
                value={version}
                onChange={setVersion}
                options={versionOptions}
                ariaLabel="Game version"
                searchable
                searchPlaceholder="Search versions…"
              />
              <Select
                className="jd-toolbar-select"
                value={loader}
                onChange={setLoader}
                options={loaderOptions}
                ariaLabel="Loader"
              />
              <Select
                className="jd-toolbar-select"
                value={sort}
                onChange={setSort}
                options={sortOptions}
                ariaLabel="Sort files"
              />
            </div>

            {filtered.length === 0 ? (
              <div className="jd-empty">No files match your filters.</div>
            ) : (
              <ul className="jd-file-list">
                {filtered.map((file) => (
                  <li className="jd-file-card" key={file.url}>
                    <div className="jd-file-badge" aria-hidden>
                      <Icon name="download" size={18} />
                    </div>
                    <div className="jd-file-info">
                      <div className="jd-file-name" title={file.filename}>{file.filename}</div>
                      <div className="jd-file-meta">
                        <span className="jd-file-version">{file.version}</span>
                        {file.gameVersions.length > 0 && (
                          <span>
                            MC {file.gameVersions.slice(0, 3).join(", ")}
                            {file.gameVersions.length > 3 ? ` +${file.gameVersions.length - 3}` : ""}
                          </span>
                        )}
                        {file.loaders.length > 0 && <span>{file.loaders.join(", ")}</span>}
                        {file.size > 0 && <span>{formatSize(file.size)}</span>}
                        {file.date && <span>{formatDate(file.date)}</span>}
                      </div>
                    </div>
                    <DownloadActions url={file.url} name={file.filename} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
