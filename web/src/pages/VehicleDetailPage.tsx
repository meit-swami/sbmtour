import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiGet } from "@/lib/api";
import { legacyMediaUrl } from "@/lib/media";
import { sanitizedHtml } from "@/lib/sanitizeHtml";

type Car = Record<string, string | number>;

type GalleryRow = { image_file: string; type: string };

type Response = { data: { car: Car; gallery: GalleryRow[] } };

export function VehicleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<Response["data"] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    apiGet<Response>(`/api/cars/slug/${encodeURIComponent(slug)}`)
      .then((r) => {
        setData(r.data);
        setErr(null);
      })
      .catch(() => {
        setErr("Vehicle not found.");
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center text-slate-600">
        Loading…
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="text-slate-600">{err}</p>
        <Link to="/vehicles" className="mt-4 inline-block text-brand-accent">
          ← All vehicles
        </Link>
      </div>
    );
  }

  const c = data.car;
  const hero = legacyMediaUrl("car", String(c.car_image ?? ""));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        to="/vehicles"
        className="text-sm font-medium text-brand-accent hover:underline"
      >
        ← All vehicles
      </Link>

      {hero ? (
        <img
          src={hero}
          alt=""
          className="mt-6 max-h-96 w-full rounded-2xl object-contain object-center shadow-md"
        />
      ) : null}

      <p className="mt-6 text-sm font-medium text-brand-accent">
        {String(c.car_type ?? "")}
      </p>
      <h1 className="mt-2 text-3xl font-bold text-brand-navy">
        {String(c.car_name)}
      </h1>

      <div
        className="mt-8 max-w-none space-y-3 text-slate-700 [&_li]:ml-4 [&_p]:mb-3"
        dangerouslySetInnerHTML={sanitizedHtml(String(c.carDesc ?? ""))}
      />

      {data.gallery.length > 0 ? (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-brand-navy">Gallery</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {data.gallery.map((g, idx) => {
              const url = legacyMediaUrl("car/gallery", g.image_file);
              return url ? (
                <img
                  key={`${g.image_file}-${idx}`}
                  src={url}
                  alt=""
                  className="aspect-video w-full rounded-lg object-cover"
                />
              ) : null;
            })}
          </div>
        </div>
      ) : null}

      <Link
        to="/contact"
        className="mt-10 inline-flex rounded-lg bg-brand-accent px-6 py-3 font-semibold text-brand-navy hover:bg-brand-accent-hover"
      >
        Book this vehicle
      </Link>
    </div>
  );
}
