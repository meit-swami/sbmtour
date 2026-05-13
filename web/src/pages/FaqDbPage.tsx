import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, HelpCircle } from "lucide-react";
import { apiGet } from "@/lib/api";
import { sanitizedHtml } from "@/lib/sanitizeHtml";
import { cn } from "@/lib/utils";
import { usePageMeta } from "@/hooks/usePageMeta";

type Faq = {
  id: number;
  faq_question: string;
  faq_answer: string;
  type: string;
};

export function FaqDbPage() {
  usePageMeta("FAQs | SBM Tour India");
  const [rows, setRows] = useState<Faq[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ data: Faq[] }>("/api/faqs?type=faq")
      .then((r) => {
        setRows(r.data);
        setOpenId(r.data[0]?.id ?? null);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="border-b border-border bg-secondary/40 pb-12 pt-28">
        <div className="container mx-auto px-4 lg:px-8">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cta">
            <HelpCircle className="h-3.5 w-3.5" /> FAQs
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold md:text-5xl">
            Frequently asked questions
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Quick answers to common questions. For more, see our{" "}
            <Link to="/faq" className="text-primary hover:underline">
              full FAQ page
            </Link>{" "}
            or{" "}
            <Link to="/contact" className="text-primary hover:underline">
              contact us
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-10 lg:px-8">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-xl border border-border bg-card"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No FAQs available.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((f) => {
              const open = openId === f.id;
              return (
                <div
                  key={f.id}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : f.id)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
                  >
                    <span className="font-display font-semibold">{f.faq_question}</span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                        open && "rotate-180"
                      )}
                    />
                  </button>
                  {open ? (
                    <div
                      className="border-t border-border px-4 py-4 text-sm leading-relaxed text-muted-foreground [&_p]:mb-2"
                      dangerouslySetInnerHTML={sanitizedHtml(f.faq_answer)}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
