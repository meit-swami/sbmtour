import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * CSP for the SPA. Dev mode relaxes script-src for Vite HMR; preview/production
 * uses stricter script-src. Map embeds (Contact, footer widgets) need google.com frames.
 */
function contentSecurityPolicy(dev: boolean): string {
  const script = dev
    ? "'self' 'unsafe-inline' 'unsafe-eval'"
    : "'self'";
  const connect = dev
    ? "'self' ws: wss: http://127.0.0.1:4000 http://localhost:4000"
    : "'self'";
  const parts = [
    "default-src 'self'",
    `script-src ${script}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    `connect-src ${connect}`,
    "frame-src https://www.google.com https://maps.google.com https://www.google.com/maps https://www.instagram.com https://www.youtube.com https://www.youtube-nocookie.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  if (!dev) {
    parts.push("upgrade-insecure-requests");
  }
  return parts.join("; ");
}

export default defineConfig(({ mode }) => {
  const dev = mode === "development";
  return {
    plugins: [react()],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    server: {
      port: 5173,
      headers: {
        "Content-Security-Policy": contentSecurityPolicy(dev),
      },
      proxy: {
        "/api": {
          target: "http://localhost:4000",
          changeOrigin: true,
        },
        "/legacy-media": {
          target: "http://localhost:4000",
          changeOrigin: true,
        },
        "/sitemap.xml": {
          target: "http://localhost:4000",
          changeOrigin: true,
        },
        "/robots.txt": {
          target: "http://localhost:4000",
          changeOrigin: true,
        },
      },
    },
    preview: {
      headers: {
        "Content-Security-Policy": contentSecurityPolicy(false),
      },
    },
  };
});
