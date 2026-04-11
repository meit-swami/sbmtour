import { Router } from "express";
import type { ResultSetHeader } from "mysql2";
import rateLimit from "express-rate-limit";
import { notifyNewEnquirySubmitted } from "../../mail/adminNotify.js";
import { pool } from "../../db/pool.js";

export const enquiryPostLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many enquiries from this IP, try again later." },
});

const router = Router();

function clean(s: unknown, max: number): string {
  if (s === null || s === undefined) return "";
  const t = String(s).trim().replace(/\0/g, "");
  return t.length > max ? t.slice(0, max) : t;
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/** Minimal trip planner row in `contactform` (full wizard + progressive save later). */
router.post("/", enquiryPostLimiter, async (req, res, next) => {
  try {
    const fullName = clean(req.body?.fullName, 255);
    const phone = clean(req.body?.phone, 50);
    const email = clean(req.body?.email, 255);
    const requirement = clean(req.body?.requirement, 8000);
    const destination = clean(req.body?.destination, 255);

    if (!fullName || !phone || !email) {
      res.status(400).json({ error: "fullName, phone, and email are required." });
      return;
    }
    if (!isEmail(email)) {
      res.status(400).json({ error: "Invalid email address." });
      return;
    }

    const ip =
      (typeof req.headers["x-forwarded-for"] === "string"
        ? req.headers["x-forwarded-for"].split(",")[0]?.trim()
        : null) ?? req.socket.remoteAddress ?? null;

    const [ins] = await pool.query<ResultSetHeader>(
      `INSERT INTO contactform (
        tripType, lookingFor, destination, days, budget, hotelStay, hotelType, flightTrain, cab, transport,
        fullName, phone, email, requirement, startingDate, returningDate, person, children,
        ip_address, created_at, status, updated_at, last_auto_save, session_id, converted_to_lead
      ) VALUES (
        NULL, NULL, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
        ?, ?, ?, ?, NULL, NULL, NULL, NULL,
        ?, NOW(), 'complete', NULL, NULL, NULL, NULL
      )`,
      [destination || null, fullName, phone, email, requirement || null, ip]
    );

    notifyNewEnquirySubmitted({
      id: ins.insertId,
      fullName,
      email,
      phone,
      destination,
      requirement,
    });

    res.status(201).json({ ok: true, data: { id: ins.insertId } });
  } catch (e) {
    next(e);
  }
});

export const enquiriesRouter = router;
