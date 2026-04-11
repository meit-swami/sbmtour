import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

type JwtAdmin = { sub: string; u: string };

export const requireAdmin: RequestHandler = (req, res, next) => {
  const h = req.headers.authorization;
  const raw = h?.startsWith("Bearer ") ? h.slice(7).trim() : "";
  if (!raw) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = jwt.verify(raw, config.jwt.secret) as JwtAdmin;
    const id = Number(payload.sub);
    if (!Number.isFinite(id) || !payload.u) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }
    req.admin = { id, username: payload.u };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
