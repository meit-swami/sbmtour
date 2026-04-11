import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../db/pool.js";

const STATUSES = new Set([
  "pending",
  "confirmed",
  "processing",
  "completed",
  "cancelled",
]);

export const bookingRequestsAdminRouter = Router();

bookingRequestsAdminRouter.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 150);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const status = req.query.status as string | undefined;
    let where = "";
    const params: unknown[] = [];
    if (status && STATUSES.has(status)) {
      where = "WHERE status = ?";
      params.push(status);
    }
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM tbl_booking_requests ${where}`,
      params
    );
    const total = Number((countRows[0] as { c: number }).c);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, booking_id, destination, customer_name, customer_email, customer_phone,
              departure_date, duration_days, status, created_at
       FROM tbl_booking_requests ${where}
       ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json({ data: rows, meta: { total, limit, offset } });
  } catch (e) {
    next(e);
  }
});

bookingRequestsAdminRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM tbl_booking_requests WHERE id = ? LIMIT 1",
      [id]
    );
    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ data: row });
  } catch (e) {
    next(e);
  }
});

bookingRequestsAdminRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const status = req.body?.status as string | undefined;
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    if (!status || !STATUSES.has(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tbl_booking_requests SET status = ? WHERE id = ?`,
      [status, id]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
