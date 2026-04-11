import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiGet } from "@/lib/api";
import { legacyMediaUrl } from "@/lib/media";
import { sanitizedHtml } from "@/lib/sanitizeHtml";

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
    apiGet<Response>(
      `/api/destinations/slug/${encodeURIComponent(slug)}`
    )
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
        <Link to="/destinations" className="mt-4 inline-block text-brand-accent">
          ← All destinations
        </Link>
      </div>
    );
  }

  const d = data.destination;
  const hero = legacyMediaUrl("destination", d.destination_image);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        to="/destinations"
        className="text-sm font-medium text-brand-accent hover:underline"
      >
        ← All destinations
      </Link>

      {hero ? (
        <img
          src={hero}
          alt=""
          className="mt-6 aspect-[21/9] w-full rounded-2xl object-cover shadow-md"
        />
      ) : null}

      <p className="mt-6 text-sm font-medium text-brand-accent">
        {d.country_name} · {d.destination_type}
      </p>
      <h1 className="mt-2 text-3xl font-bold text-brand-navy">
        {d.destination_name}
      </h1>

      <div
        className="mt-8 max-w-none space-y-3 text-slate-700 [&_li]:ml-4 [&_p]:mb-3 [&_ul]:list-disc"
        dangerouslySetInnerHTML={sanitizedHtml(d.destDesc)}
      />

      {data.gallery.length > 0 ? (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-brand-navy">Gallery</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {data.gallery.map((g) => {
              const url = legacyMediaUrl("destination/gallery", g.image_file);
              return url ? (
                <img
                  key={g.image_file}
                  src={url}
                  alt=""
                  className="aspect-square w-full rounded-lg object-cover"
                />
              ) : null;
            })}
          </div>
        </div>
      ) : null}

      <Link
        to="/packages"
        className="mt-10 inline-flex rounded-lg bg-brand-accent px-6 py-3 font-semibold text-brand-navy hover:bg-brand-accent-hover"
      >
        View packages
      </Link>
    </div>
  );
}
