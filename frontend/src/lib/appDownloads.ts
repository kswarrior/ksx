import { API_BASE } from "./api";

export function trackAppDownload(slug: string, version: string, platform: string) {
  const payload = JSON.stringify({ version, platform });
  const url = `${API_BASE}/api/apps/${encodeURIComponent(slug)}/download`;
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon(url, blob)) return;
    }
  } catch {
    /* fall through to fetch */
  }
  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}
