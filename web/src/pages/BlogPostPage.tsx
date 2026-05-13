import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { apiGet } from "@/lib/api";
import { legacyMediaUrl } from "@/lib/media";
import { sanitizedHtml } from "@/lib/sanitizeHtml";
import { usePageMeta } from "@/hooks/usePageMeta";

type BlogPost = {
  id: number;
  blog_name: string;
  blogPlace: string;
  blog_slug: string;
  blogDate: string;
  blogDesc: string;
  blog_image: string;
};

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    apiGet<{ data: BlogPost }>(`/api/blogs/slug/${encodeURIComponent(slug)}`)
      .then((r) => {
        setPost(r.data);
        setErr(null);
      })
      .catch(() => {
        setErr("Post not found.");
        setPost(null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  usePageMeta(
    post ? `${post.blog_name || post.blogPlace || "Blog"} | SBM Tour India` : "Blog | SBM Tour India"
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 pb-24 pt-28 lg:px-8">
        <div className="h-[420px] animate-pulse rounded-3xl bg-secondary" />
      </div>
    );
  }

  if (err || !post) {
    return (
      <div className="container mx-auto px-4 pb-24 pt-28 text-center lg:px-8">
        <p className="text-muted-foreground">{err}</p>
        <Link to="/blog" className="mt-4 inline-block font-semibold text-primary">
          ← All stories
        </Link>
      </div>
    );
  }

  const img = legacyMediaUrl("blogs", post.blog_image);

  return (
    <article className="container mx-auto px-4 py-12 pt-28 lg:px-8">
      <Link
        to="/blog"
        className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft className="h-4 w-4" /> All stories
      </Link>

      <div className="mx-auto mt-8 max-w-3xl">
        {post.blogPlace ? (
          <p className="text-sm font-semibold uppercase tracking-wider text-cta">
            {post.blogPlace}
          </p>
        ) : null}
        <h1 className="mt-2 font-display text-3xl font-bold leading-tight md:text-5xl">
          {post.blog_name || post.blogPlace || "Blog"}
        </h1>
        <time className="mt-3 block text-sm text-muted-foreground">{post.blogDate}</time>

        {img ? (
          <img
            src={img}
            alt=""
            className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover shadow-card"
          />
        ) : null}

        <div
          className="prose prose-slate mt-8 max-w-none text-foreground/85 [&_a]:text-primary [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_li]:ml-4 [&_p]:mb-4 [&_ul]:list-disc"
          dangerouslySetInnerHTML={sanitizedHtml(post.blogDesc)}
        />
      </div>
    </article>
  );
}
