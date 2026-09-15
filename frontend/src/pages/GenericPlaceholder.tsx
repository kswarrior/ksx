import { useParams } from "react-router-dom";

export default function GenericPlaceholder() {
  const params = useParams();
  const path = window.location.pathname;
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 12 }}>Coming Soon</h1>
      <p style={{ color: "#9aa0aa", lineHeight: 1.6 }}>
        This page <code style={{ background: "#15151b", padding: "2px 6px", borderRadius: 6 }}>{path}</code> is being
        migrated to React.
      </p>
      <p style={{ color: "#9aa0aa", marginTop: 12 }}>
        Original file: <code>{path.endsWith(".html") ? path : `${path}.html`}</code> — migrated to React Router.
      </p>
      <pre style={{ marginTop: 20, background: "#0f0f18", padding: 16, borderRadius: 10, overflow: "auto", border: "1px solid #24242c" }}>
        {JSON.stringify(params, null, 2)}
      </pre>
    </div>
  );
}
