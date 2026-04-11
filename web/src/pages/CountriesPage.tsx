import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "@/lib/api";
import { legacyMediaUrl } from "@/lib/media";

type CountryRow = {
  id: number;
  country_name: string;
  country_slug: string;
  country_image: string;
  set_on_home: number;
};

export function CountriesPage() {
  const [rows, setRows] = useState<CountryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ data: CountryRow[] }>("/api/countries")
      .then((r) => setRows(r.data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-brand-navy">Countries</h1>
      <p className="mt-2 text-slate-600">
        Explore destinations by country — from <code className="text-xs">tbl_country</code>.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="col-span-full text-center text-slate-500">Loading…</p>
        ) : (
          rows.map((c) => {
            const img = legacyMediaUrl("country", c.country_image);
            return (
              <Link
                key={c.id}
                to={`/countries/${c.country_slug}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="flex aspect-[16/10] items-center justify-center overflow-hidden bg-slate-100">
                  {img ? (
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-4xl opacity-30">🌍</span>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-brand-navy group-hover:text-brand-accent">
                    {c.country_name}
                  </h2>
                  {c.set_on_home ? (
                    <p className="mt-1 text-xs text-brand-accent">Featured on home</p>
                  ) : null}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
