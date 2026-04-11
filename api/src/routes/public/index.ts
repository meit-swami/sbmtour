import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import type { RowDataPacket } from "mysql2";
import { config } from "../../config.js";
import { pingDb, pool } from "../../db/pool.js";
import { enquiriesRouter } from "./enquiries.js";
import { extraPublicRouter } from "./extraPublicRouter.js";
import { extraFormsRouter } from "./extraForms.js";

export const publicRouter = Router();

publicRouter.use("/enquiries", enquiriesRouter);
publicRouter.use(extraPublicRouter);
publicRouter.use(extraFormsRouter);

publicRouter.get("/health", async (_req: Request, res: Response) => {
  const dbOk = await pingDb();
  res.json({
    ok: true,
    db: dbOk ? "up" : "down",
    env: config.nodeEnv,
  });
});

/** Aggregate payload for the public homepage (single round-trip). */
publicRouter.get("/home", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      [banners],
      [destinationTypes],
      [packagesDomestic],
      [packagesInternational],
      [reviews],
      [blogs],
    ] = await Promise.all([
      pool.query<RowDataPacket[]>(
        `SELECT id, banner_title, banner_slug, banner_desc, media_type,
                desktop_image, mobile_image, desktop_video, mobile_video, banner_image
         FROM tbl_banner WHERE status = 1 ORDER BY id ASC LIMIT 12`
      ),
      pool.query<RowDataPacket[]>(
        `SELECT DISTINCT destination_type AS name
         FROM tbl_destination
         WHERE status = 1 AND TRIM(destination_type) <> ''
         ORDER BY destination_type`
      ),
      packageHomeListQuery("Domestic"),
      packageHomeListQuery("International"),
      pool.query<RowDataPacket[]>(
        `SELECT id, reviewer_name, reviewer_place, review_desc, review_image
         FROM tbl_review WHERE status = 1 ORDER BY id DESC LIMIT 12`
      ),
      pool.query<RowDataPacket[]>(
        `SELECT id, blog_name, blogPlace, blog_slug, blogDate, blogDesc, blog_image
         FROM tbl_blog WHERE status = 1 ORDER BY blogDate DESC LIMIT 6`
      ),
    ]);

    const types = (destinationTypes as { name: string }[]).map((r) => r.name);

    res.json({
      data: {
        banners,
        destinationTypes: types,
        packagesDomestic,
        packagesInternational,
        reviews,
        blogs,
      },
    });
  } catch (e) {
    next(e);
  }
});

function packageHomeListQuery(packType: string) {
  return pool.query<RowDataPacket[]>(
    `SELECT p.id, p.packName, p.package_slug, p.packDuration, p.packType, p.featured_image,
            p.is_featured, p.today_deal,
            p.single_discounted_price, p.dual_discounted_price, p.triple_discounted_price, p.quad_discounted_price,
            p.single_actual_price, p.dual_actual_price,
            c.country_name,
            CASE WHEN p.destination_id > 0 THEN d.destination_name ELSE NULL END AS destination_name
     FROM tbl_package p
     INNER JOIN tbl_country c ON c.id = p.country_id AND c.status = 1
     LEFT JOIN tbl_destination d ON d.id = p.destination_id AND d.status = 1
     WHERE p.status = 1 AND p.packType = ?
     ORDER BY p.is_featured DESC, p.today_deal DESC, p.id DESC
     LIMIT 8`,
    [packType]
  );
}

publicRouter.get("/destination-types", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT destination_type AS name
       FROM tbl_destination
       WHERE status = 1 AND TRIM(destination_type) <> ''
       ORDER BY destination_type`
    );
    res.json({ data: rows.map((r) => r.name) });
  } catch (e) {
    next(e);
  }
});

publicRouter.get("/destinations", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const destinationType = req.query.destination_type as string | undefined;
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 48);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    let sql = `
      SELECT d.id, d.destination_name, d.destination_slug, d.destination_type,
             d.destination_image, c.country_name, c.country_slug
      FROM tbl_destination d
      INNER JOIN tbl_country c ON c.id = d.country_id AND c.status = 1
      WHERE d.status = 1`;
    const params: unknown[] = [];
    if (destinationType) {
      sql += ` AND d.destination_type = ?`;
      params.push(destinationType);
    }
    sql += ` ORDER BY d.destination_name LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    res.json({ data: rows });
  } catch (e) {
    next(e);
  }
});

