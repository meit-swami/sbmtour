import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../db/pool.js";

export const footerAdminRouter = Router();

const WIDGET_TYPES = new Set([
  "logo",
  "menu",
  "contact",
  "social",
  "instagram",
  "facebook",
  "youtube",
  "custom",
  "text",
]);

footerAdminRouter.get("/layouts", async (_req, res, next) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, layout_name, layout_slug, status, active, created_at, updated_at
       FROM tbl_footer_layouts ORDER BY id ASC`
    );
    res.json({ data: rows });
  } catch (e) {
    next(e);
  }
});

footerAdminRouter.patch("/layouts/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const b = req.body ?? {};
    const fields: string[] = [];
    const vals: unknown[] = [];
    if (b.status !== undefined) {
      fields.push("status = ?");
      vals.push(Number(b.status) ? 1 : 0);
    }
    if (b.active !== undefined) {
      const on = Number(b.active) === 1 || b.active === true;
      if (on) {
        await pool.query(`UPDATE tbl_footer_layouts SET active = 0`);
        await pool.query(
          `UPDATE tbl_web_settings SET active_footer_type = 'dynamic', active_footer_id = ? WHERE id = 1`,
          [id]
        );
      }
      fields.push("active = ?");
      vals.push(on ? 1 : 0);
    }
    if (!fields.length) {
      res.status(400).json({ error: "No valid fields" });
      return;
    }
    vals.push(id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tbl_footer_layouts SET ${fields.join(", ")} WHERE id = ?`,
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

footerAdminRouter.get("/layouts/:layoutId/widgets", async (req, res, next) => {
  try {
    const layoutId = Number(req.params.layoutId);
    if (!Number.isFinite(layoutId) || layoutId < 1) {
      res.status(400).json({ error: "Invalid layout id" });
      return;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM tbl_footer_widgets WHERE layout_id = ?
       ORDER BY column_position ASC, row_order ASC, id ASC`,
      [layoutId]
    );
    res.json({ data: rows });
  } catch (e) {
    next(e);
  }
});

footerAdminRouter.post("/widgets/:id/move-sibling", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const dir = String((req.body ?? {}).direction ?? "");
    if (dir !== "up" && dir !== "down") {
      res.status(400).json({ error: 'direction must be "up" or "down"' });
      return;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, layout_id, column_position, row_order FROM tbl_footer_widgets WHERE id = ? LIMIT 1`,
      [id]
    );
    const row = rows[0] as
      | {
          layout_id: number;
          column_position: number;
          row_order: number;
        }
      | undefined;
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const [siblings] = await pool.query<RowDataPacket[]>(
      `SELECT id, row_order FROM tbl_footer_widgets
       WHERE layout_id = ? AND column_position = ?
       ORDER BY row_order ASC, id ASC`,
      [row.layout_id, row.column_position]
    );
    const list = siblings as { id: number; row_order: number }[];
    const idx = list.findIndex((x) => x.id === id);
    if (idx < 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const swapWith = dir === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= list.length) {
      res.json({ ok: true, moved: false });
      return;
    }
    const a = list[idx];
    const b = list[swapWith];
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        `UPDATE tbl_footer_widgets SET row_order = ? WHERE id = ?`,
        [b.row_order, a.id]
      );
      await conn.query(
        `UPDATE tbl_footer_widgets SET row_order = ? WHERE id = ?`,
        [a.row_order, b.id]
      );
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
    res.json({ ok: true, moved: true });
  } catch (e) {
    next(e);
  }
});

footerAdminRouter.get("/widgets/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM tbl_footer_widgets WHERE id = ? LIMIT 1",
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

footerAdminRouter.patch("/widgets/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const b = req.body ?? {};
    const fields: string[] = [];
    const vals: unknown[] = [];

    if (b.widget_type !== undefined) {
      const t = String(b.widget_type);
      if (!WIDGET_TYPES.has(t)) {
        res.status(400).json({ error: "Invalid widget_type" });
        return;
      }
      fields.push("widget_type = ?");
      vals.push(t);
    }
    if (b.widget_title !== undefined) {
      fields.push("widget_title = ?");
      vals.push(b.widget_title === null ? null : String(b.widget_title));
    }
    if (b.widget_content !== undefined) {
      fields.push("widget_content = ?");
      vals.push(b.widget_content === null ? null : String(b.widget_content));
    }
    if (b.widget_url !== undefined) {
      fields.push("widget_url = ?");
      vals.push(b.widget_url === null ? null : String(b.widget_url));
    }
    if (b.widget_iframe !== undefined) {
      fields.push("widget_iframe = ?");
      vals.push(b.widget_iframe === null ? null : String(b.widget_iframe));
    }
    if (b.column_position !== undefined) {
      fields.push("column_position = ?");
      vals.push(Math.max(1, Number(b.column_position) || 1));
    }
    if (b.row_order !== undefined) {
      fields.push("row_order = ?");
      vals.push(Number(b.row_order) || 0);
    }
    if (b.css_class !== undefined) {
      fields.push("css_class = ?");
      vals.push(b.css_class === null ? null : String(b.css_class));
    }
    if (b.status !== undefined) {
      fields.push("status = ?");
      vals.push(Number(b.status) ? 1 : 0);
    }

    if (!fields.length) {
      res.status(400).json({ error: "No valid fields" });
      return;
    }
    vals.push(id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tbl_footer_widgets SET ${fields.join(", ")} WHERE id = ?`,
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
