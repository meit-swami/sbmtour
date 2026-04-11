# Rebuild progress vs `SBM_TOUR_INDIA_REBUILD_MASTER_PROMPT.md`

Approximate weights by effort/risk. Update when major slices land.

| Bucket | Weight | Done (0–100%) | Notes |
|--------|--------|----------------|-------|
| Public site (§4 pages & UX) | 28% | 90% | Mobile nav, floating WhatsApp/Facebook; optional cities/activities/counters still discretionary |
| Public read API | 14% | 90% | As before |
| Public write API (§6) | 6% | 92% | POST + SMTP notify (HTML + plain text) to `tbl_settings` inboxes |
| Admin shell & auth | 10% | 92% | + password change, admin user list for pickers |
| Admin modules (§5 CRUD) | 27% | 91% | + bulk tiered prices (`POST …/packages/bulk-prices` + list UI) |
| Infra & quality (§7–9) | 15% | 74% | + `npm run migrate`, Vite CSP (dev + preview), Helmet CSP off for JSON API |

**Formula:** `completion = Σ (weight × done%)`.

**Snapshot (approx.):** **~88% complete** · **~12% remaining** (optional Prisma layer, e2e, production nginx hardening).

**Last updated:** `api/migrations` + `npm run migrate`; Vite `Content-Security-Policy`; Helmet without CSP on API.
