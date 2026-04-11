import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../../db/pool.js";
import { slugify } from "../../../util/slugify.js";
import { nextUniqueSlug } from "../helpers/uniqueSlug.js";

export const packagesAdminRouter = Router();

const PATCHABLE = new Set([
  "country_id",
  "destination_id",
  "packType",
  "sub_category",
  "packName",
  "packDuration",
  "typeOfTrip",
  "single_actual_price",
  "single_discounted_price",
  "dual_actual_price",
  "dual_discounted_price",
  "triple_actual_price",
  "triple_discounted_price",
  "quad_actual_price",
  "quad_discounted_price",
  "startCity",
  "endCity",
  "packDesc",
  "metaTagDesc",
  "keyword",
  "title",
  "package_title",
  "package_slug",
  "package_desc",
  "featured_image",
  "is_featured",
  "set_on_home",
  "today_deal",
  "today_deal_date",
  "status",
]);

async function loadPackageBundle(pkgId: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT p.*, c.country_name, c.country_slug,
            CASE WHEN p.destination_id > 0 THEN d.destination_name ELSE NULL END AS destination_name,
            CASE WHEN p.destination_id > 0 THEN d.destination_slug ELSE NULL END AS destination_slug
     FROM tbl_package p
     LEFT JOIN tbl_country c ON c.id = p.country_id
     LEFT JOIN tbl_destination d ON d.id = p.destination_id
     WHERE p.id = ? LIMIT 1`,
    [pkgId]
  );
  const row = rows[0];
  if (!row) return null;
  const [[itinerary], [inclusions], [exclusions], [gallery]] =
    await Promise.all([
      pool.query<RowDataPacket[]>(
        `SELECT itineraryId, itineraryDay, itineraryHeading, itineraryDesc
         FROM tbl_itinerary WHERE id = ? ORDER BY itineraryDay ASC`,
        [pkgId]
      ),
      pool.query<RowDataPacket[]>(
        `SELECT inclusionId, inclusion FROM tbl_inclusion WHERE id = ? ORDER BY inclusionId ASC`,
        [pkgId]
      ),
      pool.query<RowDataPacket[]>(
        `SELECT exclusionId, exclusion FROM tbl_exclusion WHERE id = ? ORDER BY exclusionId ASC`,
        [pkgId]
      ),
      pool.query<RowDataPacket[]>(
        `SELECT id, image_file, type FROM tbl_package_images
         WHERE parent_id = ? AND status = 1 ORDER BY id ASC`,
        [pkgId]
      ),
    ]);
  return {
    package: row,
    itinerary,
    inclusions,
    exclusions,
    gallery,
  };
}

packagesAdminRouter.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 150);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const packType = (req.query.packType as string | undefined)?.trim();
    const status = req.query.status as string | undefined;
    const q = (req.query.q as string | undefined)?.trim().slice(0, 120);
    const countryIdRaw = req.query.country_id as string | undefined;
    const destIdRaw = req.query.destination_id as string | undefined;
    const featured = req.query.featured as string | undefined;
    const onHome = req.query.on_home as string | undefined;
    const todayDeal = req.query.today_deal as string | undefined;
    const parts: string[] = [];
    const params: unknown[] = [];
    if (packType) {
      parts.push("p.packType = ?");
      params.push(packType);
    }
    if (status === "0" || status === "1") {
      parts.push("p.status = ?");
      params.push(Number(status));
    }
    if (countryIdRaw !== undefined && countryIdRaw !== "") {
      const cid = Number(countryIdRaw);
      if (Number.isFinite(cid) && cid >= 1) {
        parts.push("p.country_id = ?");
        params.push(cid);
      }
    }
    if (destIdRaw !== undefined && destIdRaw !== "") {
      const did = Number(destIdRaw);
      if (Number.isFinite(did) && did >= 0) {
        parts.push("p.destination_id = ?");
        params.push(did);
      }
    }
    if (featured === "1") {
      parts.push("p.is_featured = 1");
    }
    if (onHome === "1") {
      parts.push("p.set_on_home = 1");
    }
    if (todayDeal === "1") {
      parts.push("p.today_deal = 1");
    }
    if (q) {
      parts.push("(p.packName LIKE ? OR p.package_slug LIKE ?)");
      params.push(`%${q}%`, `%${q}%`);
    }
    const where = parts.length ? `WHERE ${parts.join(" AND ")}` : "";
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM tbl_package p ${where}`,
      params
    );
    const total = Number((countRows[0] as { c: number }).c);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.id, p.packName, p.package_slug, p.packType, p.status, p.is_featured,
              p.set_on_home, p.today_deal, p.featured_image, p.country_id, p.destination_id, c.country_name,
              CASE WHEN p.destination_id > 0 THEN d.destination_name ELSE NULL END AS destination_name
       FROM tbl_package p
       LEFT JOIN tbl_country c ON c.id = p.country_id
       LEFT JOIN tbl_destination d ON d.id = p.destination_id AND p.destination_id > 0
       ${where}
       ORDER BY p.id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json({ data: rows, meta: { total, limit, offset } });
  } catch (e) {
    next(e);
  }
});

