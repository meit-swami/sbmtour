import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "@/lib/api";
import { legacyMediaUrl } from "@/lib/media";
import { stripHtml } from "@/lib/text";

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
  const [rows, setRows] = useState<CarRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ data: CarRow[] }>("/api/cars?limit=48")
      .then((r) => setRows(r.data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-brand-navy">Vehicles</h1>
      <p className="mt-2 text-slate-600">
        Fleet and transport from <code className="text-xs">tbl_car</code>.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="col-span-full text-center text-slate-500">Loading…</p>
        ) : (
          rows.map((c) => {
            const img = legacyMediaUrl("car", c.car_image);
            return (
              <Link
                key={c.id}
                to={`/vehicles/${c.car_slug}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="aspect-[16/10] overflow-hidden bg-slate-100">
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
                    {c.car_type}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-brand-navy group-hover:text-brand-accent">
                    {c.car_name}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                    {stripHtml(c.carDesc, 120)}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
