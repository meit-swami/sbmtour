import { Router } from "express";
import type { ResultSetHeader } from "mysql2";
import { rateLimit } from "express-rate-limit";
import {
  notifyBookingRequestSubmitted,
  notifySupportTicketSubmitted,
} from "../../mail/adminNotify.js";
import { pool } from "../../db/pool.js";

const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions. Try again later." },
});

export const extraFormsRouter = Router();

extraFormsRouter.post("/contact-support", formLimiter, async (req, res, next) => {
  try {
    const b = req.body ?? {};
    const user_name = String(b.user_name ?? "").trim();
    const user_email = String(b.user_email ?? "").trim();
    const user_phone = b.user_phone != null ? String(b.user_phone).trim() : null;
    const message = b.message != null ? String(b.message) : null;
    if (!user_name || !user_email) {
      res.status(400).json({ error: "user_name and user_email required" });
      return;
    }
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.ip ?? null;
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO contact_us_support
        (user_name, user_email, user_phone, message, status, ip_address, created_at)
       VALUES (?,?,?,?,'new',?,NOW())`,
      [user_name, user_email, user_phone, message, ip]
    );
    res.status(201).json({ data: { id: result.insertId } });
  } catch (e) {
    next(e);
  }
});

function genBookingId(): string {
  return `BK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

extraFormsRouter.post("/booking-requests", formLimiter, async (req, res, next) => {
  try {
    const b = req.body ?? {};
    const destination = String(b.destination ?? "").trim();
    const customer_email = String(b.customer_email ?? "").trim();
    const customer_phone = String(b.customer_phone ?? "").trim();
    if (!destination || !customer_email || !customer_phone) {
      res
        .status(400)
        .json({ error: "destination, customer_email, customer_phone required" });
      return;
    }
    const booking_id = genBookingId();
    const origin = String(b.origin ?? "").trim() || destination;
    const customer_name =
      b.customer_name != null ? String(b.customer_name).trim() : null;
    const departure_date = b.departure_date
      ? String(b.departure_date).slice(0, 10)
      : null;
    const departure_flexibility = ["fixed", "flexible", "anytime"].includes(
      b.departure_flexibility
    )
      ? b.departure_flexibility
      : "fixed";
    const duration_days = Math.min(
      365,
      Math.max(1, Number(b.duration_days) || 3)
    );
    const num_adults = Math.min(50, Math.max(1, Number(b.num_adults) || 2));
    const num_children = Math.min(50, Math.max(0, Number(b.num_children) || 0));
    const num_infants = Math.min(20, Math.max(0, Number(b.num_infants) || 0));
    const include_flights = b.include_flights === "no" ? "no" : "yes";
    const cab_required = b.cab_required === "yes" ? "yes" : "no";
    const whatsapp_updates = b.whatsapp_updates === "yes" ? "yes" : "no";
    const additional_requirements =
      b.additional_requirements != null
        ? String(b.additional_requirements)
        : null;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tbl_booking_requests (
        booking_id, destination, origin, departure_date, departure_flexibility,
        duration_days, num_adults, num_children, num_infants, include_flights,
        cab_required, customer_name, customer_email, customer_phone, whatsapp_updates,
        additional_requirements, status
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending')`,
      [
        booking_id,
        destination,
        origin,
        departure_date,
        departure_flexibility,
        duration_days,
        num_adults,
        num_children,
        num_infants,
        include_flights,
        cab_required,
        customer_name,
        customer_email,
        customer_phone,
        whatsapp_updates,
        additional_requirements,
      ]
    );
    notifyBookingRequestSubmitted({
      bookingId: booking_id,
      customer_name: customer_name ?? undefined,
      customer_email,
    });
    res.status(201).json({ data: { id: result.insertId, booking_id } });
  } catch (e) {
    next(e);
  }
});
