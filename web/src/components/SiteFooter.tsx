import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "@/lib/api";
import { sanitizedFooterHtml, sanitizedHtml } from "@/lib/sanitizeHtml";
import type { FooterResponse, FooterWidget, MenuNode, MenuResponse } from "@/types/site";

function WidgetBlock({ w }: { w: FooterWidget }) {
  const title = w.widget_title?.trim();
  const content = w.widget_content?.trim();
  const iframe = w.widget_iframe?.trim();
  const url = w.widget_url?.trim();

  return (
    <div className="text-left text-sm">
      {title ? (
        <h3 className="mb-3 text-xl font-bold text-brand-accent">{title}</h3>
      ) : null}
      {w.widget_type === "social" && url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-brand-accent hover:underline"
        >
          {content || url}
        </a>
      ) : null}
      {w.widget_type !== "social" && content ? (
        <div
          className="space-y-2 text-base leading-relaxed text-slate-300 [&_a]:text-brand-accent"
          dangerouslySetInnerHTML={sanitizedFooterHtml(content)}
        />
      ) : null}
      {iframe ? (
        <div
          className="mt-4 max-w-full overflow-hidden [&_iframe]:max-h-56 [&_iframe]:w-full [&_iframe]:rounded-xl"
          dangerouslySetInnerHTML={sanitizedFooterHtml(iframe)}
        />
      ) : null}
      {w.widget_type !== "social" && url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-brand-accent hover:underline"
        >
          {url}
        </a>
      ) : null}
    </div>
  );
}

export function SiteFooter() {
  const [payload, setPayload] = useState<FooterResponse["data"] | null>(null);
  const [menuItems, setMenuItems] = useState<MenuNode[]>([]);

  useEffect(() => {
    apiGet<FooterResponse>("/api/footer")
      .then((r) => setPayload(r.data))
      .catch(() => setPayload(null));
    apiGet<MenuResponse>("/api/menu")
      .then((r) => setMenuItems(r.data.items ?? []))
      .catch(() => setMenuItems([]));
  }, []);

  const year = new Date().getFullYear();
  const fb = payload?.fallback as Record<string, string | null | undefined>;

  if (payload?.mode === "dynamic" && payload.widgets?.length) {
    const byCol = new Map<number, FooterWidget[]>();
    for (const w of payload.widgets) {
      const col = w.column_position || 1;
      if (!byCol.has(col)) byCol.set(col, []);
      byCol.get(col)!.push(w);
    }
    const cols = [...byCol.keys()].sort((a, b) => a - b);

    return (
      <footer className="border-t border-slate-800 bg-[#070b17] py-14 text-slate-300">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 md:grid-cols-2 lg:grid-cols-4">
          {cols.map((c) => (
            <div key={c} className="space-y-6">
              {(byCol.get(c) ?? []).map((w) => (
                <WidgetBlock key={w.id} w={w} />
              ))}
            </div>
          ))}
        </div>
        {fb?.copyright_text ? (
          <div
            className="mx-auto mt-10 max-w-6xl border-t border-slate-800 px-4 pt-8 text-center text-xs text-slate-500"
            dangerouslySetInnerHTML={sanitizedHtml(fb.copyright_text)}
          />
        ) : (
          <p className="mt-10 text-center text-xs text-slate-500">
            © {year} SBM Tour India
          </p>
        )}
      </footer>
    );
  }

  return (
    <footer className="border-t border-slate-800 bg-[#070b17] py-14 text-slate-300">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-10 text-left md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-2xl font-bold text-brand-accent">
              {fb?.site_name ?? "SBM Tour India"}
            </p>
            <p className="mt-4 text-4xl font-extrabold leading-tight text-white">
              Planning A
              <br />
              Trip?
            </p>
            <Link
              to="/contact"
              className="mt-6 inline-flex rounded-lg bg-brand-accent px-6 py-3 text-sm font-bold text-brand-navy hover:bg-brand-accent-hover"
            >
              BOOK A TOUR
            </Link>
          </div>
          <div>
            <h3 className="mb-4 text-xl font-bold text-brand-accent">Quick Link</h3>
            <div className="space-y-2 text-base">
              {(menuItems.length > 0
                ? menuItems
                    .filter((m) => m.href && m.href !== "#" && !m.href.startsWith("/admin"))
                    .slice(0, 6)
                : [
                    { id: 1, title: "About Us", href: "/about", target: "_self", children: [] },
                    { id: 2, title: "Destinations", href: "/destinations", target: "_self", children: [] },
                    { id: 3, title: "Tour Packages", href: "/packages", target: "_self", children: [] },
                    { id: 4, title: "Blogs", href: "/blog", target: "_self", children: [] },
                  ]
              ).map((item) =>
                item.href.startsWith("http://") || item.href.startsWith("https://") ? (
                  <a
                    key={item.id}
                    href={item.href}
                    target={item.target === "_blank" ? "_blank" : undefined}
                    rel={item.target === "_blank" ? "noreferrer" : undefined}
                    className="block hover:text-white"
                  >
                    {item.title}
                  </a>
                ) : (
                  <Link key={item.id} to={item.href} className="block hover:text-white">
                    {item.title}
                  </Link>
                )
              )}
            </div>
          </div>
          <div className="text-base">
            <h3 className="mb-4 text-xl font-bold text-brand-accent">More Inquiry</h3>
            {fb?.address ? (
              <p className="mt-1 text-slate-300">{fb.address}</p>
            ) : null}
            {fb?.contact_number ? (
              <p className="mt-3">
                <a href={`tel:${fb.contact_number}`} className="hover:text-brand-accent">
                  {fb.contact_number}
                </a>
              </p>
            ) : null}
            {fb?.contact_email ? (
              <p className="mt-3">
                <a
                  href={`mailto:${fb.contact_email}`}
                  className="hover:text-brand-accent"
                >
                  {fb.contact_email}
                </a>
              </p>
            ) : null}
          </div>
          <div>
            <h3 className="mb-4 text-xl font-bold text-brand-accent">We Are Here</h3>
            {fb?.map_embed_url ? (
              <div
                className="max-w-full overflow-hidden [&_iframe]:max-h-56 [&_iframe]:w-full [&_iframe]:rounded-xl"
                dangerouslySetInnerHTML={sanitizedFooterHtml(String(fb.map_embed_url))}
              />
            ) : null}
            <div className="mt-4 flex gap-4 text-sm">
            {fb?.facebook_url ? (
              <a
                href={fb.facebook_url}
                target="_blank"
                rel="noreferrer"
                className="text-brand-accent hover:underline"
              >
                Facebook
              </a>
            ) : null}
            {fb?.twitter_url ? (
              <a
                href={fb.twitter_url}
                target="_blank"
                rel="noreferrer"
                className="text-brand-accent hover:underline"
              >
                Twitter
              </a>
            ) : null}
            {fb?.tripadvisor_url ? (
              <a
                href={fb.tripadvisor_url}
                target="_blank"
                rel="noreferrer"
                className="text-brand-accent hover:underline"
              >
                TripAdvisor
              </a>
            ) : null}
            </div>
          </div>
        </div>
        {fb?.copyright_text ? (
          <div
            className="mt-8 text-center text-xs text-slate-500"
            dangerouslySetInnerHTML={sanitizedHtml(fb.copyright_text)}
          />
        ) : (
          <p className="mt-8 text-center text-xs text-slate-500">
            © {year} SBM Tour India —{" "}
            <Link to="/contact" className="text-brand-accent hover:underline">
              Contact
            </Link>
          </p>
        )}
      </div>
    </footer>
  );
}
