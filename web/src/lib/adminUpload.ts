import { getAdminToken } from "./adminApi";

export async function uploadAdminFile(
  scope: string,
  file: File
): Promise<{ filename: string; url: string }> {
  const token = getAdminToken();
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(
    `/api/admin/upload?scope=${encodeURIComponent(scope)}`,
    {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: fd,
    }
  );
  const json = (await res.json().catch(() => ({}))) as {
    error?: string;
    data?: { filename: string; url: string };
  };
  if (!res.ok || !json.data?.filename) {
    throw new Error(json.error ?? "Upload failed");
  }
  return json.data;
}
