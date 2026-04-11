import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiGet } from "@/lib/api";
import { legacyMediaUrl } from "@/lib/media";
import { sanitizedHtml } from "@/lib/sanitizeHtml";

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

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center text-slate-600">
        Loading…
      </div>
    );
  }

  if (err || !post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="text-slate-600">{err}</p>
        <Link to="/blog" className="mt-4 inline-block text-brand-accent">
          ← All stories
        </Link>
      </div>
    );
  }

  const img = legacyMediaUrl("blogs", post.blog_image);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <Link
        to="/blog"
        className="text-sm font-medium text-brand-accent hover:underline"
      >
        ← All stories
      </Link>

      <p className="mt-6 text-sm text-brand-accent">{post.blogPlace}</p>
      <h1 className="mt-2 text-3xl font-bold text-brand-navy">
        {post.blog_name || post.blogPlace || "Blog"}
      </h1>
      <time className="mt-2 block text-sm text-slate-500">{post.blogDate}</time>

      {img ? (
        <img
          src={img}
          alt=""
          className="mt-8 w-full rounded-2xl object-cover shadow-md"
        />
      ) : null}

      <div
        className="mt-8 max-w-none space-y-3 text-slate-700 [&_li]:ml-4 [&_p]:mb-3 [&_ul]:list-disc"
        dangerouslySetInnerHTML={sanitizedHtml(post.blogDesc)}
      />
    </article>
  );
}
