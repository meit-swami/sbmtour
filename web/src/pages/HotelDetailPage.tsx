import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiGet } from "@/lib/api";
import { legacyMediaUrl } from "@/lib/media";
import { sanitizedHtml } from "@/lib/sanitizeHtml";

type Hotel = Record<string, string | number>;

type GalleryRow = { image_file: string; type: string };

type Response = { data: { hotel: Hotel; gallery: GalleryRow[] } };

export function HotelDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<Response["data"] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    apiGet<Response>(`/api/hotels/slug/${encodeURIComponent(slug)}`)
      .then((r) => {
        setData(r.data);
        setErr(null);
      })
      .catch(() => {
        setErr("Hotel not found.");
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
        <Link to="/hotels" className="mt-4 inline-block text-brand-accent">
          ← All hotels
        </Link>
      </div>
    );
  }

  const h = data.hotel;
  const hero = legacyMediaUrl("hotel", String(h.featured_image ?? ""));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        to="/hotels"
        className="text-sm font-medium text-brand-accent hover:underline"
      >
        ← All hotels
      </Link>

      {hero ? (
        <img
          src={hero}
          alt=""
          className="mt-6 aspect-[21/9] w-full rounded-2xl object-cover shadow-md"
        />
      ) : null}

      <h1 className="mt-8 text-3xl font-bold text-brand-navy">
        {String(h.hotelName)}
      </h1>
      <p className="mt-2 text-slate-600">
        {String(h.hotelCityName ?? "")}
        {h.hotelState ? `, ${String(h.hotelState)}` : ""} ·{" "}
        {String(h.hotelCatStar ?? "")}★
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
        {h.phoneNo ? (
          <a href={`tel:${h.phoneNo}`} className="text-brand-accent">
            {String(h.phoneNo)}
          </a>
        ) : null}
        {h.emailId ? (
          <a href={`mailto:${h.emailId}`} className="text-brand-accent">
            {String(h.emailId)}
          </a>
        ) : null}
      </div>

      <div
        className="mt-8 max-w-none space-y-3 text-slate-700 [&_li]:ml-4 [&_p]:mb-3"
        dangerouslySetInnerHTML={sanitizedHtml(String(h.hotelAbout ?? ""))}
      />

      {data.gallery.length > 0 ? (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-brand-navy">Gallery</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {data.gallery.map((g, idx) => {
              const url = legacyMediaUrl("hotel/gallery", g.image_file);
              return url ? (
                <img
                  key={`${g.image_file}-${idx}`}
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
        to="/contact"
        className="mt-10 inline-flex rounded-lg bg-brand-accent px-6 py-3 font-semibold text-brand-navy hover:bg-brand-accent-hover"
      >
        Enquire about this hotel
      </Link>
    </div>
  );
}
