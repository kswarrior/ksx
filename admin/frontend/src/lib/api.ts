export type Hello = {
  message: string;
  service: string;
  version: string;
  time: string;
};

export type Health = {
  status: string;
  version: string;
  uptime: string;
};

export type Integration = {
  name: string;
  configured: boolean;
  description: string;
};

async function getJSON<T>(path: string): Promise<T> {
  const response = await fetch(path, { headers: { Accept: "application/json" } });

  if (response.status === 401) {
    if (window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }

  return (await response.json()) as T;
}

export const api = {
  hello: () => getJSON<Hello>("/api/hello"),
  health: () => getJSON<Health>("/api/health"),
  integrations: () => getJSON<{ integrations: Integration[] }>("/api/integrations"),
};
