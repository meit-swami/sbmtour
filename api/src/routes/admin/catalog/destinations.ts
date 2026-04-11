import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../../db/pool.js";
import { slugify } from "../../../util/slugify.js";
import { nextUniqueSlug } from "../helpers/uniqueSlug.js";

export const destinationsAdminRouter = Router();

destinationsAdminRouter.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 80, 1), 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const countryId = req.query.country_id as string | undefined;
    const q = (req.query.q as string | undefined)?.trim();
    const parts: string[] = [];
    const params: unknown[] = [];
    if (countryId && Number.isFinite(Number(countryId))) {
      parts.push("d.country_id = ?");
      params.push(Number(countryId));
    }
    if (q) {
      parts.push("(d.destination_name LIKE ? OR d.destination_slug LIKE ?)");
      params.push(`%${q}%`, `%${q}%`);
    }
    const where = parts.length ? `WHERE ${parts.join(" AND ")}` : "";
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM tbl_destination d ${where}`,
      params
    );
    const total = Number((countRows[0] as { c: number }).c);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT d.*, c.country_name
       FROM tbl_destination d
       LEFT JOIN tbl_country c ON c.id = d.country_id
       ${where}
       ORDER BY d.id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json({ data: rows, meta: { total, limit, offset } });
  } catch (e) {
    next(e);
  }
});

destinationsAdminRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT d.*, c.country_name
       FROM tbl_destination d
       LEFT JOIN tbl_country c ON c.id = d.country_id
       WHERE d.id = ? LIMIT 1`,
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

destinationsAdminRouter.post("/", async (req, res, next) => {
  try {
    const b = req.body ?? {};
    const country_id = Number(b.country_id);
    if (!Number.isFinite(country_id) || country_id < 1) {
      res.status(400).json({ error: "country_id required" });
      return;
    }
    const destination_name = String(b.destination_name ?? "").trim();
    if (!destination_name) {
      res.status(400).json({ error: "destination_name required" });
      return;
    }
    const base = slugify(
      String(b.destination_slug ?? "").trim() || destination_name
    );
    const destination_slug = await nextUniqueSlug(
      "SELECT id FROM tbl_destination WHERE destination_slug = ? LIMIT 1",
      base
    );
    const destination_cat = String(b.destination_cat ?? "");
    const destination_type = String(b.destination_type ?? "");
    const destDesc = String(b.destDesc ?? "");
    const metaTagDesc = String(b.metaTagDesc ?? "");
    const keyword = String(b.keyword ?? "");
    const destination_image = String(b.destination_image ?? "");
    const created_at = String(b.created_at ?? Math.floor(Date.now() / 1000));
    const today_deal = Number(b.today_deal) === 1 ? 1 : 0;
    const today_deal_date = String(b.today_deal_date ?? "0");
    const status = Number(b.status) === 0 ? 0 : 1;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tbl_destination
        (country_id, destination_name, destination_slug, destination_cat, destination_type,
         destDesc, metaTagDesc, keyword, destination_image, created_at, today_deal, today_deal_date, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        country_id,
        destination_name,
        destination_slug,
        destination_cat,
        destination_type,
        destDesc,
        metaTagDesc,
        keyword,
        destination_image,
        created_at,
        today_deal,
        today_deal_date,
        status,
      ]
    );
    res.status(201).json({ data: { id: result.insertId } });
  } catch (e) {
    next(e);
  }
});

destinationsAdminRouter.patch("/:id", async (req, res, next) => {
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
    if (b.country_id !== undefined) {
      const cid = Number(b.country_id);
      if (Number.isFinite(cid) && cid >= 1) push("country_id", cid);
    }
    if (b.destination_name !== undefined)
      push("destination_name", String(b.destination_name).trim());
    if (b.destination_slug !== undefined) {
      const s = String(b.destination_slug).trim();
      if (s) {
        let slug = slugify(s);
        let n = 0;
        while (true) {
          const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT id FROM tbl_destination WHERE destination_slug = ? AND id <> ? LIMIT 1",
            [slug, id]
          );
          if (!rows.length) break;
          n += 1;
          slug = `${slugify(s)}-${n}`;
        }
        push("destination_slug", slug);
      }
    }
    if (b.destination_cat !== undefined)
      push("destination_cat", String(b.destination_cat ?? ""));
    if (b.destination_type !== undefined)
      push("destination_type", String(b.destination_type ?? ""));
    if (b.destDesc !== undefined) push("destDesc", String(b.destDesc ?? ""));
    if (b.metaTagDesc !== undefined)
      push("metaTagDesc", String(b.metaTagDesc ?? ""));
    if (b.keyword !== undefined) push("keyword", String(b.keyword ?? ""));
    if (b.destination_image !== undefined)
      push("destination_image", String(b.destination_image ?? ""));
    if (b.today_deal !== undefined)
      push("today_deal", Number(b.today_deal) === 1 ? 1 : 0);
    if (b.today_deal_date !== undefined)
      push("today_deal_date", String(b.today_deal_date ?? ""));
    if (b.status !== undefined) push("status", Number(b.status) === 0 ? 0 : 1);

    if (!fields.length) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }
    vals.push(id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tbl_destination SET ${fields.join(", ")} WHERE id = ?`,
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
