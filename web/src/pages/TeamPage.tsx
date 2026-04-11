import { useEffect, useState } from "react";
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

  useEffect(() => {
    apiGet<{ data: Member[] }>("/api/team")
      .then((r) => setRows(r.data))
      .catch(() => setErr("Could not load team."));
  }, []);

  if (err) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-600">
        {err}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold text-brand-navy">Our team</h1>
      <p className="mt-2 text-slate-600">
        People behind SBM Tour India — from the database-driven CMS.
      </p>
      <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((m) => {
          const img = legacyMediaUrl("team", m.person_image);
          return (
            <article
              key={m.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              {img ? (
                <img src={img} alt="" className="h-48 w-full object-cover" />
              ) : (
                <div className="flex h-48 items-center justify-center bg-slate-100 text-slate-400">
                  No photo
                </div>
              )}
              <div className="p-4">
                <h2 className="font-semibold text-brand-navy">{m.person_name}</h2>
                <p className="text-sm text-brand-accent">{m.person_pose}</p>
                <div
                  className="mt-3 text-sm text-slate-600 [&_p]:mb-2"
                  dangerouslySetInnerHTML={sanitizedHtml(m.personDesc)}
                />
              </div>
            </article>
          );
        })}
      </div>
      {rows.length === 0 && !err ? (
        <p className="mt-12 text-center text-slate-500">No team members yet.</p>
      ) : null}
    </div>
  );
}
