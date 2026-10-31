import { useEffect, useState } from "react";

type Hello = {
  message: string;
  service: string;
  version: string;
  time: string;
};

type Integration = {
  name: string;
  configured: boolean;
  description: string;
};

type Health = {
  status: string;
  version: string;
  uptime: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "ready"; hello: Hello; health: Health; integrations: Integration[] }
  | { status: "error"; message: string };

async function getJSON<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return (await response.json()) as T;
}

export default function App() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getJSON<Hello>("/api/hello"),
      getJSON<Health>("/api/health"),
      getJSON<{ integrations: Integration[] }>("/api/integrations"),
    ])
      .then(([hello, health, integrations]) => {
        if (!cancelled) {
          setState({
            status: "ready",
            hello,
            health,
            integrations: integrations.integrations,
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">KSX</span>
          <span className="brand-name">Admin</span>
        </div>
        <span className="badge">v0.1.0</span>
      </header>

      <main className="content">
        <section className="hero">
          <p className="eyebrow">Control plane</p>
          <h1>
            Hello, <span className="accent">world</span>.
          </h1>
          <p className="lede">
            A lightweight Go API with a React + TypeScript dashboard, ready for
            GitHub, Cloudflare, and background automation.
          </p>
        </section>

        {state.status === "loading" && (
          <section className="panel">
            <p className="muted">Connecting to the admin API...</p>
          </section>
        )}

        {state.status === "error" && (
          <section className="panel error">
            <h2>API unavailable</h2>
            <p className="muted">{state.message}</p>
          </section>
        )}

        {state.status === "ready" && (
          <>
            <section className="panel highlight">
              <div>
                <p className="label">API response</p>
                <h2>{state.hello.message}</h2>
                <p className="muted">
                  {state.hello.service} · {state.hello.version}
                </p>
              </div>
              <div className="health">
                <span className="dot" />
                {state.health.status} · up {state.health.uptime}
              </div>
            </section>

            <section className="grid">
              {state.integrations.map((integration) => (
                <article className="card" key={integration.name}>
                  <div className="card-head">
                    <h3>{integration.name}</h3>
                    <span
                      className={
                        integration.configured ? "pill ready" : "pill pending"
                      }
                    >
                      {integration.configured ? "Configured" : "Not configured"}
                    </span>
                  </div>
                  <p className="muted">{integration.description}</p>
                </article>
              ))}
            </section>
          </>
        )}
      </main>

      <footer className="footer">
        <span>KSX Admin</span>
        <span>Go · React · TypeScript</span>
      </footer>
    </div>
  );
}
