import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, ChevronLeft, Globe } from "lucide-react";
import { apiGet } from "@/lib/api";
import { legacyMediaUrl } from "@/lib/media";
import { sanitizedHtml } from "@/lib/sanitizeHtml";
import { usePageMeta } from "@/hooks/usePageMeta";

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

  usePageMeta(
    data?.country
      ? `${data.country.country_name} | SBM Tour India`
      : "Country | SBM Tour India"
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
        <Link to="/countries" className="mt-4 inline-block font-semibold text-primary">
          ← All countries
        </Link>
      </div>
    );
  }

  const { country, destinations } = data;
  const hero = legacyMediaUrl("country", country.country_image);

  return (
    <>
      <section className="relative h-[55svh] min-h-[380px]">
        {hero ? (
          <img src={hero} alt={country.country_name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary">
            <Globe className="h-24 w-24 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 gradient-hero" />
        <div className="container relative mx-auto flex h-full flex-col justify-end px-4 pb-10 pt-24 text-white lg:px-8">
          <Link
            to="/countries"
            className="mb-4 inline-flex w-fit items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> All countries
          </Link>
          <h1 className="font-display text-4xl font-extrabold leading-tight md:text-6xl">
            {country.country_name}
          </h1>
        </div>
      </section>

      {country.product_features?.trim() ? (
        <section className="container mx-auto px-4 py-12 lg:px-8">
          <div
            className="prose prose-slate max-w-3xl text-foreground/85 [&_li]:ml-4 [&_p]:mb-3 [&_ul]:list-disc"
            dangerouslySetInnerHTML={sanitizedHtml(country.product_features)}
          />
        </section>
      ) : null}

      {destinations.length > 0 ? (
        <section className="container mx-auto px-4 pb-16 lg:px-8">
          <h2 className="font-display text-2xl font-bold">Destinations in {country.country_name}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((d) => {
              const thumb = legacyMediaUrl("destination", d.destination_image);
              return (
                <Link
                  key={d.id}
                  to={`/destinations/${d.destination_slug}`}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition hover:border-primary hover:shadow-soft"
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 shrink-0 rounded-xl bg-secondary" />
                  )}
                  <div>
                    <p className="font-display font-semibold">{d.destination_name}</p>
                    <p className="text-xs text-muted-foreground">{d.destination_type}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="container mx-auto px-4 pb-20 lg:px-8">
        <div className="flex flex-wrap gap-3">
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