publicRouter.get("/destinations/slug/:slug", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT d.*, c.country_name, c.country_slug
       FROM tbl_destination d
       INNER JOIN tbl_country c ON c.id = d.country_id AND c.status = 1
       WHERE d.destination_slug = ? AND d.status = 1
       LIMIT 1`,
      [slug]
    );
    const dest = rows[0];
    if (!dest) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const [gallery] = await pool.query<RowDataPacket[]>(
      `SELECT image_file, type, status
       FROM tbl_destination_images
       WHERE parent_id = ? AND status = 1
       ORDER BY id ASC`,
      [dest.id]
    );

    res.json({
      data: {
        destination: dest,
        gallery,
      },
    });
  } catch (e) {
    next(e);
  }
});

publicRouter.get("/packages", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const packType = req.query.packType as string | undefined;
    const qRaw = (req.query.q as string | undefined)?.trim().slice(0, 80);
    const q = qRaw?.replace(/[%_\\]/g, "") ?? "";
    const limit = Math.min(Math.max(Number(req.query.limit) || 24, 1), 96);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    let sql = `
      SELECT p.id, p.packName, p.package_slug, p.packDuration, p.packType, p.featured_image,
             p.is_featured, p.today_deal,
             p.single_discounted_price, p.dual_discounted_price, p.triple_discounted_price, p.quad_discounted_price,
             p.single_actual_price, p.dual_actual_price,
             c.country_name,
             CASE WHEN p.destination_id > 0 THEN d.destination_name ELSE NULL END AS destination_name
      FROM tbl_package p
      INNER JOIN tbl_country c ON c.id = p.country_id AND c.status = 1
      LEFT JOIN tbl_destination d ON d.id = p.destination_id AND d.status = 1
      WHERE p.status = 1`;
    const params: unknown[] = [];
    if (packType) {
      sql += ` AND p.packType = ?`;
      params.push(packType);
    }
    if (q) {
      sql += ` AND (p.packName LIKE ? OR p.package_slug LIKE ?)`;
      const like = `%${q}%`;
      params.push(like, like);
    }
    sql += ` ORDER BY p.is_featured DESC, p.today_deal DESC, p.id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    res.json({ data: rows });
  } catch (e) {
    next(e);
  }
});

publicRouter.get("/packages/slug/:slug", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug;
    const track = req.query.track !== "0";

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.*, c.country_name, c.country_slug,
              CASE WHEN p.destination_id > 0 THEN d.destination_name ELSE NULL END AS destination_name,
              CASE WHEN p.destination_id > 0 THEN d.destination_slug ELSE NULL END AS destination_slug
       FROM tbl_package p
       INNER JOIN tbl_country c ON c.id = p.country_id
       LEFT JOIN tbl_destination d ON d.id = p.destination_id
       WHERE p.package_slug = ? AND p.status = 1 AND c.status = 1
       LIMIT 1`,
      [slug]
    );

    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const pkgId = row.id as number;

    if (track) {
      pool
        .query(`UPDATE tbl_package SET total_views = total_views + 1 WHERE id = ?`, [
          pkgId,
        ])
        .catch(() => {});
    }

    const [[itinerary], [inclusions], [exclusions], [gallery], [similar], [reviews]] =
      await Promise.all([
        pool.query<RowDataPacket[]>(
          `SELECT itineraryDay, itineraryHeading, itineraryDesc
           FROM tbl_itinerary WHERE id = ? ORDER BY itineraryDay ASC`,
          [pkgId]
        ),
        pool.query<RowDataPacket[]>(
          `SELECT inclusion FROM tbl_inclusion WHERE id = ? ORDER BY inclusionId ASC`,
          [pkgId]
        ),
        pool.query<RowDataPacket[]>(
          `SELECT exclusion FROM tbl_exclusion WHERE id = ? ORDER BY exclusionId ASC`,
          [pkgId]
        ),
        pool.query<RowDataPacket[]>(
          `SELECT image_file, type FROM tbl_package_images
           WHERE parent_id = ? AND status = 1 ORDER BY id ASC`,
          [pkgId]
        ),
        pool.query<RowDataPacket[]>(
          `SELECT p.id, p.packName, p.package_slug, p.packDuration, p.packType, p.featured_image,
                  p.single_discounted_price, p.dual_discounted_price, p.triple_discounted_price, p.quad_discounted_price,
                  p.single_actual_price, p.dual_actual_price,
                  c.country_name,
                  CASE WHEN p.destination_id > 0 THEN d.destination_name ELSE NULL END AS destination_name
           FROM tbl_package p
           INNER JOIN tbl_country c ON c.id = p.country_id AND c.status = 1
           LEFT JOIN tbl_destination d ON d.id = p.destination_id AND d.status = 1
           WHERE p.status = 1
             AND p.id <> ?
             AND (
               (p.destination_id > 0 AND p.destination_id = ?)
               OR p.country_id = ?
             )
           ORDER BY
             (p.destination_id = ?) DESC,
             p.is_featured DESC,
             p.today_deal DESC,
             p.id DESC
           LIMIT 6`,
          [pkgId, row.destination_id ?? 0, row.country_id, row.destination_id ?? 0]
        ),
        pool.query<RowDataPacket[]>(
          `SELECT r.id, r.rating, r.rating_desc, r.created_at,
                  COALESCE(NULLIF(TRIM(u.user_name), ''), CONCAT('User #', r.user_id)) AS reviewer_name
           FROM tbl_rating r
           LEFT JOIN tbl_users u ON u.id = r.user_id
           WHERE r.product_id = ?
           ORDER BY r.id DESC
           LIMIT 20`,
          [pkgId]
        ),
      ]);

    res.json({
      data: {
        package: row,
        itinerary,
        inclusions,
        exclusions,
        gallery,
        similar,
        reviews,
      },
    });
  } catch (e) {
    next(e);
  }
});

publicRouter.get("/banners", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM tbl_banner WHERE status = 1 ORDER BY id DESC LIMIT 50"
    );
    res.json({ data: rows });
  } catch (e) {
    next(e);
  }
});

publicRouter.get("/countries", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, country_name, country_slug, country_image, set_on_home, status FROM tbl_country WHERE status = 1 ORDER BY country_name"
    );
    res.json({ data: rows });
  } catch (e) {
    next(e);
  }
});

publicRouter.get("/countries/slug/:slug", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, country_name, country_slug, country_image, product_features, set_on_home, status
       FROM tbl_country WHERE country_slug = ? AND status = 1 LIMIT 1`,
      [slug]
    );
    const country = rows[0];
    if (!country) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const [destinations] = await pool.query<RowDataPacket[]>(
      `SELECT id, destination_name, destination_slug, destination_type, destination_image
       FROM tbl_destination
       WHERE country_id = ? AND status = 1
       ORDER BY destination_name
       LIMIT 48`,
      [country.id]
    );

    res.json({ data: { country, destinations } });
  } catch (e) {
    next(e);
  }
});

