import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, ChevronLeft, Mail, MapPin, Phone, Star } from "lucide-react";
import { apiGet } from "@/lib/api";
import { legacyMediaUrl } from "@/lib/media";
import { sanitizedHtml } from "@/lib/sanitizeHtml";
import { usePageMeta } from "@/hooks/usePageMeta";

type Hotel = Record<string, string | number>;

type GalleryRow = { image_file: string; type: string };

type Response = { data: { hotel: Hotel; gallery: GalleryRow[] } };

export function HotelDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<Response["data"] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    apiGet<Response>(`/api/hotels/slug/${encodeURIComponent(slug)}`)
      .then((r) => {
        setData(r.data);
        setErr(null);
      })
      .catch(() => {
        setErr("Hotel not found.");
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  usePageMeta(
    data?.hotel
      ? `${data.hotel.hotelName} | SBM Tour India`
      : "Hotel | SBM Tour India"
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 pb-24 pt-28 lg:px-8">
        <div className="h-[420px] animate-pulse rounded-3xl bg-secondary" />
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="container mx-auto px-4 pb-24 pt-28 text-center lg:px-8">
        <p className="text-muted-foreground">{err}</p>
        <Link to="/hotels" className="mt-4 inline-block font-semibold text-primary">
          ← All hotels
        </Link>
      </div>
    );
  }

  const h = data.hotel;
  const hero = legacyMediaUrl("hotel", String(h.featured_image ?? ""));
  const star = Number(h.hotelCatStar) || 0;

  return (
    <>
      <section className="relative h-[55svh] min-h-[380px]">
        {hero ? (
          <img src={hero} alt={String(h.hotelName)} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-secondary" />
        )}
        <div className="absolute inset-0 gradient-hero" />
        <div className="container relative mx-auto flex h-full flex-col justify-end px-4 pb-10 pt-24 text-white lg:px-8">
          <Link
            to="/hotels"
            className="mb-4 inline-flex w-fit items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> All hotels
          </Link>
          {star > 0 ? (
            <div className="flex items-center gap-1 text-gold">
              {Array.from({ length: star }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-gold" />
              ))}
            </div>
          ) : null}
          <h1 className="mt-1 font-display text-4xl font-extrabold leading-tight md:text-6xl">
            {String(h.hotelName)}
          </h1>
          <p className="mt-2 inline-flex items-center gap-2 text-white/85">
            <MapPin className="h-4 w-4" /> {String(h.hotelCityName ?? "")}
            {h.hotelState ? `, ${String(h.hotelState)}` : ""}
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 lg:px-8">
        <div className="flex flex-wrap gap-4 text-sm">
          {h.phoneNo ? (
            <a
              href={`tel:${h.phoneNo}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 hover:bg-secondary"
            >
              <Phone className="h-4 w-4 text-primary" /> {String(h.phoneNo)}
            </a>
          ) : null}
          {h.emailId ? (
            <a
              href={`mailto:${h.emailId}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 hover:bg-secondary"
            >
              <Mail className="h-4 w-4 text-primary" /> {String(h.emailId)}
            </a>
          ) : null}
        </div>

        <div
          className="prose prose-slate mt-8 max-w-3xl text-foreground/85 [&_li]:ml-4 [&_p]:mb-3 [&_ul]:list-disc"
          dangerouslySetInnerHTML={sanitizedHtml(String(h.hotelAbout ?? ""))}
        />
      </section>

      {data.gallery.length > 0 ? (
        <section className="container mx-auto px-4 pb-16 lg:px-8">
          <h2 className="font-display text-2xl font-bold">Gallery</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {data.gallery.map((g, idx) => {
              const url = legacyMediaUrl("hotel/gallery", g.image_file);
              return url ? (
                <a
                  key={`${g.image_file}-${idx}`}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="overflow-hidden rounded-xl bg-muted"
                >
                  <img
                    src={url}
                    alt=""
                    className="aspect-square w-full object-cover transition-transform hover:scale-105"
                  />
                </a>
              ) : null;
            })}
          </div>
        </section>
      ) : null}

      <section className="container mx-auto px-4 pb-20 lg:px-8">
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 rounded-lg bg-cta px-6 py-3 font-semibold text-cta-foreground shadow-cta hover:bg-cta/90"
        >
          Enquire about this hotel <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </>
  );
}
