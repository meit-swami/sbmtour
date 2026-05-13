import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { apiGet } from "@/lib/api";
import { legacyMediaUrl } from "@/lib/media";
import { sanitizedHtml } from "@/lib/sanitizeHtml";
import { usePageMeta } from "@/hooks/usePageMeta";

type Member = {
  id: number;
  person_name: string;
  person_pose: string;
  personDesc: string;
  person_image: string;
};

export function TeamPage() {
  usePageMeta("Our team | SBM Tour India");
  const [rows, setRows] = useState<Member[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ data: Member[] }>("/api/team")
      .then((r) => setRows(r.data))
      .catch(() => setErr("Could not load team."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="border-b border-border bg-secondary/40 pb-12 pt-28">
        <div className="container mx-auto px-4 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-cta">
            Meet the team
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold md:text-5xl">Our experts</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            The people behind SBM Tour India — destination specialists, support heroes and trip designers.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 lg:px-8">
        {err ? (
          <p className="py-12 text-center text-muted-foreground">{err}</p>
        ) : loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl border border-border bg-card"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No team members yet.</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((m) => {
              const img = legacyMediaUrl("team", m.person_image);
              return (
                <article
                  key={m.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft hover-lift"
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    {img ? (
                      <img src={img} alt={m.person_name} className="img-zoom h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Users className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h2 className="font-display text-lg font-semibold">{m.person_name}</h2>
                    <p className="text-sm font-semibold text-cta">{m.person_pose}</p>
                    <div
                      className="mt-3 text-sm text-muted-foreground [&_p]:mb-2"
                      dangerouslySetInnerHTML={sanitizedHtml(m.personDesc)}
                    />
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
