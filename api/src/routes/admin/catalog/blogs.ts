import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../../db/pool.js";
import { slugify } from "../../../util/slugify.js";
import { nextUniqueSlug } from "../helpers/uniqueSlug.js";

export const blogsAdminRouter = Router();

blogsAdminRouter.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 80, 1), 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const [countRows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS c FROM tbl_blog"
    );
    const total = Number((countRows[0] as { c: number }).c);
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM tbl_blog ORDER BY id DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );
    res.json({ data: rows, meta: { total, limit, offset } });
  } catch (e) {
    next(e);
  }
});

blogsAdminRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM tbl_blog WHERE id = ? LIMIT 1",
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

blogsAdminRouter.post("/", async (req, res, next) => {
  try {
    const b = req.body ?? {};
    const blog_name = String(b.blog_name ?? "").trim();
    const blogPlace = String(b.blogPlace ?? "").trim();
    const blog_slug = await nextUniqueSlug(
      "SELECT id FROM tbl_blog WHERE blog_slug = ? LIMIT 1",
      slugify(String(b.blog_slug ?? "").trim() || blog_name || "post")
    );
    const blogDate = String(b.blogDate ?? new Date().toISOString().slice(0, 10));
    const blogDesc = String(b.blogDesc ?? "");
    const blog_image = String(b.blog_image ?? "");
    const created_at = String(b.created_at ?? Math.floor(Date.now() / 1000));
    const show_on_off = Number(b.show_on_off) === 1 ? 1 : 0;
    const status = Number(b.status) === 0 ? 0 : 1;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tbl_blog (blog_name, blogPlace, blog_slug, blogDate, blogDesc, blog_image, created_at, show_on_off, status)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        blog_name,
        blogPlace,
        blog_slug,
        blogDate,
        blogDesc,
        blog_image,
        created_at,
        show_on_off,
        status,
      ]
    );
    res.status(201).json({ data: { id: result.insertId } });
  } catch (e) {
    next(e);
  }
});

blogsAdminRouter.patch("/:id", async (req, res, next) => {
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
    if (b.blog_name !== undefined) add("blog_name", String(b.blog_name));
    if (b.blogPlace !== undefined) add("blogPlace", String(b.blogPlace ?? ""));
    if (b.blog_slug !== undefined) {
      const s = String(b.blog_slug).trim();
      if (s) {
        let slug = slugify(s);
        let n = 0;
        while (true) {
          const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT id FROM tbl_blog WHERE blog_slug = ? AND id <> ? LIMIT 1",
            [slug, id]
          );
          if (!rows.length) break;
          n += 1;
          slug = `${slugify(s)}-${n}`;
        }
        add("blog_slug", slug);
      }
    }
    if (b.blogDate !== undefined) add("blogDate", String(b.blogDate ?? ""));
    if (b.blogDesc !== undefined) add("blogDesc", String(b.blogDesc ?? ""));
    if (b.blog_image !== undefined) add("blog_image", String(b.blog_image ?? ""));
    if (b.show_on_off !== undefined)
      add("show_on_off", Number(b.show_on_off) === 1 ? 1 : 0);
    if (b.status !== undefined) add("status", Number(b.status) === 0 ? 0 : 1);

    if (!fields.length) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }
    vals.push(id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tbl_blog SET ${fields.join(", ")} WHERE id = ?`,
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
