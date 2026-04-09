const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000/api";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("shiftly_token");
}

function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("shiftly_refresh_token");
}

export function clearAuth() {
  localStorage.removeItem("shiftly_token");
  localStorage.removeItem("shiftly_refresh_token");
}

async function tryRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;

    const data = await res.json() as { accessToken: string; refreshToken?: string };
    localStorage.setItem("shiftly_token", data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem("shiftly_refresh_token", data.refreshToken);
    }
    return data.accessToken;
  } catch {
    return null;
  }
}

export async function apiFetchClient<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.status === 401) {
    const newToken = await tryRefresh();
    if (newToken) {
      const retry = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options?.headers ?? {}),
          Authorization: `Bearer ${newToken}`,
        },
      });
      if (retry.ok) return retry.json() as Promise<T>;
    }
    clearAuth();
    window.dispatchEvent(new Event("shiftly:logout"));
    window.location.href = "/login";
    throw new Error("Session expirée");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(body.message || `API error ${response.status}`);
  }

  return response.json() as Promise<T>;
}
