import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Compass,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Youtube,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { sanitizedFooterHtml, sanitizedHtml } from "@/lib/sanitizeHtml";
import type {
  FooterResponse,
  FooterWidget,
  MenuNode,
  MenuResponse,
} from "@/types/site";

function WidgetBlock({ w }: { w: FooterWidget }) {
  const title = w.widget_title?.trim();
  const content = w.widget_content?.trim();
  const iframe = w.widget_iframe?.trim();
  const url = w.widget_url?.trim();

  return (
    <div className="text-left text-sm">
      {title ? (
        <h4 className="mb-4 font-display text-base font-semibold tracking-wide text-gold">
          {title}
        </h4>
      ) : null}
      {w.widget_type === "social" && url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-gold hover:underline"
        >
          {content || url}
        </a>
      ) : null}
      {w.widget_type !== "social" && content ? (
        <div
          className="space-y-2 leading-relaxed text-background/75 [&_a]:text-gold [&_a:hover]:underline"
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
          className="mt-2 inline-block text-gold hover:underline"
        >
          {url}
        </a>
      ) : null}
    </div>
  );
}

export function Footer() {
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
  const fb = (payload?.fallback ?? {}) as Record<
    string,
    string | null | undefined
  >;
  const siteName = fb?.site_name || "SBM Tour India";

  /* Dynamic widget mode */
  if (payload?.mode === "dynamic" && payload.widgets?.length) {
    const byCol = new Map<number, FooterWidget[]>();
    for (const w of payload.widgets) {
      const col = w.column_position || 1;
      if (!byCol.has(col)) byCol.set(col, []);
      byCol.get(col)!.push(w);
    }
    const cols = [...byCol.keys()].sort((a, b) => a - b);

    return (
      <footer className="mt-24 bg-foreground text-background">
        <div className="container mx-auto grid gap-12 px-4 py-16 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-ocean">
                <Compass className="h-5 w-5 text-ocean-foreground" />
              </div>
              <span className="font-display text-xl font-bold">{siteName}</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-background/70">
              Curated journeys for unforgettable moments. Domestic & international packages crafted by experts.
            </p>
            <div className="mt-5 flex gap-3">
              {fb?.facebook_url ? (
                <a
                  href={fb.facebook_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-background/10 transition hover:bg-background/20"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              ) : null}
              {fb?.instagram_url ? (
                <a
                  href={fb.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-background/10 transition hover:bg-background/20"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              ) : null}
              {fb?.twitter_url ? (
                <a
                  href={fb.twitter_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-background/10 transition hover:bg-background/20"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              ) : null}
              {fb?.youtube_url ? (
                <a
                  href={fb.youtube_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-background/10 transition hover:bg-background/20"
                  aria-label="YouTube"
                >
                  <Youtube className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c} className="space-y-6">
              {(byCol.get(c) ?? []).map((w) => <WidgetBlock key={w.id} w={w} />)}
            </div>
          ))}
        </div>
        <div className="border-t border-background/10">
          <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-background/60 md:flex-row lg:px-8">
            {fb?.copyright_text ? (
              <span dangerouslySetInnerHTML={sanitizedHtml(String(fb.copyright_text))} />
            ) : (
              <p>© {year} {siteName}. All rights reserved.</p>
            )}
            <div className="flex gap-5">
              <Link to="/privacy" className="hover:text-background">Privacy</Link>
              <Link to="/terms" className="hover:text-background">Terms</Link>
              <Link to="/refund" className="hover:text-background">Refund</Link>
              <Link to="/cancellation" className="hover:text-background">Cancellation</Link>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  /* Default mode — derive sensible defaults */
  const quickLinks =
    menuItems.length > 0
      ? menuItems
          .filter(
            (m) => m.href && m.href !== "#" && !m.href.startsWith("/admin")
          )
          .slice(0, 6)
      : [
          { id: 1, title: "Destinations", href: "/destinations", target: "_self", children: [] },
          { id: 2, title: "Packages", href: "/packages", target: "_self", children: [] },
          { id: 3, title: "Hotels", href: "/hotels", target: "_self", children: [] },
          { id: 4, title: "Blog", href: "/blog", target: "_self", children: [] },
          { id: 5, title: "About", href: "/about", target: "_self", children: [] },
          { id: 6, title: "Contact", href: "/contact", target: "_self", children: [] },
        ];

  return (
    <footer className="mt-24 bg-foreground text-background">
      <div className="container mx-auto grid gap-10 px-4 py-16 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-ocean">
              <Compass className="h-5 w-5 text-ocean-foreground" />
            </div>
            <span className="font-display text-xl font-bold">{siteName}</span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-background/70">
            Curated domestic & international journeys — handcrafted itineraries, expert local guides, best price guarantee.
          </p>
          <div className="mt-5 flex gap-3">
            {fb?.facebook_url ? (
              <a
                href={fb.facebook_url}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-background/10 transition hover:bg-background/20"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
            ) : null}
            {fb?.instagram_url ? (
              <a
                href={fb.instagram_url}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-background/10 transition hover:bg-background/20"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            ) : null}
            {fb?.twitter_url ? (
              <a
                href={fb.twitter_url}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-background/10 transition hover:bg-background/20"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
            ) : null}
            {fb?.youtube_url ? (
              <a
                href={fb.youtube_url}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-background/10 transition hover:bg-background/20"
                aria-label="YouTube"
              >
                <Youtube className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </div>

        <div>
          <h4 className="mb-4 font-display text-base font-semibold text-gold">
            Explore
          </h4>
          <ul className="space-y-2 text-sm text-background/75">
            {quickLinks.map((item) =>
              item.href.startsWith("http://") || item.href.startsWith("https://") ? (
                <li key={item.id}>
                  <a
                    href={item.href}
                    target={item.target === "_blank" ? "_blank" : undefined}
                    rel={item.target === "_blank" ? "noreferrer" : undefined}
                    className="hover:text-background"
                  >
                    {item.title}
                  </a>
                </li>
              ) : (
                <li key={item.id}>
                  <Link to={item.href} className="hover:text-background">
                    {item.title}
                  </Link>
                </li>
              )
            )}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-display text-base font-semibold text-gold">
            Get in touch
          </h4>
          <ul className="space-y-3 text-sm text-background/75">
            {fb?.address ? (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-gold" />
                <span>{fb.address}</span>
              </li>
            ) : null}
            {fb?.contact_number ? (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gold" />
                <a
                  href={`tel:${fb.contact_number}`}
                  className="hover:text-background"
                >
                  {fb.contact_number}
                </a>
              </li>
            ) : null}
            {fb?.contact_email ? (
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gold" />
                <a
                  href={`mailto:${fb.contact_email}`}
                  className="hover:text-background"
                >
                  {fb.contact_email}
                </a>
              </li>
            ) : null}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-display text-base font-semibold text-gold">
            Find us
          </h4>
          {fb?.map_embed_url ? (
            <div
              className="max-w-full overflow-hidden [&_iframe]:max-h-44 [&_iframe]:w-full [&_iframe]:rounded-xl"
              dangerouslySetInnerHTML={sanitizedFooterHtml(String(fb.map_embed_url))}
            />
          ) : (
            <Link
              to="/plan-trip"
              className="inline-flex rounded-lg bg-cta px-5 py-3 text-sm font-semibold text-cta-foreground shadow-cta hover:bg-cta/90"
            >
              Plan a trip
            </Link>
          )}
        </div>
      </div>

      <div className="border-t border-background/10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-background/60 md:flex-row lg:px-8">
          {fb?.copyright_text ? (
            <span dangerouslySetInnerHTML={sanitizedHtml(String(fb.copyright_text))} />
          ) : (
            <p>© {year} {siteName}. All rights reserved.</p>
          )}
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-background">Privacy</Link>
            <Link to="/terms" className="hover:text-background">Terms</Link>
            <Link to="/refund" className="hover:text-background">Refund</Link>
            <Link to="/cancellation" className="hover:text-background">Cancellation</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
