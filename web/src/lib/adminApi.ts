import { buildApiUrl } from "./api";

const TOKEN_KEY = "sbm_admin_jwt";

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function parseJwtPayload(segment: string): Record<string, unknown> {
  let s = segment.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4;
  if (pad) s += "=".repeat(4 - pad);
  return JSON.parse(atob(s)) as Record<string, unknown>;
}

export function getAdminUser(): { username: string } | null {
  const t = getAdminToken();
  if (!t) return null;
  try {
    const part = t.split(".")[1];
    if (!part) return null;
    const json = parseJwtPayload(part) as { u?: string };
    return json.u ? { username: json.u } : null;
  } catch {
    return null;
  }
}

export async function loginAdmin(
  username: string,
  password: string
): Promise<{ id: number; username: string; email: string }> {
  const res = await fetch(buildApiUrl("/api/admin/auth/login"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    error?: string;
    data?: {
      token: string;
      admin: { id: number; username: string; email: string };
    };
  };
  if (!res.ok || !json.data?.token) {
    throw new Error(json.error ?? "Login failed");
  }
  setAdminToken(json.data.token);
  return json.data.admin;
}

export async function adminApiGet<T>(path: string): Promise<T> {
  const token = getAdminToken();
  const res = await fetch(buildApiUrl(path), {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (res.status === 401) {
    setAdminToken(null);
  }
  if (!res.ok) {
    throw new Error(json.error ?? `${res.status} ${res.statusText}`);
  }
  return json as T;
}

export async function adminApiPut<T>(path: string, body: unknown): Promise<T> {
  const token = getAdminToken();
  const res = await fetch(buildApiUrl(path), {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (res.status === 401) {
    setAdminToken(null);
  }
  if (!res.ok) {
    throw new Error(json.error ?? `${res.status} ${res.statusText}`);
  }
  return json as T;
}

export async function adminApiPatch<T>(path: string, body: unknown): Promise<T> {
  const token = getAdminToken();
  const res = await fetch(buildApiUrl(path), {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (res.status === 401) {
    setAdminToken(null);
  }
  if (!res.ok) {
    throw new Error(json.error ?? `${res.status} ${res.statusText}`);
  }
  return json as T;
}

export async function adminDownloadCsv(
  path: string,
  filename: string
): Promise<void> {
  const token = getAdminToken();
  const res = await fetch(buildApiUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) {
    setAdminToken(null);
  }
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error ?? `${res.status} ${res.statusText}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function adminApiPost<T>(path: string, body: unknown): Promise<T> {
  const token = getAdminToken();
  const res = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (res.status === 401) {
    setAdminToken(null);
  }
  if (!res.ok) {
    throw new Error(json.error ?? `${res.status} ${res.statusText}`);
  }
  return json as T;
}
