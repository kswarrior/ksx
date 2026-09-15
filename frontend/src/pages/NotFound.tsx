import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <h1 style={{ fontSize: 48, fontWeight: 900 }}>404</h1>
      <p style={{ color: "#9aa0aa", marginTop: 8 }}>Page not found</p>
      <Link to="/dashboard" style={{ display: "inline-block", marginTop: 20, padding: "12px 20px", background: "#fff", color: "#000", borderRadius: 10, fontWeight: 800 }}>Go to Dashboard</Link>
    </div>
  );
}
