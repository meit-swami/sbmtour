import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "@/lib/api";
import { legacyMediaUrl } from "@/lib/media";
import { stripHtml } from "@/lib/text";

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
  const [rows, setRows] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ data: BlogRow[] }>("/api/blogs?limit=24")
      .then((r) => setRows(r.data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-brand-navy">Travel stories</h1>
      <p className="mt-2 text-slate-600">
        Tips and trip reports from <code className="text-xs">tbl_blog</code>.
      </p>

      <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="col-span-full text-center text-slate-500">Loading…</p>
        ) : (
          rows.map((b) => {
            const cover = legacyMediaUrl("blogs", b.blog_image);
            return (
            <article
              key={b.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <Link to={`/blog/${b.blog_slug}`}>
                {cover ? (
                  <img
                    src={cover}
                    alt=""
                    className="aspect-video w-full object-cover"
                  />
                ) : (
                  <div className="aspect-video bg-slate-100" />
                )}
              </Link>
              <div className="p-4">
                <time className="text-xs text-slate-500">{b.blogDate}</time>
                <Link to={`/blog/${b.blog_slug}`}>
                  <h2 className="mt-1 text-lg font-semibold text-brand-navy hover:text-brand-accent">
                    {b.blog_name || b.blogPlace || "Story"}
                  </h2>
                </Link>
                {b.blogPlace ? (
                  <p className="text-xs text-brand-accent">{b.blogPlace}</p>
                ) : null}
                <p className="mt-2 text-sm text-slate-600 line-clamp-3">
                  {stripHtml(b.blogDesc, 160)}
                </p>
                <Link
                  to={`/blog/${b.blog_slug}`}
                  className="mt-3 inline-block text-sm font-semibold text-brand-accent"
                >
                  Read more
                </Link>
              </div>
            </article>
            );
          })
        )}
      </div>
    </div>
  );
}
