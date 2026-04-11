import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../db/pool.js";
import { toCsvRow } from "../../util/csv.js";

export const leadsAdminRouter = Router();

const STATUSES = new Set([
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "negotiation",
  "won",
  "lost",
  "on_hold",
]);

const PRIORITIES = new Set(["low", "medium", "high", "urgent"]);

const ACTIVITY_TYPES = new Set([
  "call",
  "email",
  "meeting",
  "chat",
  "note",
  "status_change",
  "proposal_sent",
  "follow_up",
]);

function buildLeadListWhere(req: {
  query: Record<string, unknown>;
}): { where: string; params: unknown[] } {
  const status = req.query.status as string | undefined;
  const priority = req.query.priority as string | undefined;
  const qRaw = req.query.q as string | undefined;
  const q = typeof qRaw === "string" ? qRaw.trim().slice(0, 120) : "";

  const conditions: string[] = [];
  const params: unknown[] = [];
  if (status && STATUSES.has(status)) {
    conditions.push("status = ?");
    params.push(status);
  }
  if (priority && PRIORITIES.has(priority)) {
    conditions.push("priority = ?");
    params.push(priority);
  }
  if (q) {
    conditions.push(
      "(full_name LIKE ? OR email LIKE ? OR phone LIKE ? OR lead_code LIKE ? OR destination LIKE ?)"
    );
    const p = `%${q}%`;
    params.push(p, p, p, p, p);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return { where, params };
}

leadsAdminRouter.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 40, 1), 150);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const { where, params } = buildLeadListWhere(req);

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM leads ${where}`,
      params
    );
    const total = Number((countRows[0] as { c: number }).c);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, lead_code, full_name, email, phone, destination, status, priority,
              source, estimated_value, assigned_to, created_at, enquiry_id
       FROM leads ${where}
       ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json({ data: rows, meta: { total, limit, offset } });
  } catch (e) {
    next(e);
  }
});

leadsAdminRouter.get("/export.csv", async (req, res, next) => {
  try {
    const { where, params } = buildLeadListWhere(req);
    const maxRows = 5000;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, lead_code, enquiry_id, full_name, email, phone, destination, trip_type,
              travel_mode, status, priority, source, assigned_to, estimated_value,
              created_at, updated_at, notes
       FROM leads ${where}
       ORDER BY id DESC
       LIMIT ?`,
      [...params, maxRows]
    );

    const header = [
      "id",
      "lead_code",
      "enquiry_id",
      "full_name",
      "email",
      "phone",
      "destination",
      "trip_type",
      "travel_mode",
      "status",
      "priority",
      "source",
      "assigned_to",
      "estimated_value",
      "created_at",
      "updated_at",
      "notes",
    ];
    let csv = toCsvRow(header);
    for (const r of rows as Record<string, unknown>[]) {
      csv += toCsvRow(header.map((h) => r[h]));
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="leads-export.csv"'
    );
    res.send("\uFEFF" + csv);
  } catch (e) {
    next(e);
  }
});

leadsAdminRouter.get("/:id/activities", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [lead] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM leads WHERE id = ? LIMIT 1",
      [id]
    );
    if (!lead[0]) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT la.*, a.username AS created_by_username
       FROM lead_activities la
       LEFT JOIN tbl_admin a ON la.created_by = a.id
       WHERE la.lead_id = ?
       ORDER BY la.activity_date DESC, la.id DESC`,
      [id]
    );
    res.json({ data: rows });
  } catch (e) {
    next(e);
  }
});

leadsAdminRouter.post("/:id/activities", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [lead] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM leads WHERE id = ? LIMIT 1",
      [id]
    );
    if (!lead[0]) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const b = req.body ?? {};
    const activity_type = String(b.activity_type ?? "note");
    if (!ACTIVITY_TYPES.has(activity_type)) {
      res.status(400).json({ error: "Invalid activity_type" });
      return;
    }
    const subject =
      b.subject != null && String(b.subject).trim()
        ? String(b.subject).trim().slice(0, 255)
        : null;
    const description =
      b.description != null && String(b.description).trim()
        ? String(b.description).trim().slice(0, 16000)
        : null;
    const statusNote =
      b.status != null && String(b.status).trim()
        ? String(b.status).trim().slice(0, 100)
        : null;
    let activity_date = new Date();
    if (b.activity_date) {
      const d = new Date(String(b.activity_date));
      if (!Number.isNaN(d.getTime())) activity_date = d;
    }
    let next_follow_up: Date | null = null;
    if (b.next_follow_up) {
      const d = new Date(String(b.next_follow_up));
      if (!Number.isNaN(d.getTime())) next_follow_up = d;
    }
    const created_by = req.admin?.id ?? null;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO lead_activities
        (lead_id, activity_type, subject, description, activity_date, next_follow_up, status, created_by, created_at)
       VALUES (?,?,?,?,?,?,?,?,NOW())`,
      [
        id,
        activity_type,
        subject,
        description,
        activity_date,
        next_follow_up,
        statusNote,
        created_by,
      ]
    );
    res.status(201).json({ data: { id: result.insertId } });
  } catch (e) {
    next(e);
  }
});

leadsAdminRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM leads WHERE id = ? LIMIT 1",
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

leadsAdminRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [prevRows] = await pool.query<RowDataPacket[]>(
      "SELECT status FROM leads WHERE id = ? LIMIT 1",
      [id]
    );
    if (!prevRows[0]) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const prevStatus = String((prevRows[0] as { status: string }).status);

    const b = req.body ?? {};
    const fields: string[] = [];
    const vals: unknown[] = [];

    if (b.status !== undefined) {
      const s = String(b.status);
      if (!STATUSES.has(s)) {
        res.status(400).json({ error: "Invalid status" });
        return;
      }
      fields.push("status = ?");
      vals.push(s);
    }
    if (b.priority !== undefined) {
      const p = String(b.priority);
      if (!PRIORITIES.has(p)) {
        res.status(400).json({ error: "Invalid priority" });
        return;
      }
      fields.push("priority = ?");
      vals.push(p);
    }
    if (b.notes !== undefined) {
      fields.push("notes = ?");
      vals.push(b.notes === null ? null : String(b.notes));
    }
    if (b.assigned_to !== undefined) {
      fields.push("assigned_to = ?");
      if (b.assigned_to === null || b.assigned_to === "") vals.push(null);
      else vals.push(Number(b.assigned_to));
    }
    if (b.estimated_value !== undefined) {
      fields.push("estimated_value = ?");
      if (b.estimated_value === null || b.estimated_value === "")
        vals.push(null);
      else vals.push(Number(b.estimated_value));
    }

    if (!fields.length) {
      res.status(400).json({ error: "No valid fields" });
      return;
    }
    fields.push("updated_at = NOW()");
    vals.push(id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE leads SET ${fields.join(", ")} WHERE id = ?`,
      vals
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    if (b.status !== undefined) {
      const newStatus = String(b.status);
      if (newStatus !== prevStatus && req.admin?.id) {
        await pool.query(
          `INSERT INTO lead_activities
            (lead_id, activity_type, subject, description, activity_date, next_follow_up, status, created_by, created_at)
           VALUES (?,?,?,?,NOW(),NULL,NULL,?,NOW())`,
          [
            id,
            "status_change",
            "Status updated",
            `Changed from "${prevStatus}" to "${newStatus}"`,
            req.admin.id,
          ]
        );
      }
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
