import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { requireAdmin } from "../../middleware/adminAuth.js";
import { pool } from "../../db/pool.js";
import { adminLoginHandler } from "./auth.js";
import { uploadAdminRouter } from "./upload.js";
import { countriesAdminRouter } from "./catalog/countries.js";
import { destinationsAdminRouter } from "./catalog/destinations.js";
import { packagesAdminRouter } from "./catalog/packages.js";
import { hotelsAdminRouter } from "./catalog/hotels.js";
import { carsAdminRouter } from "./catalog/cars.js";
import { bannersAdminRouter } from "./catalog/banners.js";
import { blogsAdminRouter } from "./catalog/blogs.js";
import { reviewsAdminRouter } from "./catalog/reviews.js";
import { teamAdminRouter } from "./catalog/team.js";
import { webSettingsAdminRouter } from "./webSettingsAdmin.js";
import { supportTicketsAdminRouter } from "./supportTicketsAdmin.js";
import { bookingRequestsAdminRouter } from "./bookingRequestsAdmin.js";
import { menuAdminRouter } from "./menuAdmin.js";
import { footerAdminRouter } from "./footerAdmin.js";
import { leadsAdminRouter } from "./leadsAdmin.js";
import { adminUsersRouter } from "./adminUsersRouter.js";
import { changePasswordHandler } from "./accountAdmin.js";
import { appSettingsAdminRouter } from "./appSettingsAdmin.js";
import { smtpSettingsAdminRouter } from "./smtpSettingsAdmin.js";
import {
  convertEnquiryToLeadHandler,
  exportEnquiriesCsvHandler,
} from "./enquiryLeadHandlers.js";

export const adminRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
});

adminRouter.get("/health", (_req, res) => {
  res.json({ ok: true, scope: "admin" });
});

adminRouter.post("/auth/login", loginLimiter, adminLoginHandler);

adminRouter.use(requireAdmin);

adminRouter.post("/auth/change-password", changePasswordHandler);
adminRouter.use("/admin-users", adminUsersRouter);
adminRouter.use("/app-settings", appSettingsAdminRouter);
adminRouter.use("/smtp-settings", smtpSettingsAdminRouter);

adminRouter.use("/upload", uploadAdminRouter);
adminRouter.use("/countries", countriesAdminRouter);
adminRouter.use("/destinations", destinationsAdminRouter);
adminRouter.use("/packages", packagesAdminRouter);
adminRouter.use("/hotels", hotelsAdminRouter);
adminRouter.use("/cars", carsAdminRouter);
adminRouter.use("/banners", bannersAdminRouter);
adminRouter.use("/blogs", blogsAdminRouter);
adminRouter.use("/reviews", reviewsAdminRouter);
adminRouter.use("/team", teamAdminRouter);
adminRouter.use("/web-settings", webSettingsAdminRouter);
adminRouter.use("/support-tickets", supportTicketsAdminRouter);
adminRouter.use("/booking-requests", bookingRequestsAdminRouter);
adminRouter.use("/menu", menuAdminRouter);
adminRouter.use("/footer", footerAdminRouter);
adminRouter.use("/leads", leadsAdminRouter);

adminRouter.get("/dashboard-stats", async (_req, res, next) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         (SELECT COUNT(*) FROM tbl_country WHERE status = 1) AS countries,
         (SELECT COUNT(*) FROM tbl_destination WHERE status = 1) AS destinations,
         (SELECT COUNT(*) FROM tbl_package WHERE status = 1) AS packages,
         (SELECT COUNT(*) FROM tbl_hotel WHERE status = 1) AS hotels,
         (SELECT COUNT(*) FROM tbl_car WHERE status = 1) AS vehicles,
         (SELECT COUNT(*) FROM tbl_blog WHERE status = 1) AS blogs,
         (SELECT COUNT(*) FROM contactform) AS enquiries,
         (SELECT COUNT(*) FROM leads) AS leads`
    );
    const row = rows[0] as Record<string, number>;
    res.json({
      data: {
        countries: Number(row.countries),
        destinations: Number(row.destinations),
        packages: Number(row.packages),
        hotels: Number(row.hotels),
        vehicles: Number(row.vehicles),
        blogs: Number(row.blogs),
        enquiries: Number(row.enquiries),
        leads: Number(row.leads),
      },
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/enquiries/export.csv", exportEnquiriesCsvHandler);

adminRouter.get("/enquiries", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const status = req.query.status as string | undefined;
    const allowed = new Set(["partial", "complete", "converted", "archived"]);

    let where = "";
    const params: unknown[] = [];
    if (status && allowed.has(status)) {
      where = "WHERE status = ?";
      params.push(status);
    }

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM contactform ${where}`,
      params
    );
    const total = Number((countRows[0] as { c: number }).c);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, fullName, phone, email, destination, requirement, status, created_at
       FROM contactform ${where}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      data: rows,
      meta: { total, limit, offset },
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.post(
  "/enquiries/:id/convert-to-lead",
  convertEnquiryToLeadHandler
);

adminRouter.get("/enquiries/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, tripType, lookingFor, destination, days, budget, hotelStay, hotelType,
              flightTrain, cab, transport, fullName, phone, email, requirement,
              startingDate, returningDate, person, children, ip_address, created_at,
              status, updated_at, last_auto_save, session_id, converted_to_lead
       FROM contactform WHERE id = ? LIMIT 1`,
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

const enquiryStatuses = new Set([
  "partial",
  "complete",
  "converted",
  "archived",
]);

adminRouter.patch("/enquiries/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const status = req.body?.status as string | undefined;
    if (!Number.isFinite(id) || id < 1) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    if (!status || !enquiryStatuses.has(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE contactform SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, id]
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
