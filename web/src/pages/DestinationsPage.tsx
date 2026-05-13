import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin } from "lucide-react";
import { apiGet } from "@/lib/api";
import { legacyMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { usePageMeta } from "@/hooks/usePageMeta";
import type { DestinationRow } from "@/types/home";

export function DestinationsPage() {
  usePageMeta(
    "Destinations | SBM Tour India",
    "Browse Indian and international destinations curated by our travel experts."
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const typeFromUrl = searchParams.get("type") ?? "";

  const [types, setTypes] = useState<string[]>([]);
  const [destinations, setDestinations] = useState<DestinationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ data: string[] }>("/api/destination-types")
      .then((r) => setTypes(r.data))
      .catch(() => setTypes([]));
  }, []);

  const activeType = useMemo(() => {
    if (typeFromUrl && types.includes(typeFromUrl)) return typeFromUrl;
    if (types.includes("Featured Destinations")) return "Featured Destinations";
    return types[0] ?? "";
  }, [typeFromUrl, types]);

  useEffect(() => {
    if (!activeType) {
      setDestinations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    apiGet<{ data: DestinationRow[] }>(
      `/api/destinations?${new URLSearchParams({
        destination_type: activeType,
        limit: "48",
      })}`
    )
      .then((r) => setDestinations(r.data))
      .catch(() => setDestinations([]))
      .finally(() => setLoading(false));
  }, [activeType]);

  function selectType(t: string) {
    setSearchParams(t ? { type: t } : {});
  }

  return (
    <>
      <div className="border-b border-border bg-secondary/40 pb-12 pt-28">
        <div className="container mx-auto px-4 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-cta">
            Explore
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold md:text-5xl">
            Destinations
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Filter by category and discover handpicked places to explore.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 lg:px-8">
        {types.length > 0 ? (
          <div className="mb-8 flex flex-wrap gap-2 border-b border-border">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => selectType(t)}
                className={cn(
                  "relative -mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
                  t === activeType
                    ? "border-cta text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-2xl border border-border bg-card"
              />
            ))}
          </div>
        ) : destinations.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            No destinations in this category.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {destinations.map((d) => {
              const img = legacyMediaUrl("destination", d.destination_image);
              return (
                <Link
                  key={d.id}
                  to={`/destinations/${d.destination_slug}`}
                  className="group relative aspect-[4/5] overflow-hidden rounded-2xl shadow-soft hover-lift"
                >
                  {img ? (
                    <img
                      src={img}
                      alt={d.destination_name}
                      loading="lazy"
                      className="img-zoom h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-secondary" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute left-3 top-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-foreground">
                      <MapPin className="h-3 w-3" /> {d.country_name}
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <div className="font-display text-xl font-bold">
                      {d.destination_name}
                    </div>
                    <div className="mt-0.5 text-xs opacity-85">{d.destination_type}</div>
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
