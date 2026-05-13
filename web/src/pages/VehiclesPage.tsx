import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Car } from "lucide-react";
import { apiGet } from "@/lib/api";
import { legacyMediaUrl } from "@/lib/media";
import { stripHtml } from "@/lib/text";
import { usePageMeta } from "@/hooks/usePageMeta";

type CarRow = {
  id: number;
  car_name: string;
  car_slug: string;
  car_type: string;
  carDesc: string;
  car_image: string;
  show_on_off: number;
};

export function VehiclesPage() {
  usePageMeta(
    "Vehicles | SBM Tour India",
    "Cars, SUVs and tempo travellers for your trip."
  );
  const [rows, setRows] = useState<CarRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ data: CarRow[] }>("/api/cars?limit=48")
      .then((r) => setRows(r.data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="border-b border-border bg-secondary/40 pb-12 pt-28">
        <div className="container mx-auto px-4 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-cta">
            On the road
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold md:text-5xl">
            Our fleet
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Reliable transport — local cabs, outstation rides and airport transfers.
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
          <p className="py-12 text-center text-muted-foreground">No vehicles yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((c) => {
              const img = legacyMediaUrl("car", c.car_image);
              return (
                <Link
                  key={c.id}
                  to={`/vehicles/${c.car_slug}`}
                  className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-soft hover-lift"
                >
                  <div className="flex aspect-[16/10] items-center justify-center overflow-hidden bg-muted">
                    {img ? (
                      <img
                        src={img}
                        alt={c.car_name}
                        loading="lazy"
                        className="img-zoom h-full w-full object-contain"
                      />
                    ) : (
                      <Car className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-cta">
                      {c.car_type}
                    </p>
                    <h2 className="mt-1 font-display text-lg font-semibold transition-colors group-hover:text-primary">
                      {c.car_name}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {stripHtml(c.carDesc, 120)}
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
