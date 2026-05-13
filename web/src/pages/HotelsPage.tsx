import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Star } from "lucide-react";
import { apiGet } from "@/lib/api";
import { legacyMediaUrl } from "@/lib/media";
import { stripHtml } from "@/lib/text";
import { usePageMeta } from "@/hooks/usePageMeta";

type HotelRow = {
  id: number;
  hotelName: string;
  hotelSlug: string;
  hotelAbout: string;
  featured_image: string;
  hotelCatStar: string;
  hotelState: string;
  hotelCityName: string;
  set_on_home: number;
};

export function HotelsPage() {
  usePageMeta("Hotels | SBM Tour India", "Partner stays and curated properties.");
  const [rows, setRows] = useState<HotelRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ data: HotelRow[] }>("/api/hotels?limit=48")
      .then((r) => setRows(r.data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="border-b border-border bg-secondary/40 pb-12 pt-28">
        <div className="container mx-auto px-4 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-cta">
            Where you stay
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold md:text-5xl">
            Partner hotels
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Handpicked stays — from luxury resorts to boutique heritage properties.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 lg:px-8">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl border border-border bg-card"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No hotels yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((h) => {
              const img = legacyMediaUrl("hotel", h.featured_image);
              const star = Number(h.hotelCatStar) || 0;
              return (
                <Link
                  key={h.id}
                  to={`/hotels/${h.hotelSlug}`}
                  className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-soft hover-lift"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {img ? (
                      <img
                        src={img}
                        alt={h.hotelName}
                        loading="lazy"
                        className="img-zoom h-full w-full object-cover"
                      />
                    ) : null}
                    {star > 0 ? (
                      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold text-foreground">
                        <Star className="h-3 w-3 fill-gold text-gold" /> {star}
                      </span>
                    ) : null}
                  </div>
                  <div className="p-5">
                    <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {h.hotelCityName}
                      {h.hotelState ? `, ${h.hotelState}` : ""}
                    </p>
                    <h2 className="mt-2 font-display text-lg font-semibold transition-colors group-hover:text-primary">
                      {h.hotelName}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {stripHtml(h.hotelAbout, 120)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
