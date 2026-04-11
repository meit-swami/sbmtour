import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../../db/pool.js";
import { slugify } from "../../../util/slugify.js";
import { nextUniqueSlug } from "../helpers/uniqueSlug.js";

export const carsAdminRouter = Router();

carsAdminRouter.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 80, 1), 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const q = (req.query.q as string | undefined)?.trim();
    let where = "";
    const params: unknown[] = [];
    if (q) {
      where = "WHERE car_name LIKE ? OR car_slug LIKE ?";
      params.push(`%${q}%`, `%${q}%`);
    }
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM tbl_car ${where}`,
      params
    );
    const total = Number((countRows[0] as { c: number }).c);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM tbl_car ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json({ data: rows, meta: { total, limit, offset } });
  } catch (e) {
    next(e);
  }
});

carsAdminRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM tbl_car WHERE id = ? LIMIT 1",
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

carsAdminRouter.post("/", async (req, res, next) => {
  try {
    const b = req.body ?? {};
    const car_name = String(b.car_name ?? "").trim();
    if (!car_name) {
      res.status(400).json({ error: "car_name required" });
      return;
    }
    const car_slug = await nextUniqueSlug(
      "SELECT id FROM tbl_car WHERE car_slug = ? LIMIT 1",
      slugify(String(b.car_slug ?? "").trim() || car_name)
    );
    const car_type = String(b.car_type ?? "").trim();
    const carDesc = String(b.carDesc ?? "");
    const car_image = String(b.car_image ?? "");
    const created_at = String(b.created_at ?? Math.floor(Date.now() / 1000));
    const show_on_off = Number(b.show_on_off) === 1 ? 1 : 0;
    const status = Number(b.status) === 0 ? 0 : 1;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tbl_car (car_name, car_slug, car_type, carDesc, car_image, created_at, show_on_off, status)
       VALUES (?,?,?,?,?,?,?,?)`,
      [car_name, car_slug, car_type, carDesc, car_image, created_at, show_on_off, status]
    );
    res.status(201).json({ data: { id: result.insertId } });
  } catch (e) {
    next(e);
  }
});

carsAdminRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const b = req.body ?? {};
    const fields: string[] = [];
    const vals: unknown[] = [];
    const push = (c: string, v: unknown) => {
      fields.push(`${c} = ?`);
      vals.push(v);
    };
    if (b.car_name !== undefined) push("car_name", String(b.car_name).trim());
    if (b.car_slug !== undefined) {
      const s = String(b.car_slug).trim();
      if (s) {
        let slug = slugify(s);
        let n = 0;
        while (true) {
          const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT id FROM tbl_car WHERE car_slug = ? AND id <> ? LIMIT 1",
            [slug, id]
          );
          if (!rows.length) break;
          n += 1;
          slug = `${slugify(s)}-${n}`;
        }
        push("car_slug", slug);
      }
    }
    if (b.car_type !== undefined) push("car_type", String(b.car_type ?? ""));
    if (b.carDesc !== undefined) push("carDesc", String(b.carDesc ?? ""));
    if (b.car_image !== undefined) push("car_image", String(b.car_image ?? ""));
    if (b.show_on_off !== undefined)
      push("show_on_off", Number(b.show_on_off) === 1 ? 1 : 0);
    if (b.status !== undefined) push("status", Number(b.status) === 0 ? 0 : 1);

    if (!fields.length) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }
    vals.push(id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tbl_car SET ${fields.join(", ")} WHERE id = ?`,
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
