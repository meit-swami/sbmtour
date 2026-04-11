import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../../db/pool.js";
import { slugify } from "../../../util/slugify.js";
import { nextUniqueSlug } from "../helpers/uniqueSlug.js";

export const countriesAdminRouter = Router();

countriesAdminRouter.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 80, 1), 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const q = (req.query.q as string | undefined)?.trim();
    let where = "";
    const params: unknown[] = [];
    if (q) {
      where = "WHERE country_name LIKE ? OR country_slug LIKE ?";
      params.push(`%${q}%`, `%${q}%`);
    }
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM tbl_country ${where}`,
      params
    );
    const total = Number((countRows[0] as { c: number }).c);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM tbl_country ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json({ data: rows, meta: { total, limit, offset } });
  } catch (e) {
    next(e);
  }
});

countriesAdminRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM tbl_country WHERE id = ? LIMIT 1",
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

countriesAdminRouter.post("/", async (req, res, next) => {
  try {
    const b = req.body ?? {};
    const country_name = String(b.country_name ?? "").trim();
    if (!country_name) {
      res.status(400).json({ error: "country_name required" });
      return;
    }
    const rawSlug = String(b.country_slug ?? "").trim();
    const base = slugify(rawSlug || country_name);
    const country_slug = await nextUniqueSlug(
      "SELECT id FROM tbl_country WHERE country_slug = ? LIMIT 1",
      base
    );
    const country_image = String(b.country_image ?? "").trim();
    const product_features = String(b.product_features ?? "");
    const set_on_home = Number(b.set_on_home) === 1 ? 1 : 0;
    const status = Number(b.status) === 0 ? 0 : 1;
    const created_at = String(
      b.created_at ?? Math.floor(Date.now() / 1000)
    );

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tbl_country
        (country_name, country_slug, country_image, product_features, set_on_home, created_at, status)
       VALUES (?,?,?,?,?,?,?)`,
      [
        country_name,
        country_slug,
        country_image,
        product_features,
        set_on_home,
        created_at,
        status,
      ]
    );
    res.status(201).json({ data: { id: result.insertId } });
  } catch (e) {
    next(e);
  }
});

countriesAdminRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const b = req.body ?? {};
    const fields: string[] = [];
    const vals: unknown[] = [];
    const push = (col: string, val: unknown) => {
      fields.push(`${col} = ?`);
      vals.push(val);
    };
    if (b.country_name !== undefined)
      push("country_name", String(b.country_name).trim());
    if (b.country_slug !== undefined) {
      const s = String(b.country_slug).trim();
      if (s) {
        let slug = slugify(s);
        let n = 0;
        while (true) {
          const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT id FROM tbl_country WHERE country_slug = ? AND id <> ? LIMIT 1",
            [slug, id]
          );
          if (!rows.length) break;
          n += 1;
          slug = `${slugify(s)}-${n}`;
        }
        push("country_slug", slug);
      }
    }
    if (b.country_image !== undefined)
      push("country_image", String(b.country_image ?? ""));
    if (b.product_features !== undefined)
      push("product_features", String(b.product_features ?? ""));
    if (b.set_on_home !== undefined)
      push("set_on_home", Number(b.set_on_home) === 1 ? 1 : 0);
    if (b.status !== undefined) push("status", Number(b.status) === 0 ? 0 : 1);

    if (!fields.length) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }
    vals.push(id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tbl_country SET ${fields.join(", ")} WHERE id = ?`,
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
