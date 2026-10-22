import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DownloadActions from "../components/DownloadActions";
import Icon from "../components/Icon";
import { SearchField, Select, type SelectOption } from "../components/ui";
import { API_BASE } from "../lib/api";
import "./JavaDownloader.css";

type BedrockDownload = {
  display_name: string;
  name: string;
  file: string;
  type: number;
  fileDate?: string;
};

type BedrockProject = {
  title: string;
  slug: string;
  image?: string;
  downloads?: BedrockDownload[];
};

type DownloadFile = {
  url: string;
  filename: string;
  date: string;
  device: string;
};

const MCPEDL_API = `${API_BASE}/api/mcpedl`;

const sortOptions: SelectOption[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
];

function formatDate(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function fileNameFromUrl(url: string): string {
  try {
    const name = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "");
    return name || url;
  } catch {
    return url;
  }
}

function detectDevice(filename: string): string {
  const value = filename.toLowerCase();
  if (/multi|universal/.test(value)) return "Multiplatform";
  if (/windows|win32|win64/.test(value)) return "Windows";
  if (/android/.test(value)) return "Android";
  if (/ios|iphone|ipad/.test(value)) return "iOS";
  return "Other";
}

export default function BedrockDownloaderDownloads() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<BedrockProject | null>(null);
  const [downloads, setDownloads] = useState<BedrockDownload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const [query, setQuery] = useState("");
  const [device, setDevice] = useState("");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    setProject(null);
    setDownloads([]);
    fetch(`${MCPEDL_API}/route/slug/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: { data?: BedrockProject }) => {
        if (cancelled) return;
        if (!data.data) throw new Error("Missing project");
        setProject(data.data);
        setDownloads(Array.isArray(data.data.downloads) ? data.data.downloads : []);
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
    setQuery("");
    setDevice("");
    setSort("newest");
    window.scrollTo(0, 0);
  }, [slug]);

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
    for (const download of downloads) {
      if (!download.file || download.type === 5 || seen.has(download.file)) continue;
      seen.add(download.file);
      const filename = fileNameFromUrl(download.file);
      list.push({
        url: download.file,
        filename,
        date: download.fileDate ?? "",
        device: detectDevice(filename),
      });
    }
    return list;
  }, [downloads]);

  const deviceOptions = useMemo<SelectOption[]>(() => {
    const values = new Set<string>();
    files.forEach((file) => values.add(file.device));
    return [
      { value: "", label: "All devices" },
      ...Array.from(values).map((value) => ({ value, label: value })),
    ];
  }, [files]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return [...files]
      .filter((file) => !search || file.filename.toLowerCase().includes(search))
      .filter((file) => !device || file.device === device)
      .sort((a, b) => {
        const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
        return sort === "oldest" ? diff : -diff;
      });
  }, [files, query, device, sort]);

  return (
    <div className="jd-page">
      <div className="jd-bg" aria-hidden>
        <div className="jd-bg-grad" />
        <div className="jd-bg-orb o1" />
        <div className="jd-bg-orb o2" />
      </div>
      <div className="jd-shell">
        <Link className="jd-back" to={`/minecraft/bedrock/downloader/${slug}`}>
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
                src={project?.image || "https://via.placeholder.com/48"}
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
                value={device}
                onChange={setDevice}
                options={deviceOptions}
                ariaLabel="Device"
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
                        <span>{file.device}</span>
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