publicRouter.get("/blogs", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 48);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, blog_name, blogPlace, blog_slug, blogDate, blogDesc, blog_image
       FROM tbl_blog WHERE status = 1 ORDER BY blogDate DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    res.json({ data: rows });
  } catch (e) {
    next(e);
  }
});

publicRouter.get("/blogs/slug/:slug", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, blog_name, blogPlace, blog_slug, blogDate, blogDesc, blog_image, show_on_off
       FROM tbl_blog WHERE blog_slug = ? AND status = 1 LIMIT 1`,
      [slug]
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

publicRouter.get("/web-settings", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM tbl_web_settings LIMIT 1"
    );
    const row = rows[0] ?? null;
    res.json({ data: row });
  } catch (e) {
    next(e);
  }
});

publicRouter.get("/team", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, person_name, person_pose, personDesc, person_image
       FROM tbl_team WHERE status = 1 ORDER BY id ASC`
    );
    res.json({ data: rows });
  } catch (e) {
    next(e);
  }
});

publicRouter.get("/faqs", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = (req.query.type as string | undefined)?.trim();
    let sql =
      "SELECT id, faq_question, faq_answer, type FROM tbl_faq WHERE status = 1";
    const params: unknown[] = [];
    if (type) {
      sql += " AND type = ?";
      params.push(type);
    }
    sql += " ORDER BY id ASC";
    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    res.json({ data: rows });
  } catch (e) {
    next(e);
  }
});

publicRouter.get("/robots.txt", (_req: Request, res: Response) => {
  const base = (
    config.publicSiteUrl ||
    (config.nodeEnv === "production"
      ? "https://www.sbmtourindia.com"
      : "http://localhost:5173")
  ).replace(/\/+$/, "");
  res.type("text/plain").send(
    `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`
  );
});

publicRouter.get("/sitemap.xml", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const base = (
      config.publicSiteUrl ||
      (config.nodeEnv === "production"
        ? "https://www.sbmtourindia.com"
        : "http://localhost:5173")
    ).replace(/\/+$/, "");
    const [countries, destinations, packages, blogs, hotels, cars] =
      await Promise.all([
        pool.query<RowDataPacket[]>(
          "SELECT country_slug FROM tbl_country WHERE status = 1"
        ),
        pool.query<RowDataPacket[]>(
          "SELECT destination_slug FROM tbl_destination WHERE status = 1"
        ),
        pool.query<RowDataPacket[]>(
          "SELECT package_slug FROM tbl_package WHERE status = 1"
        ),
        pool.query<RowDataPacket[]>(
          "SELECT blog_slug FROM tbl_blog WHERE status = 1"
        ),
        pool.query<RowDataPacket[]>(
          "SELECT hotelSlug FROM tbl_hotel WHERE status = 1"
        ),
        pool.query<RowDataPacket[]>(
          "SELECT car_slug FROM tbl_car WHERE status = 1"
        ),
      ]);
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    const u = (path: string) => `${base}${path}`;
    const lines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ];
    const add = (loc: string) => {
      lines.push(`<url><loc>${esc(loc)}</loc></url>`);
    };
    add(u("/"));
    add(u("/countries"));
    add(u("/destinations"));
    add(u("/packages"));
    add(u("/blog"));
    add(u("/hotels"));
    add(u("/vehicles"));
    add(u("/contact"));
    add(u("/about"));
    add(u("/faq"));
    add(u("/team"));
    for (const r of countries[0]) add(u(`/countries/${r.country_slug}`));
    for (const r of destinations[0])
      add(u(`/destinations/${r.destination_slug}`));
    for (const r of packages[0]) add(u(`/packages/${r.package_slug}`));
    for (const r of blogs[0]) add(u(`/blog/${r.blog_slug}`));
    for (const r of hotels[0]) add(u(`/hotels/${r.hotelSlug}`));
    for (const r of cars[0]) add(u(`/vehicles/${r.car_slug}`));
    lines.push("</urlset>");
    res.type("application/xml").send(lines.join(""));
  } catch (e) {
    next(e);
  }
});
