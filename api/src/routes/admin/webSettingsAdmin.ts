import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../db/pool.js";

/** Whitelisted `tbl_web_settings` columns editable from admin (avoid arbitrary SQL). */
const PATCHABLE = new Set([
  "site_name",
  "site_description",
  "copyright_text",
  "web_logo_1",
  "web_logo_2",
  "web_favicon",
  "about_page_title",
  "about_content",
  "about_status",
  "faq_content",
  "faq_status",
  "privacy_page_title",
  "privacy_content",
  "privacy_page_status",
  "terms_of_use_page_title",
  "terms_of_use_content",
  "terms_of_use_page_status",
  "why_irh_title",
  "why_irh_content",
  "why_irh_status",
  "refund_return_policy_page_title",
  "refund_return_policy",
  "refund_return_policy_status",
  "cancellation_page_title",
  "cancellation_content",
  "cancellation_page_status",
  "payments_page_title",
  "payments_content",
  "payments_page_status",
  "contact_page_title",
  "address",
  "contact_number",
  "contact_email",
  "facebook_url",
  "twitter_url",
  "tripadvisor_url",
  "map_embed_url",
  "bank_details",
  "active_menu_type",
  "active_menu_id",
  "active_footer_type",
  "active_footer_id",
]);

export const webSettingsAdminRouter = Router();

webSettingsAdminRouter.get("/", async (_req, res, next) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM tbl_web_settings LIMIT 1"
    );
    res.json({ data: rows[0] ?? null });
  } catch (e) {
    next(e);
  }
});

webSettingsAdminRouter.patch("/", async (req, res, next) => {
  try {
    const b = req.body ?? {};
    const fields: string[] = [];
    const vals: unknown[] = [];
    for (const key of Object.keys(b)) {
      if (!PATCHABLE.has(key)) continue;
      fields.push(`\`${key}\` = ?`);
      vals.push(b[key]);
    }
    if (!fields.length) {
      res.status(400).json({ error: "No valid fields" });
      return;
    }
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tbl_web_settings SET ${fields.join(", ")} WHERE id = 1`,
      vals
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Web settings row missing (expected id=1)" });
      return;
    }
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
