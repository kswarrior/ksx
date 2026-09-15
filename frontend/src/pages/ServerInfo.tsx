import { useState } from "react";

type McStatus = Record<string, unknown>;

export default function ServerInfo() {
  const [ip, setIp] = useState("");
  const [data, setData] = useState<McStatus | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchInfo() {
    if (!ip.trim()) { alert("Please enter a server IP"); return; }
    setLoading(true);
    try {
      const res = await fetch(`https://api.mcsrvstat.us/3/${ip.trim()}`);
      const json = await res.json();
      setData(json);
    } catch {
      alert("Failed to fetch");
    } finally { setLoading(false); }
  }

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "calc(100vh - 56px)", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 16px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 10, textAlign: "center" }}>Minecraft Server Info</h1>
      <p style={{ color: "#aaa", marginBottom: 20 }}>Enter the IP to fetch server details</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        <input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="Enter server IP" style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(28,28,40,0.9)", color: "#fff", minWidth: 260 }} />
        <button onClick={fetchInfo} style={{ padding: "12px 20px", borderRadius: 12, background: "#fff", color: "#000", fontWeight: 700, border: "none", cursor: "pointer" }}>{loading ? "Loading..." : "Search"}</button>
      </div>
      {data && (
        <pre style={{ marginTop: 30, background: "rgba(18,18,28,0.85)", padding: 20, borderRadius: 12, width: "100%", maxWidth: 600, overflow: "auto", border: "1px solid rgba(255,255,255,0.12)", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
