import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../../db/pool.js";
import { slugify } from "../../../util/slugify.js";
import { nextUniqueSlug } from "../helpers/uniqueSlug.js";

export const hotelsAdminRouter = Router();

hotelsAdminRouter.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 80, 1), 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const q = (req.query.q as string | undefined)?.trim();
    let where = "";
    const params: unknown[] = [];
    if (q) {
      where = "WHERE hotelName LIKE ? OR hotelSlug LIKE ?";
      params.push(`%${q}%`, `%${q}%`);
    }
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM tbl_hotel ${where}`,
      params
    );
    const total = Number((countRows[0] as { c: number }).c);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM tbl_hotel ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json({ data: rows, meta: { total, limit, offset } });
  } catch (e) {
    next(e);
  }
});

hotelsAdminRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM tbl_hotel WHERE id = ? LIMIT 1",
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

hotelsAdminRouter.post("/", async (req, res, next) => {
  try {
    const b = req.body ?? {};
    const hotelName = String(b.hotelName ?? "").trim();
    if (!hotelName) {
      res.status(400).json({ error: "hotelName required" });
      return;
    }
    const base = slugify(String(b.hotelSlug ?? "").trim() || hotelName);
    const hotelSlug = await nextUniqueSlug(
      "SELECT id FROM tbl_hotel WHERE hotelSlug = ? LIMIT 1",
      base
    );
    const hotelAbout = String(b.hotelAbout ?? "");
    const emailId = String(b.emailId ?? "");
    const featured_image = String(b.featured_image ?? "");
    const personName = String(b.personName ?? "");
    const phoneNo = String(b.phoneNo ?? "");
    const hotelCatStar = String(b.hotelCatStar ?? "");
    const hotelState = String(b.hotelState ?? "");
    const hotelAddr = String(b.hotelAddr ?? "");
    const hotelCountry = String(b.hotelCountry ?? "");
    const hotelCityName = String(b.hotelCityName ?? "");
    const hotelCatName = String(b.hotelCatName ?? "");
    const set_on_home = Number(b.set_on_home) === 1 ? 1 : 0;
    const status = Number(b.status) === 0 ? 0 : 1;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tbl_hotel (
        hotelName, hotelSlug, hotelAbout, emailId, featured_image, personName, phoneNo,
        hotelCatStar, hotelState, hotelAddr, hotelCountry, hotelCityName, hotelCatName,
        created_date, set_on_home, status, updated_date
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,CURDATE(),?,?,CURDATE())`,
      [
        hotelName,
        hotelSlug,
        hotelAbout,
        emailId,
        featured_image,
        personName,
        phoneNo,
        hotelCatStar,
        hotelState,
        hotelAddr,
        hotelCountry,
        hotelCityName,
        hotelCatName,
        set_on_home,
        status,
      ]
    );
    res.status(201).json({ data: { id: result.insertId } });
  } catch (e) {
    next(e);
  }
});

hotelsAdminRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const b = req.body ?? {};
    const map: Record<string, unknown> = {
      hotelName: b.hotelName,
      hotelSlug: b.hotelSlug,
      hotelAbout: b.hotelAbout,
      emailId: b.emailId,
      featured_image: b.featured_image,
      personName: b.personName,
      phoneNo: b.phoneNo,
      hotelCatStar: b.hotelCatStar,
      hotelState: b.hotelState,
      hotelAddr: b.hotelAddr,
      hotelCountry: b.hotelCountry,
      hotelCityName: b.hotelCityName,
      hotelCatName: b.hotelCatName,
      set_on_home: b.set_on_home,
      status: b.status,
    };
    const fields: string[] = [];
    const vals: unknown[] = [];
    for (const [col, raw] of Object.entries(map)) {
      if (raw === undefined) continue;
      if (col === "hotelSlug") {
        let slug = slugify(String(raw).trim());
        let n = 0;
        while (true) {
          const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT id FROM tbl_hotel WHERE hotelSlug = ? AND id <> ? LIMIT 1",
            [slug, id]
          );
          if (!rows.length) break;
          n += 1;
          slug = `${slugify(String(raw).trim())}-${n}`;
        }
        fields.push("hotelSlug = ?");
        vals.push(slug);
        continue;
      }
      if (col === "set_on_home" || col === "status") {
        fields.push(`${col} = ?`);
        vals.push(Number(raw) === 1 || raw === true ? 1 : 0);
        continue;
      }
      fields.push(`${col} = ?`);
      vals.push(String(raw ?? ""));
    }
    if (!fields.length) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }
    fields.push("updated_date = CURDATE()");
    vals.push(id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tbl_hotel SET ${fields.join(", ")} WHERE id = ?`,
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
