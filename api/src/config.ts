import "dotenv/config";

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === "") {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return v;
}

export const config = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV ?? "development",
  webOrigins: (process.env.WEB_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  /** Canonical origin for sitemap / absolute URLs (no trailing slash). */
  publicSiteUrl: process.env.PUBLIC_SITE_URL ?? "",
  jwt: {
    secret: required("JWT_SECRET", "dev-only-change-me"),
    expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  },
  db: {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "u334425891_sbm",
  },
};
