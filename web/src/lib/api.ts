const envBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const base = envBase ? envBase.replace(/\/+$/, "") : "";

export function buildApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (!base) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(json.error ?? `${res.status} ${res.statusText}`);
  }
  return json as T;
}
