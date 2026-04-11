import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "@/lib/api";
import { sanitizedHtml } from "@/lib/sanitizeHtml";
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

  useEffect(() => {
    apiGet<{ data: Faq[] }>("/api/faqs?type=faq").then((r) => setRows(r.data));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-brand-navy">FAQs</h1>
      <p className="mt-2 text-slate-600">
        Database-driven questions from <code className="text-xs">tbl_faq</code>
        . For static CMS FAQ content see also{" "}
        <Link to="/faq" className="text-brand-accent hover:underline">
          /faq
        </Link>
        .
      </p>
      <div className="mt-10 space-y-8">
        {rows.map((f) => (
          <section key={f.id} className="border-b border-slate-100 pb-8">
            <h2 className="text-lg font-semibold text-brand-navy">
              {f.faq_question}
            </h2>
            <div
              className="mt-3 text-sm text-slate-700"
              dangerouslySetInnerHTML={sanitizedHtml(f.faq_answer)}
            />
          </section>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="mt-8 text-slate-500">No FAQ rows with type “faq”.</p>
      ) : null}
    </div>
  );
}
