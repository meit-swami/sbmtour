import type { RequestHandler } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import bcrypt from "bcrypt";
import {
  verifyAdminPassword,
} from "../../auth/adminPassword.js";
import { pool } from "../../db/pool.js";

export const changePasswordHandler: RequestHandler = async (req, res, next) => {
  try {
    const adminId = req.admin?.id;
    if (!adminId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const current = String(req.body?.current_password ?? "");
    const nextPass = String(req.body?.new_password ?? "");
    if (!current || !nextPass) {
      res
        .status(400)
        .json({ error: "current_password and new_password required" });
      return;
    }
    if (nextPass.length < 8) {
      res
        .status(400)
        .json({ error: "new_password must be at least 8 characters" });
      return;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT password FROM tbl_admin WHERE id = ? LIMIT 1",
      [adminId]
    );
    const hash = (rows[0] as { password: string } | undefined)?.password;
    if (!hash) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const ok = await verifyAdminPassword(current, hash);
    if (!ok) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }
    const newHash = await bcrypt.hash(nextPass, 10);
    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE tbl_admin SET password = ? WHERE id = ?",
      [newHash, adminId]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
