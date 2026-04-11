# SBM Tour India — new stack

Monorepo aligned with [`SBM_TOUR_INDIA_REBUILD_MASTER_PROMPT.md`](../SBM_TOUR_INDIA_REBUILD_MASTER_PROMPT.md).

| Package | Stack |
|--------|--------|
| `web/` | React 19 + Vite 6 + TypeScript + Tailwind 3 + React Router 7 |
| `api/` | Express + TypeScript + `mysql2` (legacy schema compatible) |

## Prerequisites

- Node.js 20+
- MySQL 8+ (import `../u334425891_sbm.sql`, then optional `npm run migrate` for `api/migrations/*.sql`)

## Setup

```bash
cd "JS New Website"
npm install
cp api/.env.example api/.env
# Edit api/.env — DB_*, JWT_SECRET, optional PUBLIC_SITE_URL for sitemap URLs
```

## Develop

```bash
npm run dev
```

- Public site: http://localhost:5173  
- API: http://localhost:4000  
- Admin: http://localhost:5173/admin  

Vite proxies `/api`, `/legacy-media`, `/sitemap.xml`, `/robots.txt` → the API in dev.

The API serves `../assets/images` at `/legacy-media/*` when that folder exists. **Admin uploads** go there (same as legacy filenames) or fall back to `api/uploads/*` served at `/api/uploads/*`.

## Recent UI enhancements

- **Package detail redesign:** hero strip, tabbed long content (`DETAILS/ITINERARY/INCLUSIONS/EXCLUSIONS/PHOTOS/REVIEWS`), sticky right-side enquiry card, and polished cards for similar packages.
- **Package social proof:** package-specific reviews are exposed on `GET /api/packages/slug/:slug` via `tbl_rating` (+ `tbl_users` names) and rendered in the package Reviews tab.
- **Related content:** `GET /api/packages/slug/:slug` also includes `similar` packages (same destination/country preference) shown directly below each package detail.
- **Footer theme refresh (dynamic):** dark premium layout with dynamic widgets + embeds from `GET /api/footer`; quick links are populated from live `GET /api/menu` data (fallback if unavailable).
- **Mobile navigation UX:** right drawer now supports accordion-style collapsible/expandable sections for parent menu items.

## Database migrations

Ordered SQL files live in [`api/migrations/`](./api/migrations/). After configuring `api/.env`:

```bash
npm run migrate
```

Applies pending files in a transaction and records them in `schema_migrations`. See [`api/migrations/README.md`](./api/migrations/README.md).

## Content-Security-Policy (SPA)

`web/vite.config.ts` sets a **`Content-Security-Policy`** on the **Vite dev server** and on **`vite preview`** (stricter `script-src` in preview; dev allows `unsafe-inline` / `unsafe-eval` for HMR). Map embeds allow Google `frame-src`. For production, mirror the preview header in nginx or your static host, or serve the built `web/dist` behind the same tooling.

The API uses **Helmet** without CSP so JSON responses do not compete with the SPA policy.

## Public API (read)

- `GET /api/home` — homepage bundle  
- `GET /api/web-settings` — `tbl_web_settings`  
- `GET /api/packages`, `GET /api/packages/slug/:slug` — detail includes itinerary / inclusions / exclusions / gallery  
- `GET /api/destinations`, `GET /api/destinations/slug/:slug`  
- `GET /api/countries`, `GET /api/countries/slug/:slug`  
- `GET /api/blogs`, `GET /api/blogs/slug/:slug`  
- `GET /api/menu`, `GET /api/footer`  
- `GET /api/hotels`, `GET /api/hotels/slug/:slug`  
- `GET /api/cars`, `GET /api/cars/slug/:slug`  
- `GET /api/team` — `tbl_team`  
- `GET /api/faqs?type=faq` — `tbl_faq`  
- `GET /api/sitemap.xml`, `GET /api/robots.txt` — SEO (also `http://localhost:4000/sitemap.xml` → redirect)  

## Public API (write)

- `POST /api/enquiries` → `contactform` (response includes `data.id` when created)  
- `POST /api/contact-support` → `contact_us_support`  
- `POST /api/booking-requests` → `tbl_booking_requests`  

