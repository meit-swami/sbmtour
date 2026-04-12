import cors from "cors";
import express, { type RequestHandler } from "express";
import helmetImport from "helmet";
import rateLimitImport from "express-rate-limit";
import multer from "multer";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { config } from "./config.js";
import { legacyImagesDir } from "./legacyAssets.js";
import { publicRouter } from "./routes/public/index.js";
import { adminRouter } from "./routes/admin/index.js";

/** Default-import types for helmet / rate-limit disagree with NodeNext + package typings on some TS versions. */
const helmet = helmetImport as unknown as (options?: {
  contentSecurityPolicy?: false | Record<string, unknown>;
}) => RequestHandler;
const rateLimit = rateLimitImport as unknown as (options: {
  windowMs: number;
  max: number;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  skip?: (req: express.Request) => boolean;
}) => RequestHandler;

const app = express();

/** Render/root URL check — API lives under `/api/*`. */
app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "SBM API",
    health: "/api/health",
  });
});

const uploadsRoot = join(process.cwd(), "uploads");
mkdirSync(uploadsRoot, { recursive: true });
app.use("/api/uploads", express.static(uploadsRoot));

app.get("/sitemap.xml", (_req, res) => {
  res.redirect(301, "/api/sitemap.xml");
});

app.get("/robots.txt", (_req, res) => {
  res.redirect(301, "/api/robots.txt");
});

const legacyImg = legacyImagesDir();
if (existsSync(legacyImg)) {
  app.use("/legacy-media", express.static(legacyImg));
} else {
  console.warn(`[api] Legacy images not found at ${legacyImg} (copy or symlink repo assets/images)`);
}

/** JSON API — CSP is enforced on the Vite SPA (see `web/vite.config.ts`), not here. */
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: config.webOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

/** Safety net for public POSTs; stricter limits exist on enquiry/support forms. */
const publicPostLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: express.Request) => req.method !== "POST",
});

app.use("/api", publicPostLimiter, publicRouter);
app.use("/api/admin", adminRouter);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    if (err instanceof multer.MulterError) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (err.message === "Only images (or mp4/webm for banner scope) are allowed") {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
);

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
