import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { pool } from "../../db/pool.js";

/** Minimal list for assignee pickers (no passwords). */
export const adminUsersRouter = Router();

adminUsersRouter.get("/", async (_req, res, next) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, username, email FROM tbl_admin ORDER BY id ASC`
    );
    res.json({ data: rows });
  } catch (e) {
    next(e);
  }
});
