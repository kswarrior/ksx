export default function About() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px", textAlign: "center" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16 }}>About KS Warrior</h1>
      <p style={{ color: "var(--muted)", lineHeight: 1.7, fontSize: 16 }}>
        KS Warrior is the ultimate Minecraft hub — providing free hosting lists, VPS recommendations, launchers, mod
        downloaders, server setups, and more. Built with ❤️ for the Minecraft community.
      </p>
      <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <a
          href="https://youtube.com/@ks_warrior_pro"
          target="_blank"
          rel="noreferrer"
          style={{ padding: "12px 20px", border: "1px solid var(--border)", borderRadius: 10, background: "var(--panel)" }}
        >
          YouTube
        </a>
        <a
          href="https://discord.gg/2kAYnH655h"
          target="_blank"
          rel="noreferrer"
          style={{ padding: "12px 20px", border: "1px solid var(--border)", borderRadius: 10, background: "var(--panel)" }}
        >
          Discord
        </a>
      </div>
    </div>
  );
}
