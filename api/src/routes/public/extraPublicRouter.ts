import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { pool } from "../../db/pool.js";

export const extraPublicRouter = Router();

type MenuFlatRow = RowDataPacket & {
  id: number;
  parent_id: number;
  item_type: string;
  item_title: string;
  item_url: string | null;
  menu_order: number;
  target: string;
  rel_country_slug: string | null;
  rel_destination_slug: string | null;
  rel_package_slug: string | null;
  rel_hotel_slug: string | null;
  rel_car_slug: string | null;
};

function normalizeLegacyUrl(url: string | null | undefined): string {
  if (!url?.trim()) return "#";
  const u = url.trim();
  if (u.startsWith("/") && !u.startsWith("//")) return u;
  try {
    const parsed = new URL(u);
    if (
      parsed.hostname.endsWith("sbmtourindia.com") ||
      parsed.hostname === "www.sbmtourindia.com"
    ) {
      return `${parsed.pathname}${parsed.search}`;
    }
    return u;
  } catch {
    if (u.startsWith("http")) return u;
    return u.startsWith("/") ? u : `/${u}`;
  }
}

function resolveMenuHref(row: MenuFlatRow): string {
  switch (row.item_type) {
    case "custom":
      return normalizeLegacyUrl(row.item_url);
    case "country":
      return row.rel_country_slug
        ? `/countries/${encodeURIComponent(row.rel_country_slug)}`
        : "#";
    case "destination":
      return row.rel_destination_slug
        ? `/destinations/${encodeURIComponent(row.rel_destination_slug)}`
        : "#";
    case "package":
      return row.rel_package_slug
        ? `/packages/${encodeURIComponent(row.rel_package_slug)}`
        : "#";
    case "hotel":
      return row.rel_hotel_slug
        ? `/hotels/${encodeURIComponent(row.rel_hotel_slug)}`
        : "#";
    case "vehicle":
      return row.rel_car_slug
        ? `/vehicles/${encodeURIComponent(row.rel_car_slug)}`
        : "#";
    case "page":
      return normalizeLegacyUrl(row.item_url);
    default:
      return "#";
  }
}

type MenuNode = {
  id: number;
  title: string;
  href: string;
  target: string;
  children: MenuNode[];
};

type InternalMenuNode = {
  id: number;
  title: string;
  href: string;
  target: string;
  order: number;
  parent_id: number;
  children: InternalMenuNode[];
};

function buildMenuTree(flat: MenuFlatRow[]): MenuNode[] {
  const map = new Map<number, InternalMenuNode>();
  for (const r of flat) {
    map.set(r.id, {
      id: r.id,
      title: r.item_title,
      href: resolveMenuHref(r),
      target: r.target === "_blank" ? "_blank" : "_self",
      order: r.menu_order,
      parent_id: r.parent_id != null ? Number(r.parent_id) : 0,
      children: [],
    });
  }
  const roots: InternalMenuNode[] = [];
  for (const n of map.values()) {
    const pid = n.parent_id;
    if (pid && map.has(pid)) {
      map.get(pid)!.children.push(n);
    } else {
      roots.push(n);
    }
  }
  const sortNested = (list: InternalMenuNode[]) => {
    list.sort((a, b) => a.order - b.order || a.id - b.id);
    for (const x of list) sortNested(x.children);
  };
  sortNested(roots);

  const toPublic = (n: InternalMenuNode): MenuNode => ({
    id: n.id,
    title: n.title,
    href: n.href,
    target: n.target,
    children: n.children.map(toPublic),
  });
  return roots.map(toPublic);
}

extraPublicRouter.get("/menu", async (_req, res, next) => {
  try {
    const [wsRows] = await pool.query<RowDataPacket[]>(
      "SELECT active_menu_type, active_menu_id FROM tbl_web_settings LIMIT 1"
    );
    const ws = wsRows[0] as
      | { active_menu_type: string; active_menu_id: number | null }
      | undefined;

    if (
      !ws ||
      ws.active_menu_type !== "dynamic" ||
      ws.active_menu_id == null ||
      ws.active_menu_id < 1
    ) {
      res.json({ data: { source: "default", items: [] as MenuNode[] } });
      return;
    }

    const [loc] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM tbl_menu_locations WHERE id = ? AND status = 1 AND active = 1 LIMIT 1",
      [ws.active_menu_id]
    );
    if (!loc[0]) {
      res.json({ data: { source: "default", items: [] as MenuNode[] } });
      return;
    }

    const [flat] = await pool.query<MenuFlatRow[]>(
      `SELECT mi.id, mi.parent_id, mi.item_type, mi.item_title, mi.item_url, mi.menu_order, mi.target,
              c.country_slug AS rel_country_slug,
              d.destination_slug AS rel_destination_slug,
              p.package_slug AS rel_package_slug,
              h.hotelSlug AS rel_hotel_slug,
              car.car_slug AS rel_car_slug
       FROM tbl_menu_items mi
       LEFT JOIN tbl_country c ON mi.item_type = 'country' AND mi.item_id IS NOT NULL AND c.id = mi.item_id AND c.status = 1
       LEFT JOIN tbl_destination d ON mi.item_type = 'destination' AND mi.item_id IS NOT NULL AND d.id = mi.item_id AND d.status = 1
       LEFT JOIN tbl_package p ON mi.item_type = 'package' AND mi.item_id IS NOT NULL AND p.id = mi.item_id AND p.status = 1
       LEFT JOIN tbl_hotel h ON mi.item_type = 'hotel' AND mi.item_id IS NOT NULL AND h.id = mi.item_id AND h.status = 1
       LEFT JOIN tbl_car car ON mi.item_type = 'vehicle' AND mi.item_id IS NOT NULL AND car.id = mi.item_id AND car.status = 1
       WHERE mi.menu_location_id = ? AND mi.status = 1
       ORDER BY mi.menu_order ASC, mi.id ASC`,
      [ws.active_menu_id]
    );

    const items = buildMenuTree(flat);
    res.json({ data: { source: "dynamic", items } });
  } catch (e) {
    next(e);
  }
});

