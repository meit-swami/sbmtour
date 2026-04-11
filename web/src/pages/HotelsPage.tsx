import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "@/lib/api";
import { legacyMediaUrl } from "@/lib/media";
import { stripHtml } from "@/lib/text";

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
  const [rows, setRows] = useState<HotelRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ data: HotelRow[] }>("/api/hotels?limit=48")
      .then((r) => setRows(r.data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-brand-navy">Hotels</h1>
      <p className="mt-2 text-slate-600">
        Partner stays and properties from <code className="text-xs">tbl_hotel</code>.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="col-span-full text-center text-slate-500">Loading…</p>
        ) : (
          rows.map((h) => {
            const img = legacyMediaUrl("hotel", h.featured_image);
            return (
              <Link
                key={h.id}
                to={`/hotels/${h.hotelSlug}`}
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
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    {h.hotelCatStar ? (
                      <span>{h.hotelCatStar}★</span>
                    ) : null}
                    <span>
                      {h.hotelCityName}
                      {h.hotelState ? `, ${h.hotelState}` : ""}
                    </span>
                  </div>
                  <h2 className="mt-1 text-lg font-semibold text-brand-navy group-hover:text-brand-accent">
                    {h.hotelName}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                    {stripHtml(h.hotelAbout, 120)}
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
