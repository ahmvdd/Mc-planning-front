const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000/api";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mcplanning_token");
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

  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }

  return response.json() as Promise<T>;
}
