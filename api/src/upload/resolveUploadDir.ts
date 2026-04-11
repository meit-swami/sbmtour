import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { legacyImagesDir } from "../legacyAssets.js";

/** Subfolders under `assets/images` used by the legacy PHP site + React `legacyMediaUrl`. */
export const UPLOAD_SCOPES = new Set([
  "country",
  "destination",
  "packages",
  "blogs",
  "banner",
  "review",
  "hotel",
  "car",
  "team",
]);

export function resolveUploadDir(scope: string): { dir: string; publicPath: "legacy-media" | "uploads" } {
  if (!UPLOAD_SCOPES.has(scope)) {
    throw new Error("Invalid upload scope");
  }
  const legacyBase = legacyImagesDir();
  if (existsSync(legacyBase)) {
    const dir = join(legacyBase, scope);
    mkdirSync(dir, { recursive: true });
    return { dir, publicPath: "legacy-media" };
  }
  const cwd = process.cwd();
  const dir = join(cwd, "uploads", scope);
  mkdirSync(dir, { recursive: true });
  return { dir, publicPath: "uploads" };
}

export function safeFilename(original: string): string {
  const base = original.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}_${base || "file"}`;
}
