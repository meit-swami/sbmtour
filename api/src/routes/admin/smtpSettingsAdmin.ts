import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { loadSmtpRow, sendMailWithSmtp } from "../../mail/adminNotify.js";
import { pool } from "../../db/pool.js";

export const smtpSettingsAdminRouter = Router();

smtpSettingsAdminRouter.get("/", async (_req, res, next) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, smtp_host, smtp_email, smtp_secure, port_no FROM tbl_smtp_settings LIMIT 1"
    );
    const row = rows[0] as Record<string, unknown> | undefined;
    if (!row) {
      res.status(404).json({ error: "No row in tbl_smtp_settings" });
      return;
    }
    const [pw] = await pool.query<RowDataPacket[]>(
      "SELECT CHAR_LENGTH(smtp_password) AS len FROM tbl_smtp_settings LIMIT 1"
    );
    const len = Number((pw[0] as { len?: number } | undefined)?.len ?? 0);
    res.json({
      data: {
        ...row,
        smtp_password_set: len > 0,
      },
    });
  } catch (e) {
    next(e);
  }
});

smtpSettingsAdminRouter.patch("/", async (req, res, next) => {
  try {
    const b = req.body ?? {};
    const fields: string[] = [];
    const vals: unknown[] = [];
    if (b.smtp_host !== undefined) {
      fields.push("smtp_host = ?");
      vals.push(String(b.smtp_host).trim().slice(0, 150));
    }
    if (b.smtp_email !== undefined) {
      fields.push("smtp_email = ?");
      vals.push(String(b.smtp_email).trim().slice(0, 150));
    }
    if (b.smtp_secure !== undefined) {
      fields.push("smtp_secure = ?");
      vals.push(String(b.smtp_secure).trim().slice(0, 20));
    }
    if (b.port_no !== undefined) {
      fields.push("port_no = ?");
      vals.push(String(b.port_no).trim().slice(0, 10));
    }
    if (b.smtp_password !== undefined) {
      const s = String(b.smtp_password);
      if (s.trim()) {
        fields.push("smtp_password = ?");
        vals.push(s);
      }
    }
    if (!fields.length) {
      res.status(400).json({ error: "No valid fields" });
      return;
    }
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tbl_smtp_settings SET ${fields.join(", ")} WHERE id = 1`
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

smtpSettingsAdminRouter.post("/test", async (req, res, next) => {
  try {
    const to = String(req.body?.to ?? "").trim();
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      res.status(400).json({ error: "Valid `to` email required" });
      return;
    }
    const row = await loadSmtpRow();
    if (!row) {
      res.status(400).json({ error: "Configure SMTP host, email, and password first" });
      return;
    }
    await sendMailWithSmtp(row, [to], "SBM CMS — SMTP test", "This is a test message from the SBM Tour India admin API.");
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
