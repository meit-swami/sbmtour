import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { apiGet } from "@/lib/api";
import { legacyMediaUrl } from "@/lib/media";
import { stripHtml } from "@/lib/text";
import { usePageMeta } from "@/hooks/usePageMeta";

type BlogRow = {
  id: number;
  blog_name: string;
  blogPlace: string;
  blog_slug: string;
  blogDate: string;
  blogDesc: string;
  blog_image: string;
};

export function BlogListPage() {
  usePageMeta(
    "Blog | SBM Tour India",
    "Travel tips, trip reports and curated guides from our travel experts."
  );
  const [rows, setRows] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ data: BlogRow[] }>("/api/blogs?limit=24")
      .then((r) => setRows(r.data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="border-b border-border bg-secondary/40 pb-12 pt-28">
        <div className="container mx-auto px-4 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-cta">
            From the journal
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold md:text-5xl">
            Travel stories
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Tips, trip reports and inspiration from travellers like you.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 lg:px-8">
        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl border border-border bg-card"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No stories yet.</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((b) => {
              const cover = legacyMediaUrl("blogs", b.blog_image);
              return (
                <article
                  key={b.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft hover-lift"
                >
                  <Link to={`/blog/${b.blog_slug}`} className="group block">
                    <div className="aspect-[16/10] overflow-hidden bg-muted">
                      {cover ? (
                        <img
                          src={cover}
                          alt=""
                          className="img-zoom h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                  </Link>
                  <div className="p-5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <time>{b.blogDate}</time>
                      {b.blogPlace ? (
                        <span className="text-cta">{b.blogPlace}</span>
                      ) : null}
                    </div>
                    <Link to={`/blog/${b.blog_slug}`}>
                      <h2 className="mt-2 font-display text-lg font-semibold transition-colors hover:text-primary">
                        {b.blog_name || b.blogPlace || "Story"}
                      </h2>
                    </Link>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {stripHtml(b.blogDesc, 160)}
                    </p>
                    <Link
                      to={`/blog/${b.blog_slug}`}
                      className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-cta"
                    >
                      Read more <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
