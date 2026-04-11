import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Project root `JS New Website/` → `assets/images`. */
export function legacyImagesDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, "../../assets/images");
}
