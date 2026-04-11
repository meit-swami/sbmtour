import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { sanitizedHtml } from "@/lib/sanitizeHtml";

type WebSettingsRow = Record<string, string | null | undefined>;

const PAGE_DEF = {
  about: {
    titleKey: "about_page_title",
    contentKey: "about_content",
    statusKey: "about_status",
    defaultTitle: "About us",
  },
  faq: {
    titleKey: null as null,
    contentKey: "faq_content",
    statusKey: "faq_status",
    defaultTitle: "FAQ",
  },
  privacy: {
    titleKey: "privacy_page_title",
    contentKey: "privacy_content",
    statusKey: "privacy_page_status",
    defaultTitle: "Privacy policy",
  },
  terms: {
    titleKey: "terms_of_use_page_title",
    contentKey: "terms_of_use_content",
    statusKey: "terms_of_use_page_status",
    defaultTitle: "Terms of use",
  },
  "why-us": {
    titleKey: "why_irh_title",
    contentKey: "why_irh_content",
    statusKey: "why_irh_status",
    defaultTitle: "Why book with us",
  },
  refund: {
    titleKey: "refund_return_policy_page_title",
    contentKey: "refund_return_policy",
    statusKey: "refund_return_policy_status",
    defaultTitle: "Refund & return policy",
  },
  cancellation: {
    titleKey: "cancellation_page_title",
    contentKey: "cancellation_content",
    statusKey: "cancellation_page_status",
    defaultTitle: "Cancellation policy",
  },
  payments: {
    titleKey: "payments_page_title",
    contentKey: "payments_content",
    statusKey: "payments_page_status",
    defaultTitle: "Payments",
  },
} as const;

export type CmsPageId = keyof typeof PAGE_DEF;

function isPublished(status: string | null | undefined): boolean {
  return String(status ?? "").toLowerCase() === "true";
}

export function CmsStaticPage({ page }: { page: CmsPageId }) {
  const def = PAGE_DEF[page];
  const [row, setRow] = useState<WebSettingsRow | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ data: WebSettingsRow }>("/api/web-settings")
      .then((r) => {
        setRow(r.data ?? null);
        setErr(null);
      })
      .catch(() => {
        setRow(null);
        setErr("Could not load page content.");
      });
  }, []);

  if (err) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-600">
        <p>{err}</p>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-500">
        Loading…
      </div>
    );
  }

  const status = String(row[def.statusKey] ?? "");
  if (!isPublished(status)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-brand-navy">
          {def.defaultTitle}
        </h1>
        <p className="mt-4 text-slate-600">
          This page is not available at the moment.
        </p>
      </div>
    );
  }

  const title = def.titleKey
    ? String(row[def.titleKey] ?? "").trim() || def.defaultTitle
    : def.defaultTitle;
  const html = String(row[def.contentKey] ?? "");

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-brand-navy">{title}</h1>
      <div
        className="mt-8 max-w-none space-y-3 text-slate-700 [&_a]:text-brand-accent [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-brand-navy [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-4 [&_p]:mb-3 [&_ul]:list-disc"
        dangerouslySetInnerHTML={sanitizedHtml(html)}
      />
    </article>
  );
}
