import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; username: string }
  | { status: "anonymous" };

type AuthContextValue = {
  state: AuthState;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    fetch("/api/session", { headers: { Accept: "application/json" } })
      .then(async (response) => {
        if (!active) return;
        if (!response.ok) {
          setState({ status: "anonymous" });
          return;
        }
        const data = (await response.json()) as { username?: string };
        if (!active) return;
        setState({ status: "authenticated", username: data.username ?? "admin" });
      })
      .catch(() => {
        if (active) setState({ status: "anonymous" });
      });

    return () => {
      active = false;
    };
  }, []);

  const login = async (username: string, password: string) => {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      username?: string;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(data.error ?? "Unable to sign in");
    }

    setState({ status: "authenticated", username: data.username ?? username });
  };

  const logout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        headers: { Accept: "application/json" },
      });
    } finally {
      setState({ status: "anonymous" });
    }
  };

  return (
    <AuthContext.Provider value={{ state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}

export function AuthLoading() {
  return (
    <div className="auth-loading">
      <span className="auth-spinner" aria-hidden="true" />
      Checking session...
    </div>
  );
}

export function RequireAuth() {
  const { state } = useAuth();
  const location = useLocation();

  if (state.status === "loading") {
    return <AuthLoading />;
  }

  if (state.status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
