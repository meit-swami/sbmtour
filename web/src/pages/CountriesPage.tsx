import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Globe } from "lucide-react";
import { apiGet } from "@/lib/api";
import { legacyMediaUrl } from "@/lib/media";
import { usePageMeta } from "@/hooks/usePageMeta";

type CountryRow = {
  id: number;
  country_name: string;
  country_slug: string;
  country_image: string;
  set_on_home: number;
};

export function CountriesPage() {
  usePageMeta("Countries | SBM Tour India", "Explore tours by country.");
  const [rows, setRows] = useState<CountryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ data: CountryRow[] }>("/api/countries")
      .then((r) => setRows(r.data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="border-b border-border bg-secondary/40 pb-12 pt-28">
        <div className="container mx-auto px-4 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-cta">
            Around the world
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold md:text-5xl">
            Countries
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Discover dream destinations by country — from beach paradises to mountain retreats.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 lg:px-8">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-2xl border border-border bg-card"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((c) => {
              const img = legacyMediaUrl("country", c.country_image);
              return (
                <Link
                  key={c.id}
                  to={`/countries/${c.country_slug}`}
                  className="group relative aspect-[4/5] overflow-hidden rounded-2xl shadow-soft hover-lift"
                >
                  {img ? (
                    <img
                      src={img}
                      alt={c.country_name}
                      loading="lazy"
                      className="img-zoom h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-secondary">
                      <Globe className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <h2 className="font-display text-xl font-bold">{c.country_name}</h2>
                    {c.set_on_home ? (
                      <p className="text-xs text-gold">Featured</p>
                    ) : null}
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
