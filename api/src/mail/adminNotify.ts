import type { RowDataPacket } from "mysql2";
import nodemailer from "nodemailer";
import { pool } from "../db/pool.js";

export type SmtpRow = {
  smtp_host: string;
  smtp_email: string;
  smtp_password: string;
  smtp_secure: string;
  port_no: string;
};

export async function sendMailWithSmtp(
  smtp: SmtpRow,
  to: string[],
  subject: string,
  text: string,
  html?: string
): Promise<void> {
  if (!to.length) return;
  const port = Number(smtp.port_no) || 587;
  const secureRaw = String(smtp.smtp_secure || "").toLowerCase();
  const secure = secureRaw === "ssl" || port === 465;
  const transporter = nodemailer.createTransport({
    host: smtp.smtp_host,
    port,
    secure,
    auth: {
      user: smtp.smtp_email,
      pass: smtp.smtp_password,
    },
  });
  await transporter.sendMail({
    from: smtp.smtp_email,
    to: to.join(", "),
    subject: subject.slice(0, 200),
    text,
    ...(html ? { html } : {}),
  });
}

export async function loadSmtpRow(): Promise<SmtpRow | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT smtp_host, smtp_email, smtp_password, smtp_secure, port_no FROM tbl_smtp_settings LIMIT 1"
  );
  const r = rows[0] as SmtpRow | undefined;
  if (!r?.smtp_host?.trim() || !r.smtp_email?.trim() || !r.smtp_password) {
    return null;
  }
  return r;
}

/** Distinct admin inboxes from `tbl_settings` (order + app email). */
export async function loadNotifyEmails(): Promise<string[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT app_order_email, app_email FROM tbl_settings LIMIT 1"
  );
  const r = rows[0] as
    | { app_order_email?: string; app_email?: string }
    | undefined;
  const raw = [r?.app_order_email, r?.app_email]
    .filter(Boolean)
    .join(" ");
  const parts = raw.split(/[\s,;]+/).map((s) => s.trim());
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return [...new Set(parts.filter((s) => emailRe.test(s)))];
}

