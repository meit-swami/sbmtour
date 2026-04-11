import type { RequestHandler } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { notifyLeadCreatedFromEnquiry } from "../../mail/adminNotify.js";
import { pool } from "../../db/pool.js";
import { toCsvRow } from "../../util/csv.js";
import { generateLeadCode } from "../../util/leadCode.js";

export const exportEnquiriesCsvHandler: RequestHandler = async (
  _req,
  res,
  next
) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, fullName, phone, email, destination, requirement, status, created_at,
              converted_to_lead
       FROM contactform
       ORDER BY id DESC
       LIMIT 8000`
    );
    const header = [
      "id",
      "fullName",
      "phone",
      "email",
      "destination",
      "requirement",
      "status",
      "created_at",
      "converted_to_lead",
    ];
    let csv = toCsvRow(header);
    for (const r of rows as Record<string, unknown>[]) {
      csv += toCsvRow(header.map((h) => r[h]));
    }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="enquiries-export.csv"'
    );
    res.send("\uFEFF" + csv);
  } catch (e) {
    next(e);
  }
};

function parseOptInt(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = parseInt(String(v).trim(), 10);
  return Number.isFinite(n) ? n : null;
}

function parseOptFloat(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = parseFloat(String(v).trim());
  return Number.isFinite(n) ? n : null;
}

export const convertEnquiryToLeadHandler: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const enquiryId = Number(req.params.id);
    if (!Number.isFinite(enquiryId) || enquiryId < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [enqRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, fullName, phone, email, destination, requirement, tripType, lookingFor,
                days, budget, transport, cab, person, converted_to_lead, status
         FROM contactform WHERE id = ? FOR UPDATE`,
        [enquiryId]
      );
      const enq = enqRows[0] as Record<string, unknown> | undefined;
      if (!enq) {
        await conn.rollback();
        res.status(404).json({ error: "Enquiry not found" });
        return;
      }
      const existingLead = enq.converted_to_lead;
      if (
        existingLead != null &&
        existingLead !== "" &&
        Number(existingLead) > 0
      ) {
        await conn.rollback();
        res.json({
          data: { leadId: Number(existingLead), alreadyConverted: true },
        });
        return;
      }

      const lead_code = await generateLeadCode(conn);
      const full_name = String(enq.fullName ?? "").trim().slice(0, 255);
      const email = String(enq.email ?? "").trim().slice(0, 255);
      const phone = String(enq.phone ?? "").trim().slice(0, 50);
      if (!full_name || !email || !phone) {
        await conn.rollback();
        res.status(400).json({
          error: "Enquiry must have fullName, email, and phone to convert",
        });
        return;
      }

      const trip_type =
        [enq.tripType, enq.lookingFor]
          .map((x) => (x != null ? String(x).trim() : ""))
          .find(Boolean) || null;
      const travel_mode =
        [enq.transport, enq.cab]
          .map((x) => (x != null ? String(x).trim() : ""))
          .find(Boolean) || null;

      const [ins] = await conn.query<ResultSetHeader>(
        `INSERT INTO leads
          (lead_code, enquiry_id, full_name, email, phone, destination, special_requirements,
           trip_type, travel_mode, number_of_travellers, number_of_days, budget_per_person,
           source, status, priority, created_at, created_by)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?)`,
        [
          lead_code,
          enquiryId,
          full_name,
          email,
          phone,
          enq.destination != null
            ? String(enq.destination).slice(0, 255)
            : null,
          enq.requirement != null ? String(enq.requirement) : null,
          trip_type ? trip_type.slice(0, 100) : null,
          travel_mode ? travel_mode.slice(0, 100) : null,
          parseOptInt(enq.person),
          parseOptInt(enq.days),
          parseOptFloat(enq.budget),
          "Enquiry Form",
          "new",
          "medium",
          req.admin?.id ?? null,
        ]
      );
      const leadId = ins.insertId;
      await conn.query<ResultSetHeader>(
        `UPDATE contactform SET converted_to_lead = ?, status = 'converted', updated_at = NOW() WHERE id = ?`,
        [leadId, enquiryId]
      );
      await conn.commit();
      notifyLeadCreatedFromEnquiry({
        leadId,
        lead_code,
        enquiryId,
        full_name,
        email,
      });
      res.status(201).json({ data: { leadId, lead_code } });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (e) {
    next(e);
  }
};
