import { useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import Icon from "../components/Icon";
import { AuthLoading, useAuth } from "../lib/auth";
import "./Login.css";

export default function Login() {
  const { state, login } = useAuth();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/";

  if (state.status === "loading") {
    return <AuthLoading />;
  }

  if (state.status === "authenticated") {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username.trim() || !password) {
      setError("Enter your username and password.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-orb login-orb-a" aria-hidden="true" />
      <div className="login-orb login-orb-b" aria-hidden="true" />

      <main className="login-shell">
        <section className="login-card">
          <div className="login-brand">
            <span className="login-mark" aria-hidden="true">
              KSX
            </span>
            <span className="login-brand-text">
              <strong>Admin</strong>
              <small>Control plane</small>
            </span>
          </div>

          <div className="login-head">
            <span className="login-kicker">Restricted access</span>
            <h1>Sign in</h1>
            <p>Use your KSX admin credentials to continue.</p>
          </div>

          <form className="login-form" onSubmit={onSubmit}>
            <label className="login-field">
              <span>Username</span>
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="kswarrior"
                autoFocus
                disabled={submitting}
              />
            </label>

            <label className="login-field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                disabled={submitting}
              />
            </label>

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button className="login-submit" type="submit" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
              {!submitting && <Icon name="arrow-right" size={15} />}
            </button>
          </form>

          <div className="login-foot">
            <span className="login-live">
              <i aria-hidden="true" />
              HttpOnly session
            </span>
            <span>Go · React · TypeScript</span>
          </div>
        </section>
      </main>
    </div>
  );
}
