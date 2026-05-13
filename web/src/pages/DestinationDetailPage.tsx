import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, ChevronLeft, MapPin } from "lucide-react";
import { apiGet } from "@/lib/api";
import { legacyMediaUrl } from "@/lib/media";
import { sanitizedHtml } from "@/lib/sanitizeHtml";
import { usePageMeta } from "@/hooks/usePageMeta";

type DestinationDetail = {
  id: number;
  destination_name: string;
  destination_slug: string;
  destination_type: string;
  destDesc: string;
  metaTagDesc: string;
  destination_image: string;
  country_name: string;
  country_slug: string;
};

type GalleryRow = { image_file: string; type: string; status: number };

type Response = {
  data: {
    destination: DestinationDetail;
    gallery: GalleryRow[];
  };
};

export function DestinationDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<Response["data"] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    apiGet<Response>(`/api/destinations/slug/${encodeURIComponent(slug)}`)
      .then((r) => {
        setData(r.data);
        setErr(null);
      })
      .catch(() => {
        setErr("Destination not found.");
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  usePageMeta(
    data?.destination
      ? `${data.destination.destination_name} | SBM Tour India`
      : "Destination | SBM Tour India",
    data?.destination?.metaTagDesc
      ? String(data.destination.metaTagDesc).slice(0, 160)
      : undefined
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
        <Link to="/destinations" className="mt-4 inline-block font-semibold text-primary">
          ← All destinations
        </Link>
      </div>
    );
  }

  const d = data.destination;
  const hero = legacyMediaUrl("destination", d.destination_image);

  return (
    <>
      <section className="relative h-[60svh] min-h-[420px]">
        {hero ? (
          <img src={hero} alt={d.destination_name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-secondary" />
        )}
        <div className="absolute inset-0 gradient-hero" />
        <div className="container relative mx-auto flex h-full flex-col justify-end px-4 pb-10 pt-24 text-white lg:px-8">
          <Link
            to="/destinations"
            className="mb-4 inline-flex w-fit items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> All destinations
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wider text-gold">
            {d.destination_type}
          </span>
          <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight md:text-6xl">
            {d.destination_name}
          </h1>
          <p className="mt-2 inline-flex items-center gap-2 text-white/85">
            <MapPin className="h-4 w-4" /> {d.country_name}
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 lg:px-8">
        <div
          className="prose prose-slate max-w-3xl text-foreground/85 [&_li]:ml-4 [&_p]:mb-3 [&_ul]:list-disc"
          dangerouslySetInnerHTML={sanitizedHtml(d.destDesc)}
        />
      </section>

      {data.gallery.length > 0 ? (
        <section className="container mx-auto px-4 pb-16 lg:px-8">
          <h2 className="font-display text-2xl font-bold">Gallery</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {data.gallery.map((g) => {
              const url = legacyMediaUrl("destination/gallery", g.image_file);
              return url ? (
                <a
                  key={g.image_file}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="overflow-hidden rounded-xl bg-muted"
                >
                  <img
                    src={url}
                    alt=""
                    className="aspect-square w-full object-cover transition-transform hover:scale-105"
                  />
                </a>
              ) : null;
            })}
          </div>
        </section>
      ) : null}

      <section className="container mx-auto px-4 pb-20 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/packages"
            className="inline-flex items-center gap-2 rounded-lg bg-cta px-6 py-3 font-semibold text-cta-foreground shadow-cta hover:bg-cta/90"
          >
            View packages <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/plan-trip"
            className="inline-flex rounded-lg border border-border bg-card px-6 py-3 font-semibold hover:bg-secondary"
          >
            Plan a custom trip
          </Link>
        </div>
      </section>
    </>
  );
}
