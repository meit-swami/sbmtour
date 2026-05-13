import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { apiGet } from "@/lib/api";
import { legacyMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { DestinationRow } from "@/types/home";

export function PopularDestinations({
  types,
  initialTypes,
}: {
  types?: string[];
  initialTypes?: string[];
}) {
  const [destTypes, setDestTypes] = useState<string[]>(
    types ?? initialTypes ?? []
  );
  const [active, setActive] = useState<string>("");
  const [items, setItems] = useState<DestinationRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (types?.length) {
      setDestTypes(types);
      return;
    }
    apiGet<{ data: string[] }>("/api/destination-types")
      .then((r) => setDestTypes(r.data ?? []))
      .catch(() => setDestTypes([]));
  }, [types]);

  const defaultType = useMemo(() => {
    if (destTypes.includes("Featured Destinations")) return "Featured Destinations";
    return destTypes[0] ?? "";
  }, [destTypes]);

  useEffect(() => {
    if (!defaultType) return;
    setActive((cur) => (cur === "" ? defaultType : cur));
  }, [defaultType]);

  useEffect(() => {
    if (!active) {
      setItems([]);
      return;
    }
    setLoading(true);
    apiGet<{ data: DestinationRow[] }>(
      `/api/destinations?${new URLSearchParams({
        destination_type: active,
        limit: "8",
      })}`
    )
      .then((r) => setItems(r.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [active]);

  if (destTypes.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-20 lg:px-8">
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-cta">
            Most loved
          </div>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Popular Destinations
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Filter by category and discover handpicked getaways travelers love.
          </p>
        </div>
        <Link
          to="/destinations"
          className="hidden items-center gap-1 text-sm font-semibold text-primary transition-all hover:gap-2 sm:inline-flex"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {destTypes.length > 1 ? (
        <div className="mb-8 flex flex-wrap gap-2 border-b border-border">
          {destTypes.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={cn(
                "relative -mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
                active === t
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
        <p className="py-8 text-center text-muted-foreground">Loading destinations…</p>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No destinations in this category.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {items.map((d) => {
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
                  <div className="mt-0.5 text-xs opacity-85">
                    {d.destination_type}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
