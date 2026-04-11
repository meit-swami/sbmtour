import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiGet } from "@/lib/api";
import { legacyMediaUrl } from "@/lib/media";
import { sanitizedHtml } from "@/lib/sanitizeHtml";

type Country = {
  id: number;
  country_name: string;
  country_slug: string;
  country_image: string;
  product_features: string;
};

type DestSummary = {
  id: number;
  destination_name: string;
  destination_slug: string;
  destination_type: string;
  destination_image: string;
};

type Response = {
  data: { country: Country; destinations: DestSummary[] };
};

export function CountryDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<Response["data"] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    apiGet<Response>(`/api/countries/slug/${encodeURIComponent(slug)}`)
      .then((r) => {
        setData(r.data);
        setErr(null);
      })
      .catch(() => {
        setErr("Country not found.");
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
        <Link to="/countries" className="mt-4 inline-block text-brand-accent">
          ← All countries
        </Link>
      </div>
    );
  }

  const { country, destinations } = data;
  const hero = legacyMediaUrl("country", country.country_image);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        to="/countries"
        className="text-sm font-medium text-brand-accent hover:underline"
      >
        ← All countries
      </Link>

      {hero ? (
        <img
          src={hero}
          alt=""
          className="mt-6 aspect-[21/9] w-full rounded-2xl object-cover shadow-md"
        />
      ) : null}

      <h1 className="mt-8 text-3xl font-bold text-brand-navy">
        {country.country_name}
      </h1>

      {country.product_features?.trim() ? (
        <div
          className="mt-8 max-w-none space-y-3 text-slate-700 [&_li]:ml-4 [&_p]:mb-3 [&_ul]:list-disc"
          dangerouslySetInnerHTML={sanitizedHtml(country.product_features)}
        />
      ) : (
        <p className="mt-6 text-slate-600">
          Browse destinations and packages for this country below.
        </p>
      )}

      {destinations.length > 0 ? (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-brand-navy">Destinations</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {destinations.map((d) => {
              const thumb = legacyMediaUrl("destination", d.destination_image);
              return (
              <li key={d.id}>
                <Link
                  to={`/destinations/${d.destination_slug}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-brand-accent"
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-slate-100" />
                  )}
                  <div>
                    <p className="font-medium text-brand-navy">
                      {d.destination_name}
                    </p>
                    <p className="text-xs text-slate-500">{d.destination_type}</p>
                  </div>
                </Link>
              </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          to={`/packages`}
          className="inline-flex rounded-lg bg-brand-accent px-6 py-3 font-semibold text-brand-navy hover:bg-brand-accent-hover"
        >
          View packages
        </Link>
        <Link
          to="/destinations"
          className="inline-flex rounded-lg border border-slate-300 px-6 py-3 font-semibold text-brand-navy hover:bg-slate-50"
        >
          All destinations
        </Link>
      </div>
    </div>
  );
}
