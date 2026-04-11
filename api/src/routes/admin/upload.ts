import { Router } from "express";
import multer from "multer";
import type { Request } from "express";
import { resolveUploadDir, safeFilename } from "../../upload/resolveUploadDir.js";

const imageMime = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);
const videoMime = new Set(["video/mp4", "video/webm"]);

function fileFilter(scope: string) {
  return (
    _req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    if (scope === "banner" && videoMime.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    if (imageMime.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error("Only images (or mp4/webm for banner scope) are allowed"));
  };
}

export const uploadAdminRouter = Router();

uploadAdminRouter.post("/", (req, res, next) => {
  const scope = String(req.query.scope ?? "");
  let dir: string;
  let publicPath: "legacy-media" | "uploads";
  try {
    const r = resolveUploadDir(scope);
    dir = r.dir;
    publicPath = r.publicPath;
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
    return;
  }

  const mw = multer({
    storage: multer.diskStorage({
      destination: (_a, _b, cb) => cb(null, dir),
      filename: (_a, file, cb) => cb(null, safeFilename(file.originalname)),
    }),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: fileFilter(scope),
  }).single("file");

  mw(req, res, (err) => {
    if (err) {
      next(err);
      return;
    }
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "Missing file" });
      return;
    }
    const url =
      publicPath === "legacy-media"
        ? `/legacy-media/${scope}/${encodeURIComponent(file.filename)}`
        : `/api/uploads/${scope}/${encodeURIComponent(file.filename)}`;
    res.json({
      data: { filename: file.filename, url, scope },
    });
  });
});
