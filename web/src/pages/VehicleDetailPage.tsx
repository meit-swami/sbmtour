import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { apiGet } from "@/lib/api";
import { legacyMediaUrl } from "@/lib/media";
import { sanitizedHtml } from "@/lib/sanitizeHtml";
import { usePageMeta } from "@/hooks/usePageMeta";

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

  usePageMeta(
    data?.car ? `${data.car.car_name} | SBM Tour India` : "Vehicle | SBM Tour India"
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 pb-24 pt-28 lg:px-8">
        <div className="h-[420px] animate-pulse rounded-3xl bg-secondary" />
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="container mx-auto px-4 pb-24 pt-28 text-center lg:px-8">
        <p className="text-muted-foreground">{err}</p>
        <Link to="/vehicles" className="mt-4 inline-block font-semibold text-primary">
          ← All vehicles
        </Link>
      </div>
    );
  }

  const c = data.car;
  const hero = legacyMediaUrl("car", String(c.car_image ?? ""));

  return (
    <div className="pt-24">
      <div className="container mx-auto px-4 lg:px-8">
        <Link
          to="/vehicles"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" /> All vehicles
        </Link>
      </div>

      <section className="container mx-auto grid gap-10 px-4 py-8 lg:grid-cols-[1fr_400px] lg:px-8">
        <div>
          <div className="flex aspect-[16/10] items-center justify-center overflow-hidden rounded-2xl border border-border bg-card">
            {hero ? (
              <img src={hero} alt={String(c.car_name)} className="h-full w-full object-contain" />
            ) : null}
          </div>

          <span className="mt-6 inline-block text-xs font-semibold uppercase tracking-wider text-cta">
            {String(c.car_type ?? "")}
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">
            {String(c.car_name)}
          </h1>

          <div
            className="prose prose-slate mt-8 max-w-3xl text-foreground/85 [&_li]:ml-4 [&_p]:mb-3 [&_ul]:list-disc"
            dangerouslySetInnerHTML={sanitizedHtml(String(c.carDesc ?? ""))}
          />
        </div>

        <aside>
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-display text-xl font-bold">Book this vehicle</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get the best price for {String(c.car_name)} — outstation, local or airport transfers.
            </p>
            <Link
              to="/contact"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cta px-4 py-3 font-semibold text-cta-foreground shadow-cta hover:bg-cta/90"
            >
              Enquire now <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/plan-trip"
              className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-border px-4 py-3 font-semibold hover:bg-secondary"
            >
              Plan with expert
            </Link>
          </div>
        </aside>
      </section>

      {data.gallery.length > 0 ? (
        <section className="container mx-auto px-4 pb-16 lg:px-8">
          <h2 className="font-display text-2xl font-bold">Gallery</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {data.gallery.map((g, idx) => {
              const url = legacyMediaUrl("car/gallery", g.image_file);
              return url ? (
                <a
                  key={`${g.image_file}-${idx}`}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="overflow-hidden rounded-xl bg-muted"
                >
                  <img
                    src={url}
                    alt=""
                    className="aspect-video w-full object-cover transition-transform hover:scale-105"
                  />
                </a>
              ) : null;
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