extraPublicRouter.get("/footer", async (_req, res, next) => {
  try {
    const [wsRows] = await pool.query<RowDataPacket[]>(
      `SELECT site_name, copyright_text, address, contact_number, contact_email,
              facebook_url, twitter_url, tripadvisor_url, map_embed_url,
              active_footer_type, active_footer_id
       FROM tbl_web_settings LIMIT 1`
    );
    const ws = wsRows[0] as Record<string, unknown> | undefined;
    if (!ws) {
      res.json({ data: { mode: "default", fallback: {} } });
      return;
    }

    if (
      ws.active_footer_type === "dynamic" &&
      ws.active_footer_id != null &&
      Number(ws.active_footer_id) > 0
    ) {
      const [layout] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM tbl_footer_layouts WHERE id = ? AND status = 1 AND active = 1 LIMIT 1",
        [ws.active_footer_id]
      );
      if (layout[0]) {
        const [widgets] = await pool.query<RowDataPacket[]>(
          `SELECT id, widget_type, widget_title, widget_content, widget_url, widget_iframe,
                  column_position, row_order
           FROM tbl_footer_widgets
           WHERE layout_id = ? AND status = 1
           ORDER BY column_position ASC, row_order ASC, id ASC`,
          [ws.active_footer_id]
        );
        if (widgets.length > 0) {
          res.json({
            data: {
              mode: "dynamic",
              widgets,
              fallback: {
                site_name: ws.site_name,
                copyright_text: ws.copyright_text,
              },
            },
          });
          return;
        }
      }
    }

    res.json({
      data: {
        mode: "default",
        fallback: {
          site_name: ws.site_name,
          copyright_text: ws.copyright_text,
          address: ws.address,
          contact_number: ws.contact_number,
          contact_email: ws.contact_email,
          facebook_url: ws.facebook_url,
          twitter_url: ws.twitter_url,
          tripadvisor_url: ws.tripadvisor_url,
          map_embed_url: ws.map_embed_url,
        },
      },
    });
  } catch (e) {
    next(e);
  }
});

extraPublicRouter.get("/hotels", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 24, 1), 96);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, hotelName, hotelSlug, hotelAbout, featured_image, hotelCatStar, hotelState,
              hotelCityName, set_on_home
       FROM tbl_hotel WHERE status = 1
       ORDER BY set_on_home DESC, hotelName ASC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    res.json({ data: rows });
  } catch (e) {
    next(e);
  }
});

extraPublicRouter.get("/hotels/slug/:slug", async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM tbl_hotel WHERE hotelSlug = ? AND status = 1 LIMIT 1`,
      [slug]
    );
    const hotel = rows[0];
    if (!hotel) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const [gallery] = await pool.query<RowDataPacket[]>(
      `SELECT image_file, type FROM tbl_hotel_images WHERE parent_id = ? AND status = 1 ORDER BY id ASC`,
      [hotel.id]
    );
    res.json({ data: { hotel, gallery } });
  } catch (e) {
    next(e);
  }
});

extraPublicRouter.get("/cars", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 24, 1), 96);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, car_name, car_slug, car_type, carDesc, car_image, show_on_off
       FROM tbl_car WHERE status = 1
       ORDER BY show_on_off DESC, car_name ASC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    res.json({ data: rows });
  } catch (e) {
    next(e);
  }
});

extraPublicRouter.get("/cars/slug/:slug", async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM tbl_car WHERE car_slug = ? AND status = 1 LIMIT 1`,
      [slug]
    );
    const car = rows[0];
    if (!car) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const [gallery] = await pool.query<RowDataPacket[]>(
      `SELECT image_file, type FROM tbl_car_images WHERE parent_id = ? AND status = 1 ORDER BY id ASC`,
      [car.id]
    );
    res.json({ data: { car, gallery } });
  } catch (e) {
    next(e);
  }
});
