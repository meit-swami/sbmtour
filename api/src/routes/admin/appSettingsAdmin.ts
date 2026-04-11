import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../db/pool.js";

/** Legacy `tbl_settings` (app meta, social, payment flags — not `tbl_web_settings`). */
export const appSettingsAdminRouter = Router();

const PATCHABLE = new Set([
  "app_order_email",
  "app_name",
  "app_email",
  "app_author",
  "app_contact",
  "app_website",
  "app_description",
  "app_developed_by",
  "facebook_url",
  "twitter_url",
  "youtube_url",
  "instagram_url",
  "app_currency_code",
  "active_theme",
  "cod_status",
  "paypal_status",
  "paypal_mode",
  "stripe_status",
]);

appSettingsAdminRouter.get("/", async (_req, res, next) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM tbl_settings LIMIT 1"
    );
    const row = rows[0] as Record<string, unknown> | undefined;
    if (!row) {
      res.status(404).json({ error: "No row in tbl_settings" });
      return;
    }
    const safe = { ...row };
    if (typeof safe.paypal_secret_key === "string" && safe.paypal_secret_key)
      safe.paypal_secret_key = "********";
    if (typeof safe.stripe_secret === "string" && safe.stripe_secret)
      safe.stripe_secret = "********";
    res.json({ data: safe });
  } catch (e) {
    next(e);
  }
});

appSettingsAdminRouter.patch("/", async (req, res, next) => {
  try {
    const b = req.body ?? {};
    const fields: string[] = [];
    const vals: unknown[] = [];
    for (const key of PATCHABLE) {
      if (b[key] !== undefined) {
        fields.push(`${key} = ?`);
        vals.push(String(b[key]));
      }
    }
    if (b.paypal_client_id !== undefined) {
      fields.push("paypal_client_id = ?");
      vals.push(String(b.paypal_client_id));
    }
    if (b.paypal_secret_key !== undefined) {
      const s = String(b.paypal_secret_key).trim();
      if (s && s !== "********") {
        fields.push("paypal_secret_key = ?");
        vals.push(s);
      }
    }
    if (b.stripe_key !== undefined) {
      fields.push("stripe_key = ?");
      vals.push(String(b.stripe_key));
    }
    if (b.stripe_secret !== undefined) {
      const s = String(b.stripe_secret).trim();
      if (s && s !== "********") {
        fields.push("stripe_secret = ?");
        vals.push(s);
      }
    }
    if (!fields.length) {
      res.status(400).json({ error: "No valid fields" });
      return;
    }
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tbl_settings SET ${fields.join(", ")} WHERE id = 1`
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
