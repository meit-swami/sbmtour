import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { sanitizedHtml } from "@/lib/sanitizeHtml";
import { usePageMeta } from "@/hooks/usePageMeta";

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

  const title = def.titleKey
    ? String(row?.[def.titleKey] ?? "").trim() || def.defaultTitle
    : def.defaultTitle;

  usePageMeta(`${title} | SBM Tour India`);

  if (err) {
    return (
      <div className="container mx-auto px-4 py-16 pt-28 text-center text-muted-foreground lg:px-8">
        <p>{err}</p>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="container mx-auto px-4 py-16 pt-28 lg:px-8">
        <div className="mx-auto h-96 max-w-3xl animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }

  const status = String(row[def.statusKey] ?? "");
  if (!isPublished(status)) {
    return (
      <div className="container mx-auto px-4 py-16 pt-28 text-center lg:px-8">
        <h1 className="font-display text-2xl font-semibold">{def.defaultTitle}</h1>
        <p className="mt-4 text-muted-foreground">
          This page is not available at the moment.
        </p>
      </div>
    );
  }

  const html = String(row[def.contentKey] ?? "");

  return (
    <>
      <div className="border-b border-border bg-secondary/40 pb-12 pt-28">
        <div className="container mx-auto px-4 lg:px-8">
          <h1 className="font-display text-3xl font-bold md:text-5xl">{title}</h1>
        </div>
      </div>

      <article className="container mx-auto max-w-3xl px-4 py-12 lg:px-8">
        <div
          className="prose prose-slate max-w-none text-foreground/85 [&_a]:text-primary [&_h1]:mb-3 [&_h1]:font-display [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-4 [&_p]:mb-3 [&_ul]:list-disc"
          dangerouslySetInnerHTML={sanitizedHtml(html)}
        />
      </article>
    </>
  );
}
