import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../../db/pool.js";
import { slugify } from "../../../util/slugify.js";
import { nextUniqueSlug } from "../helpers/uniqueSlug.js";

export const bannersAdminRouter = Router();

bannersAdminRouter.get("/", async (_req, res, next) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM tbl_banner ORDER BY id DESC LIMIT 200"
    );
    res.json({ data: rows });
  } catch (e) {
    next(e);
  }
});

bannersAdminRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM tbl_banner WHERE id = ? LIMIT 1",
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

bannersAdminRouter.post("/", async (req, res, next) => {
  try {
    const b = req.body ?? {};
    const banner_title = String(b.banner_title ?? "").trim() || "Banner";
    const base = slugify(String(b.banner_slug ?? "").trim() || banner_title);
    const banner_slug = await nextUniqueSlug(
      "SELECT id FROM tbl_banner WHERE banner_slug = ? LIMIT 1",
      base
    );
    const banner_desc = String(b.banner_desc ?? "");
    const media_type =
      b.media_type === "video" || b.media_type === "image" ? b.media_type : "image";
    const desktop_image = b.desktop_image ?? null;
    const mobile_image = b.mobile_image ?? null;
    const desktop_video = b.desktop_video ?? null;
    const mobile_video = b.mobile_video ?? null;
    const banner_image = String(b.banner_image ?? "");
    const product_ids = String(b.product_ids ?? "");
    const created_at = String(b.created_at ?? Math.floor(Date.now() / 1000));
    const status = Number(b.status) === 0 ? 0 : 1;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tbl_banner (
        banner_title, banner_slug, banner_desc, media_type, desktop_image, mobile_image,
        desktop_video, mobile_video, banner_image, product_ids, created_at, status
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        banner_title,
        banner_slug,
        banner_desc,
        media_type,
        desktop_image,
        mobile_image,
        desktop_video,
        mobile_video,
        banner_image,
        product_ids,
        created_at,
        status,
      ]
    );
    res.status(201).json({ data: { id: result.insertId } });
  } catch (e) {
    next(e);
  }
});

bannersAdminRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const b = req.body ?? {};
    const fields: string[] = [];
    const vals: unknown[] = [];
    const add = (c: string, v: unknown) => {
      fields.push(`${c} = ?`);
      vals.push(v);
    };
    if (b.banner_title !== undefined) add("banner_title", String(b.banner_title));
    if (b.banner_slug !== undefined) {
      const s = String(b.banner_slug).trim();
      if (s) {
        let slug = slugify(s);
        let n = 0;
        while (true) {
          const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT id FROM tbl_banner WHERE banner_slug = ? AND id <> ? LIMIT 1",
            [slug, id]
          );
          if (!rows.length) break;
          n += 1;
          slug = `${slugify(s)}-${n}`;
        }
        add("banner_slug", slug);
      }
    }
    if (b.banner_desc !== undefined) add("banner_desc", String(b.banner_desc ?? ""));
    if (b.media_type === "video" || b.media_type === "image")
      add("media_type", b.media_type);
    if (b.desktop_image !== undefined) add("desktop_image", b.desktop_image);
    if (b.mobile_image !== undefined) add("mobile_image", b.mobile_image);
    if (b.desktop_video !== undefined) add("desktop_video", b.desktop_video);
    if (b.mobile_video !== undefined) add("mobile_video", b.mobile_video);
    if (b.banner_image !== undefined) add("banner_image", String(b.banner_image ?? ""));
    if (b.product_ids !== undefined) add("product_ids", String(b.product_ids ?? ""));
    if (b.status !== undefined) add("status", Number(b.status) === 0 ? 0 : 1);

    if (!fields.length) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }
    vals.push(id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tbl_banner SET ${fields.join(", ")} WHERE id = ?`,
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