packagesAdminRouter.post("/bulk-status", async (req, res, next) => {
  try {
    const b = req.body ?? {};
    const idsRaw = b.ids;
    const st = b.status;
    if (!Array.isArray(idsRaw) || idsRaw.length === 0) {
      res.status(400).json({ error: "ids array required" });
      return;
    }
    if (st !== 0 && st !== 1 && st !== "0" && st !== "1") {
      res.status(400).json({ error: "status must be 0 or 1" });
      return;
    }
    const statusVal = Number(st) === 1 ? 1 : 0;
    const seen = new Set<number>();
    for (const x of idsRaw) {
      const n = Number(x);
      if (Number.isFinite(n) && n >= 1) seen.add(n);
      if (seen.size >= 120) break;
    }
    const ids = [...seen];
    if (!ids.length) {
      res.status(400).json({ error: "No valid ids" });
      return;
    }
    const placeholders = ids.map(() => "?").join(", ");
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tbl_package SET status = ? WHERE id IN (${placeholders})`,
      [statusVal, ...ids]
    );
    res.json({ ok: true, updated: result.affectedRows });
  } catch (e) {
    next(e);
  }
});

packagesAdminRouter.post("/bulk-featured", async (req, res, next) => {
  try {
    const b = req.body ?? {};
    const idsRaw = b.ids;
    const feat = b.is_featured;
    if (!Array.isArray(idsRaw) || idsRaw.length === 0) {
      res.status(400).json({ error: "ids array required" });
      return;
    }
    if (feat !== 0 && feat !== 1 && feat !== "0" && feat !== "1") {
      res.status(400).json({ error: "is_featured must be 0 or 1" });
      return;
    }
    const featuredVal = Number(feat) === 1 ? 1 : 0;
    const seen = new Set<number>();
    for (const x of idsRaw) {
      const n = Number(x);
      if (Number.isFinite(n) && n >= 1) seen.add(n);
      if (seen.size >= 120) break;
    }
    const ids = [...seen];
    if (!ids.length) {
      res.status(400).json({ error: "No valid ids" });
      return;
    }
    const placeholders = ids.map(() => "?").join(", ");
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tbl_package SET is_featured = ? WHERE id IN (${placeholders})`,
      [featuredVal, ...ids]
    );
    res.json({ ok: true, updated: result.affectedRows });
  } catch (e) {
    next(e);
  }
});

