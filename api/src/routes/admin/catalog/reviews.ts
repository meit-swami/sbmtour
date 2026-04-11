import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../../db/pool.js";

export const reviewsAdminRouter = Router();

reviewsAdminRouter.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 80, 1), 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const [countRows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS c FROM tbl_review"
    );
    const total = Number((countRows[0] as { c: number }).c);
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM tbl_review ORDER BY id DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );
    res.json({ data: rows, meta: { total, limit, offset } });
  } catch (e) {
    next(e);
  }
});

reviewsAdminRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM tbl_review WHERE id = ? LIMIT 1",
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

reviewsAdminRouter.post("/", async (req, res, next) => {
  try {
    const b = req.body ?? {};
    const reviewer_name = String(b.reviewer_name ?? "").trim();
    if (!reviewer_name) {
      res.status(400).json({ error: "reviewer_name required" });
      return;
    }
    const reviewer_place = String(b.reviewer_place ?? "");
    const review_desc = String(b.review_desc ?? "");
    const review_image = String(b.review_image ?? "");
    const created_at = String(b.created_at ?? Math.floor(Date.now() / 1000));
    const status = Number(b.status) === 0 ? 0 : 1;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tbl_review (reviewer_name, reviewer_place, review_desc, review_image, created_at, status)
       VALUES (?,?,?,?,?,?)`,
      [reviewer_name, reviewer_place, review_desc, review_image, created_at, status]
    );
    res.status(201).json({ data: { id: result.insertId } });
  } catch (e) {
    next(e);
  }
});

reviewsAdminRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const b = req.body ?? {};
    const fields: string[] = [];
    const vals: unknown[] = [];
    if (b.reviewer_name !== undefined) {
      fields.push("reviewer_name = ?");
      vals.push(String(b.reviewer_name));
    }
    if (b.reviewer_place !== undefined) {
      fields.push("reviewer_place = ?");
      vals.push(String(b.reviewer_place ?? ""));
    }
    if (b.review_desc !== undefined) {
      fields.push("review_desc = ?");
      vals.push(String(b.review_desc ?? ""));
    }
    if (b.review_image !== undefined) {
      fields.push("review_image = ?");
      vals.push(String(b.review_image ?? ""));
    }
    if (b.status !== undefined) {
      fields.push("status = ?");
      vals.push(Number(b.status) === 0 ? 0 : 1);
    }
    if (!fields.length) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }
    vals.push(id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tbl_review SET ${fields.join(", ")} WHERE id = ?`,
      vals
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