When **SMTP is configured** (`tbl_smtp_settings`) and **`tbl_settings.app_order_email` / `app_email`** contain addresses, the API **best-effort emails** those inboxes for: new enquiry, support ticket, booking request, and (from admin) enquiry→lead conversion. Messages include **HTML + plain-text** bodies. Failures are logged only; the HTTP request still succeeds.

## Admin API (JWT Bearer)

- `POST /api/admin/auth/login` — MD5 legacy passwords upgraded to bcrypt  
- `POST /api/admin/upload?scope=…` — multipart `file`; scopes: `country`, `destination`, `packages`, `blogs`, `banner`, `review`, `hotel`, `car`, `team`  
- **Catalog:** `GET/POST/PATCH /api/admin/countries`, `…/destinations`, `…/packages` (list rows include `destination_name` when linked; list filters: `packType`, `status`, `q`, `country_id`, `destination_id`, `featured=1`, `on_home=1`, `today_deal=1`; `POST …/packages/bulk-status` `{ ids, status: 0|1 }`; `POST …/packages/bulk-featured` `{ ids, is_featured: 0|1 }`; `POST …/packages/bulk-set-on-home` `{ ids, set_on_home: 0|1 }`; `POST …/packages/bulk-today-deal` `{ ids, today_deal: 0|1 }`; `POST …/packages/bulk-prices` `{ ids, single_discounted_price?, … }` — any subset of the eight `*_actual_price` / `*_discounted_price` fields (omit a key to leave it unchanged; `null` clears)), `PUT …/packages/:id/itinerary|inclusions|exclusions|gallery`, `…/hotels`, `…/cars`, `…/blogs`, `…/banners`, `…/reviews`, `…/team`  
- `GET/PATCH /api/admin/web-settings`  
- `GET/PATCH /api/admin/support-tickets`, `…/support-tickets/:id`  
- `GET/PATCH /api/admin/booking-requests`, `…/booking-requests/:id`  
- `GET/PATCH /api/admin/enquiries`, `GET …/enquiries/:id`  
- **Menu builder:** `GET /api/admin/menu/locations`, `PATCH …/locations/:id` (set live → updates `tbl_web_settings`), `GET …/locations/:locationId/items`, `GET/POST/PATCH …/menu/items` (+ `…/items/:id`)  
- **Footer builder:** `GET /api/admin/footer/layouts`, `PATCH …/layouts/:id`, `GET …/layouts/:layoutId/widgets`, `GET/PATCH …/footer/widgets/:id`  
- **Leads (CRM):** `GET /api/admin/leads` (pagination; optional `status`, `priority`, `q`), `GET /api/admin/leads/export.csv` (same filters), `GET/PATCH …/leads/:id`, `GET/POST …/leads/:id/activities` (timeline + manual entries; status PATCH logs `status_change`)  
- **Enquiries:** `GET/PATCH …/enquiries`, `GET /api/admin/enquiries/export.csv`, `POST …/enquiries/:id/convert-to-lead` (creates `leads` row, sets `contactform.converted_to_lead`)  
- **Admin users (pickers):** `GET /api/admin/admin-users` — id, username, email  
- **Account:** `POST /api/admin/auth/change-password` (body: `current_password`, `new_password`)  
- **System:** `GET/PATCH /api/admin/app-settings` (`tbl_settings`), `GET/PATCH /api/admin/smtp-settings`, `POST /api/admin/smtp-settings/test` (body: `{ to }`) — uses [nodemailer](https://nodemailer.com/)  
- **Menu / footer reorder:** `POST /api/admin/menu/items/:id/move-sibling` `{ direction: "up"|"down" }` (same `parent_id` + location); `POST /api/admin/footer/widgets/:id/move-sibling` (same column within layout)  

Admin UI: `/admin/menu`, `/admin/footer`, `/admin/leads`, `/admin/system-settings`, `/admin/account` (see sidebar).

## Progress

See [`PROGRESS.md`](./PROGRESS.md) for a weighted **% complete / % remaining** vs the master prompt.

## Still out of scope / later

- **Prisma/Knex** ORM layer (optional; raw SQL migrations are supported).
- **E2E / load tests**, nginx sample config for production.