export async function sendAdminMail(
  recipients: string[],
  subject: string,
  text: string,
  html?: string
): Promise<void> {
  if (!recipients.length) return;
  const smtp = await loadSmtpRow();
  if (!smtp) return;
  await sendMailWithSmtp(smtp, recipients, subject, text, html);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Simple branded HTML for admin inbox; plain `text` remains for clients without HTML. */
function notifyEmailHtml(opts: {
  heading: string;
  rows: { label: string; value: string }[];
  footer?: string;
}): string {
  const rowHtml = opts.rows
    .map(
      (r) =>
        `<tr><td style="padding:8px 12px 8px 0;border-bottom:1px solid #e2e8f0;vertical-align:top;color:#64748b;width:128px;font-size:13px;">${escapeHtml(r.label)}</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;">${escapeHtml(r.value)}</td></tr>`
    )
    .join("");
  const foot = opts.footer
    ? `<p style="margin:16px 0 0;color:#64748b;font-size:13px;line-height:1.5;">${escapeHtml(opts.footer)}</p>`
    : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:24px;background:#f1f5f9;font-family:system-ui,-apple-system,Segoe UI,sans-serif;"><div style="max-width:560px;margin:0 auto;background:#fff;border-radius:10px;border:1px solid #e2e8f0;padding:24px 28px;box-shadow:0 1px 2px rgba(15,23,42,0.06);"><h1 style="margin:0 0 18px;font-size:18px;font-weight:600;color:#0f172a;">${escapeHtml(opts.heading)}</h1><table style="width:100%;border-collapse:collapse;">${rowHtml}</table>${foot}<p style="margin:22px 0 0;color:#94a3b8;font-size:12px;">SBM Tour India — admin notification</p></div></body></html>`;
}

function clip(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

/** Fire-and-forget; logs errors. Never throws to caller. */
export function notifyAsync(p: Promise<void>): void {
  void p.catch((err: unknown) => {
    console.error("[admin-notify]", err);
  });
}

export function notifyNewEnquirySubmitted(payload: {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  destination: string;
  requirement: string;
}): void {
  notifyAsync(
    (async () => {
      const to = await loadNotifyEmails();
      const text = [
        `New enquiry #${payload.id} (contactform)`,
        "",
        `Name: ${payload.fullName}`,
        `Email: ${payload.email}`,
        `Phone: ${payload.phone}`,
        `Destination: ${payload.destination || "—"}`,
        "",
        "Requirement / notes:",
        clip(payload.requirement, 4000) || "—",
        "",
        "Open admin → Enquiries to review.",
      ].join("\n");
      const html = notifyEmailHtml({
        heading: `New enquiry #${payload.id}`,
        rows: [
          { label: "Name", value: payload.fullName },
          { label: "Email", value: payload.email },
          { label: "Phone", value: payload.phone },
          { label: "Destination", value: payload.destination || "—" },
          {
            label: "Requirement",
            value: clip(payload.requirement, 4000) || "—",
          },
        ],
        footer: "Open admin → Enquiries to review.",
      });
      await sendAdminMail(
        to,
        `[SBM] New enquiry #${payload.id} — ${clip(payload.fullName, 60)}`,
        text,
        html
      );
    })()
  );
}

export function notifySupportTicketSubmitted(payload: {
  id: number;
  user_name: string;
  user_email: string;
  user_phone: string | null;
  message: string | null;
}): void {
  notifyAsync(
    (async () => {
      const to = await loadNotifyEmails();
      const text = [
        `New support ticket #${payload.id}`,
        "",
        `Name: ${payload.user_name}`,
        `Email: ${payload.user_email}`,
        `Phone: ${payload.user_phone || "—"}`,
        "",
        "Message:",
        clip(payload.message || "", 4000) || "—",
      ].join("\n");
      const html = notifyEmailHtml({
        heading: `Support ticket #${payload.id}`,
        rows: [
          { label: "Name", value: payload.user_name },
          { label: "Email", value: payload.user_email },
          { label: "Phone", value: payload.user_phone || "—" },
          { label: "Message", value: clip(payload.message || "", 4000) || "—" },
        ],
      });
      await sendAdminMail(
        to,
        `[SBM] Support #${payload.id} — ${clip(payload.user_name, 60)}`,
        text,
        html
      );
    })()
  );
}

export function notifyBookingRequestSubmitted(payload: {
  bookingId: string;
  customer_name?: string;
  customer_email?: string;
}): void {
  notifyAsync(
    (async () => {
      const to = await loadNotifyEmails();
      const text = [
        "New booking request",
        "",
        `Ref: ${payload.bookingId}`,
        `Name: ${payload.customer_name || "—"}`,
        `Email: ${payload.customer_email || "—"}`,
      ].join("\n");
      const html = notifyEmailHtml({
        heading: "New booking request",
        rows: [
          { label: "Reference", value: payload.bookingId },
          { label: "Name", value: payload.customer_name || "—" },
          { label: "Email", value: payload.customer_email || "—" },
        ],
      });
      await sendAdminMail(
        to,
        `[SBM] Booking ${payload.bookingId}`,
        text,
        html
      );
    })()
  );
}

export function notifyLeadCreatedFromEnquiry(payload: {
  leadId: number;
  lead_code: string;
  enquiryId: number;
  full_name: string;
  email: string;
}): void {
  notifyAsync(
    (async () => {
      const to = await loadNotifyEmails();
      const text = [
        `Enquiry #${payload.enquiryId} was converted to a lead.`,
        "",
        `Lead: ${payload.lead_code} (id ${payload.leadId})`,
        `Contact: ${payload.full_name} <${payload.email}>`,
        "",
        "Open admin → Leads.",
      ].join("\n");
      const html = notifyEmailHtml({
        heading: `Lead ${payload.lead_code}`,
        rows: [
          { label: "From enquiry", value: `#${payload.enquiryId}` },
          { label: "Lead id", value: String(payload.leadId) },
          { label: "Name", value: payload.full_name },
          { label: "Email", value: payload.email },
        ],
        footer: "Open admin → Leads.",
      });
      await sendAdminMail(
        to,
        `[SBM] Lead ${payload.lead_code} from enquiry #${payload.enquiryId}`,
        text,
        html
      );
    })()
  );
}
