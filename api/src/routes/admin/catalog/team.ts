import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../../db/pool.js";

export const teamAdminRouter = Router();

teamAdminRouter.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 80, 1), 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const [countRows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS c FROM tbl_team"
    );
    const total = Number((countRows[0] as { c: number }).c);
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM tbl_team ORDER BY id DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );
    res.json({ data: rows, meta: { total, limit, offset } });
  } catch (e) {
    next(e);
  }
});

teamAdminRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM tbl_team WHERE id = ? LIMIT 1",
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

teamAdminRouter.post("/", async (req, res, next) => {
  try {
    const b = req.body ?? {};
    const person_name = String(b.person_name ?? "").trim();
    if (!person_name) {
      res.status(400).json({ error: "person_name required" });
      return;
    }
    const person_pose = String(b.person_pose ?? "");
    const personDesc = String(b.personDesc ?? "");
    const person_image = String(b.person_image ?? "");
    const created_at = String(b.created_at ?? Math.floor(Date.now() / 1000));
    const status = Number(b.status) === 0 ? 0 : 1;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tbl_team (person_name, person_pose, personDesc, person_image, created_at, status)
       VALUES (?,?,?,?,?,?)`,
      [person_name, person_pose, personDesc, person_image, created_at, status]
    );
    res.status(201).json({ data: { id: result.insertId } });
  } catch (e) {
    next(e);
  }
});

teamAdminRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const b = req.body ?? {};
    const fields: string[] = [];
    const vals: unknown[] = [];
    if (b.person_name !== undefined) {
      fields.push("person_name = ?");
      vals.push(String(b.person_name));
    }
    if (b.person_pose !== undefined) {
      fields.push("person_pose = ?");
      vals.push(String(b.person_pose ?? ""));
    }
    if (b.personDesc !== undefined) {
      fields.push("personDesc = ?");
      vals.push(String(b.personDesc ?? ""));
    }
    if (b.person_image !== undefined) {
      fields.push("person_image = ?");
      vals.push(String(b.person_image ?? ""));
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
      `UPDATE tbl_team SET ${fields.join(", ")} WHERE id = ?`,
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
