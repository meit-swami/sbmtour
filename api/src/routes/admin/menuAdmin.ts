import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../db/pool.js";

export const menuAdminRouter = Router();

const ITEM_TYPES = new Set([
  "custom",
  "country",
  "destination",
  "package",
  "hotel",
  "vehicle",
  "page",
]);

menuAdminRouter.get("/locations", async (_req, res, next) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, location_name, location_slug, description, status, active, created_at, updated_at
       FROM tbl_menu_locations ORDER BY id ASC`
    );
    res.json({ data: rows });
  } catch (e) {
    next(e);
  }
});

menuAdminRouter.patch("/locations/:id", async (req, res, next) => {
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
        await pool.query(`UPDATE tbl_menu_locations SET active = 0`);
        await pool.query(
          `UPDATE tbl_web_settings SET active_menu_type = 'dynamic', active_menu_id = ? WHERE id = 1`,
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
      `UPDATE tbl_menu_locations SET ${fields.join(", ")} WHERE id = ?`,
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

menuAdminRouter.get("/locations/:locationId/items", async (req, res, next) => {
  try {
    const locationId = Number(req.params.locationId);
    if (!Number.isFinite(locationId) || locationId < 1) {
      res.status(400).json({ error: "Invalid location id" });
      return;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM tbl_menu_items WHERE menu_location_id = ?
       ORDER BY parent_id ASC, menu_order ASC, id ASC`,
      [locationId]
    );
    res.json({ data: rows });
  } catch (e) {
    next(e);
  }
});

menuAdminRouter.get("/items/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM tbl_menu_items WHERE id = ? LIMIT 1",
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

menuAdminRouter.post("/items", async (req, res, next) => {
  try {
    const b = req.body ?? {};
    const menu_location_id = Number(b.menu_location_id);
    if (!Number.isFinite(menu_location_id) || menu_location_id < 1) {
      res.status(400).json({ error: "menu_location_id required" });
      return;
    }
    const item_title = String(b.item_title ?? "").trim();
    if (!item_title) {
      res.status(400).json({ error: "item_title required" });
      return;
    }
    const item_type = ITEM_TYPES.has(String(b.item_type))
      ? String(b.item_type)
      : "custom";
    const parent_id =
      b.parent_id !== undefined && b.parent_id !== null
        ? Number(b.parent_id)
        : 0;
    const item_id =
      b.item_id === null || b.item_id === undefined || b.item_id === ""
        ? null
        : Number(b.item_id);
    const item_url = b.item_url != null ? String(b.item_url) : null;
    const menu_order = Number(b.menu_order) || 0;
    const depth = Number(b.depth) || 0;
    const target =
      b.target === "_blank" || b.target === "_self" ? b.target : "_self";
    const status =
      b.status === undefined || b.status === null
        ? 1
        : Number(b.status)
          ? 1
          : 0;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tbl_menu_items
        (menu_location_id, parent_id, item_type, item_id, item_title, item_url, menu_order, depth, target, status)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        menu_location_id,
        parent_id,
        item_type,
        Number.isFinite(item_id as number) ? item_id : null,
        item_title,
        item_url,
        menu_order,
        depth,
        target,
        status,
      ]
    );
    res.status(201).json({ data: { id: result.insertId } });
  } catch (e) {
    next(e);
  }
});

menuAdminRouter.post("/items/:id/move-sibling", async (req, res, next) => {
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
      `SELECT id, menu_location_id, parent_id, menu_order FROM tbl_menu_items WHERE id = ? LIMIT 1`,
      [id]
    );
    const row = rows[0] as
      | {
          menu_location_id: number;
          parent_id: number | null;
          menu_order: number;
        }
      | undefined;
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const pid = row.parent_id != null ? Number(row.parent_id) : 0;
    const [siblings] = await pool.query<RowDataPacket[]>(
      `SELECT id, menu_order FROM tbl_menu_items
       WHERE menu_location_id = ? AND IFNULL(parent_id,0) = ?
       ORDER BY menu_order ASC, id ASC`,
      [row.menu_location_id, pid]
    );
    const list = siblings as { id: number; menu_order: number }[];
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
        `UPDATE tbl_menu_items SET menu_order = ? WHERE id = ?`,
        [b.menu_order, a.id]
      );
      await conn.query(
        `UPDATE tbl_menu_items SET menu_order = ? WHERE id = ?`,
        [a.menu_order, b.id]
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

menuAdminRouter.patch("/items/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const b = req.body ?? {};
    const fields: string[] = [];
    const vals: unknown[] = [];

    if (b.item_title !== undefined) {
      fields.push("item_title = ?");
      vals.push(String(b.item_title).trim());
    }
    if (b.item_url !== undefined) {
      fields.push("item_url = ?");
      vals.push(b.item_url === null ? null : String(b.item_url));
    }
    if (b.menu_order !== undefined) {
      fields.push("menu_order = ?");
      vals.push(Number(b.menu_order) || 0);
    }
    if (b.parent_id !== undefined) {
      fields.push("parent_id = ?");
      vals.push(Number(b.parent_id) || 0);
    }
    if (b.depth !== undefined) {
      fields.push("depth = ?");
      vals.push(Number(b.depth) || 0);
    }
    if (b.item_type !== undefined) {
      const t = String(b.item_type);
      if (!ITEM_TYPES.has(t)) {
        res.status(400).json({ error: "Invalid item_type" });
        return;
      }
      fields.push("item_type = ?");
      vals.push(t);
    }
    if (b.item_id !== undefined) {
      fields.push("item_id = ?");
      if (b.item_id === null || b.item_id === "") vals.push(null);
      else vals.push(Number(b.item_id));
    }
    if (b.target !== undefined) {
      if (b.target !== "_blank" && b.target !== "_self") {
        res.status(400).json({ error: "Invalid target" });
        return;
      }
      fields.push("target = ?");
      vals.push(b.target);
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
      `UPDATE tbl_menu_items SET ${fields.join(", ")} WHERE id = ?`,
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
