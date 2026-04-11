import type { RequestHandler } from "express";
import type { RowDataPacket } from "mysql2";
import jwt, { type SignOptions } from "jsonwebtoken";
import {
  upgradeAdminPasswordIfLegacy,
  verifyAdminPassword,
} from "../../auth/adminPassword.js";
import { config } from "../../config.js";
import { pool } from "../../db/pool.js";

export const adminLoginHandler: RequestHandler = async (req, res, next) => {
  try {
    const username = String(req.body?.username ?? "")
      .trim()
      .slice(0, 100);
    const password = String(req.body?.password ?? "");
    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required." });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, username, email, password FROM tbl_admin WHERE username = ? LIMIT 1`,
      [username]
    );
    const row = rows[0] as
      | { id: number; username: string; email: string; password: string }
      | undefined;

    if (!row) {
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }

    const ok = await verifyAdminPassword(password, row.password);
    if (!ok) {
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }

    await upgradeAdminPasswordIfLegacy(row.id, password, row.password);

    const token = jwt.sign(
      { sub: String(row.id), u: row.username },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as SignOptions
    );

    res.json({
      data: {
        token,
        admin: {
          id: row.id,
          username: row.username,
          email: row.email,
        },
      },
    });
  } catch (e) {
    next(e);
  }
};