function bulkBoolRoute(
  field: "set_on_home" | "today_deal",
  bodyKey: string
): (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void {
  return async (req, res, next) => {
    try {
      const b = req.body ?? {};
      const idsRaw = b.ids;
      const val = b[bodyKey];
      if (!Array.isArray(idsRaw) || idsRaw.length === 0) {
        res.status(400).json({ error: "ids array required" });
        return;
      }
      if (val !== 0 && val !== 1 && val !== "0" && val !== "1") {
        res.status(400).json({ error: `${bodyKey} must be 0 or 1` });
        return;
      }
      const numVal = Number(val) === 1 ? 1 : 0;
      const seen = new Set<number>();
      for (const x of idsRaw) {
        const n = Number(x);
        if (Number.isFinite(n) && n >= 1) seen.add(n);
        if (seen.size >= 120) break;
      }
      const ids = [...seen];
      if (!ids.length) {
        res.status(400).json({ error: "No valid ids" });
        return;
      }
      const placeholders = ids.map(() => "?").join(", ");
      const [result] = await pool.query<ResultSetHeader>(
        `UPDATE tbl_package SET ${field} = ? WHERE id IN (${placeholders})`,
        [numVal, ...ids]
      );
      res.json({ ok: true, updated: result.affectedRows });
    } catch (e) {
      next(e);
    }
  };
}

packagesAdminRouter.post(
  "/bulk-set-on-home",
  bulkBoolRoute("set_on_home", "set_on_home")
);
packagesAdminRouter.post(
  "/bulk-today-deal",
  bulkBoolRoute("today_deal", "today_deal")
);

const BULK_PRICE_KEYS = [
  "single_actual_price",
  "single_discounted_price",
  "dual_actual_price",
  "dual_discounted_price",
  "triple_actual_price",
  "triple_discounted_price",
  "quad_actual_price",
  "quad_discounted_price",
] as const;

packagesAdminRouter.post("/bulk-prices", async (req, res, next) => {
  try {
    const b = req.body ?? {};
    const idsRaw = b.ids;
    if (!Array.isArray(idsRaw) || idsRaw.length === 0) {
      res.status(400).json({ error: "ids array required" });
      return;
    }
    const seen = new Set<number>();
    for (const x of idsRaw) {
      const n = Number(x);
      if (Number.isFinite(n) && n >= 1) seen.add(n);
      if (seen.size >= 120) break;
    }
    const ids = [...seen];
    if (!ids.length) {
      res.status(400).json({ error: "No valid ids" });
      return;
    }

    const parsePrice = (v: unknown): number | null | "bad" => {
      if (v === null || v === undefined || v === "") return null;
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0) return "bad";
      return n;
    };

    const fields: string[] = [];
    const vals: unknown[] = [];
    for (const key of BULK_PRICE_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) continue;
      const v = parsePrice(b[key]);
      if (v === "bad") {
        res.status(400).json({ error: `Invalid ${key}` });
        return;
      }
      fields.push(`\`${key}\` = ?`);
      vals.push(v);
    }

    if (!fields.length) {
      res
        .status(400)
        .json({ error: "Provide at least one price field to update" });
      return;
    }

    const placeholders = ids.map(() => "?").join(", ");
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tbl_package SET ${fields.join(", ")} WHERE id IN (${placeholders})`,
      [...vals, ...ids]
    );
    res.json({ ok: true, updated: result.affectedRows });
  } catch (e) {
    next(e);
  }
});

packagesAdminRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const bundle = await loadPackageBundle(id);
    if (!bundle) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ data: bundle });
  } catch (e) {
    next(e);
  }
});

packagesAdminRouter.post("/", async (req, res, next) => {
  try {
    const b = req.body ?? {};
    const country_id = Number(b.country_id);
    if (!Number.isFinite(country_id) || country_id < 1) {
      res.status(400).json({ error: "country_id required" });
      return;
    }
    const packName = String(b.packName ?? "").trim();
    if (!packName) {
      res.status(400).json({ error: "packName required" });
      return;
    }
    const destination_id = Number(b.destination_id);
    const destId =
      Number.isFinite(destination_id) && destination_id >= 0
        ? destination_id
        : 0;
    const packType = String(b.packType ?? "Domestic").trim() || "Domestic";
    const sub_category =
      b.sub_category === null || b.sub_category === undefined
        ? null
        : String(b.sub_category);
    const packDuration = String(b.packDuration ?? "3 Days 2 Nights").trim();
    const typeOfTrip = String(b.typeOfTrip ?? "Road").trim();
    const startCity = String(b.startCity ?? "").trim();
    const endCity = String(b.endCity ?? "").trim();
    const packDesc = String(b.packDesc ?? "").slice(0, 3000);
    const metaTagDesc = String(b.metaTagDesc ?? "").slice(0, 2000);
    const keyword = String(b.keyword ?? "").slice(0, 150);
    const title = String(b.title ?? packName).slice(0, 50);
    const package_title = String(b.package_title ?? packName).slice(0, 50);
    const baseSlug = slugify(
      String(b.package_slug ?? "").trim() || packName
    ).slice(0, 70);
    const package_slug = (
      await nextUniqueSlug(
        "SELECT id FROM tbl_package WHERE package_slug = ? LIMIT 1",
        baseSlug
      )
    ).slice(0, 70);
    const package_desc = String(b.package_desc ?? "").slice(0, 3000);
    const featured_image = String(b.featured_image ?? "").slice(0, 150);
    const today_deal_date = String(b.today_deal_date ?? "");
    const created_at = String(b.created_at ?? Math.floor(Date.now() / 1000));

    const num = (v: unknown) =>
      v === null || v === undefined || v === "" ? null : Number(v);

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tbl_package (
        country_id, destination_id, packType, sub_category, packName, packDuration, typeOfTrip,
        single_actual_price, single_discounted_price, dual_actual_price, dual_discounted_price,
        triple_actual_price, triple_discounted_price, quad_actual_price, quad_discounted_price,
        startCity, endCity, packDesc, metaTagDesc, keyword, title, package_title, package_slug, package_desc,
        featured_image, total_views, total_rate, rate_avg, is_featured, set_on_home, today_deal,
        today_deal_date, created_at, status
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,0,0,?,?,?,?,?,?)`,
      [
        country_id,
        destId,
        packType,
        sub_category,
        packName,
        packDuration,
        typeOfTrip,
        num(b.single_actual_price),
        num(b.single_discounted_price),
        num(b.dual_actual_price),
        num(b.dual_discounted_price),
        num(b.triple_actual_price),
        num(b.triple_discounted_price),
        num(b.quad_actual_price),
        num(b.quad_discounted_price),
        startCity,
        endCity,
        packDesc,
        metaTagDesc,
        keyword,
        title,
        package_title,
        package_slug,
        package_desc,
        featured_image,
        Number(b.is_featured) === 1 ? 1 : 0,
        Number(b.set_on_home) === 1 ? 1 : 0,
        Number(b.today_deal) === 1 ? 1 : 0,
        today_deal_date,
        created_at,
        Number(b.status) === 0 ? 0 : 1,
      ]
    );
    res.status(201).json({ data: { id: result.insertId } });
  } catch (e) {
    next(e);
  }
});

packagesAdminRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const b = req.body ?? {};
    const fields: string[] = [];
    const vals: unknown[] = [];

    for (const key of Object.keys(b)) {
      if (!PATCHABLE.has(key)) continue;
      let v: unknown = b[key];
      if (
        key === "package_slug" &&
        typeof v === "string" &&
        v.trim()
      ) {
        let slug = slugify(v.trim()).slice(0, 70);
        let n = 0;
        while (true) {
          const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT id FROM tbl_package WHERE package_slug = ? AND id <> ? LIMIT 1",
            [slug, id]
          );
          if (!rows.length) break;
          n += 1;
          slug = `${slugify(v.trim()).slice(0, 60)}-${n}`;
        }
        v = slug;
      }
      if (
        key.includes("price") &&
        (v === "" || v === undefined || v === null)
      ) {
        v = null;
      }
      if (
        key === "destination_id" ||
        key === "country_id" ||
        key === "is_featured" ||
        key === "set_on_home" ||
        key === "today_deal" ||
        key === "status"
      ) {
        v = Number(v);
      }
      fields.push(`\`${key}\` = ?`);
      vals.push(v);
    }

    if (!fields.length) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }
    vals.push(id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tbl_package SET ${fields.join(", ")} WHERE id = ?`,
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

packagesAdminRouter.put("/:id/itinerary", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const rows = req.body?.rows;
    if (!Array.isArray(rows)) {
      res.status(400).json({ error: "body.rows must be an array" });
      return;
    }
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(`DELETE FROM tbl_itinerary WHERE id = ?`, [id]);
      for (const r of rows) {
        const day = Number(r.itineraryDay);
        const heading = String(r.itineraryHeading ?? "");
        const desc = String(r.itineraryDesc ?? "");
        if (!Number.isFinite(day)) continue;
        await conn.query(
          `INSERT INTO tbl_itinerary (id, itineraryHeading, itineraryDesc, itineraryDay) VALUES (?,?,?,?)`,
          [id, heading, desc, day]
        );
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
    const bundle = await loadPackageBundle(id);
    res.json({ data: bundle });
  } catch (e) {
    next(e);
  }
});

packagesAdminRouter.put("/:id/inclusions", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const lines = req.body?.lines;
    if (!Array.isArray(lines)) {
      res.status(400).json({ error: "body.lines must be an array of strings" });
      return;
    }
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(`DELETE FROM tbl_inclusion WHERE id = ?`, [id]);
      for (const line of lines) {
        const text = String(line ?? "").trim();
        if (!text) continue;
        await conn.query(`INSERT INTO tbl_inclusion (id, inclusion) VALUES (?,?)`, [
          id,
          text,
        ]);
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
    const bundle = await loadPackageBundle(id);
    res.json({ data: bundle });
  } catch (e) {
    next(e);
  }
});

packagesAdminRouter.put("/:id/exclusions", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const lines = req.body?.lines;
    if (!Array.isArray(lines)) {
      res.status(400).json({ error: "body.lines must be an array of strings" });
      return;
    }
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(`DELETE FROM tbl_exclusion WHERE id = ?`, [id]);
      for (const line of lines) {
        const text = String(line ?? "").trim();
        if (!text) continue;
        await conn.query(`INSERT INTO tbl_exclusion (id, exclusion) VALUES (?,?)`, [
          id,
          text,
        ]);
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
    const bundle = await loadPackageBundle(id);
    res.json({ data: bundle });
  } catch (e) {
    next(e);
  }
});

packagesAdminRouter.put("/:id/gallery", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const files = req.body?.files;
    if (!Array.isArray(files)) {
      res.status(400).json({ error: "body.files must be an array of filenames" });
      return;
    }
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        `UPDATE tbl_package_images SET status = 0 WHERE parent_id = ?`,
        [id]
      );
      for (const f of files) {
        const image_file = String(f ?? "").trim();
        if (!image_file) continue;
        await conn.query(
          `INSERT INTO tbl_package_images (parent_id, image_file, type, status) VALUES (?,?,?,1)`,
          [id, image_file, "package"]
        );
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
    const bundle = await loadPackageBundle(id);
    res.json({ data: bundle });
  } catch (e) {
    next(e);
  }
});
