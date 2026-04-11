import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiGet } from "@/lib/api";
import { legacyMediaUrl } from "@/lib/media";
import type { DestinationRow } from "@/types/home";

export function DestinationsPage() {
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
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-brand-navy">Destinations</h1>
      <p className="mt-2 text-slate-600">
        Browse by category — same data as the legacy destination catalogue.
      </p>

      {types.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-2">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => selectType(t)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                t === activeType
                  ? "bg-brand-navy text-white"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="col-span-full text-center text-slate-500">Loading…</p>
        ) : (
          destinations.map((d) => {
            const img = legacyMediaUrl("destination", d.destination_image);
            return (
            <Link
              key={d.id}
              to={`/destinations/${d.destination_slug}`}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                {img ? (
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : null}
              </div>
              <div className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-brand-accent">
                  {d.country_name}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-brand-navy group-hover:text-brand-accent">
                  {d.destination_name}
                </h2>
                <p className="mt-1 text-xs text-slate-500">{d.destination_type}</p>
              </div>
            </Link>
            );
          })
        )}
      </div>

      {!loading && destinations.length === 0 && activeType ? (
        <p className="mt-12 text-center text-slate-500">
          No destinations in this category.
        </p>
      ) : null}
    </div>
  );
}
