/** Matches legacy PHP paths under `assets/images/{subfolder}/`. */
export function legacyMediaUrl(
  subfolder: string,
  filename?: string | null
): string | undefined {
  if (!filename?.trim()) return undefined;
  const f = filename.trim();
  if (/^https?:\/\//i.test(f)) return f;
  const safe = f
    .split("/")
    .filter((p) => p && p !== "..")
    .map(encodeURIComponent)
    .join("/");
  const folder = subfolder.replace(/^\/+|\/+$/g, "");
  return `/legacy-media/${folder}/${safe}`;
}
