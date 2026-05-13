import { useEffect, useState } from "react";
import { Facebook, MessageCircle } from "lucide-react";
import { apiGet } from "@/lib/api";

type WebSettingsRow = {
  contact_number?: string | null;
  facebook_url?: string | null;
};

function whatsappHref(phone: string | null | undefined): string | null {
  if (!phone?.trim()) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const intl = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${intl}`;
}

function normalizeFacebookUrl(url: string | null | undefined): string | null {
  const u = url?.trim();
  if (!u) return null;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `https://${u}`;
}

export function WhatsAppFab() {
  const [wa, setWa] = useState<string | null>(null);
  const [fb, setFb] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ data: WebSettingsRow | null }>("/api/web-settings")
      .then((r) => {
        const row = r.data;
        setWa(whatsappHref(row?.contact_number ?? null));
        setFb(normalizeFacebookUrl(row?.facebook_url ?? null));
      })
      .catch(() => {
        setWa(null);
        setFb(null);
      });
  }, []);

  if (!wa && !fb) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-5 right-5 z-40 flex flex-col gap-3 md:bottom-6 md:right-6"
      aria-label="Quick contact"
    >
      {wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-cta transition-transform hover:scale-110"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-cta" />
        </a>
      ) : null}
      {fb ? (
        <a
          href={fb}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-lg transition-transform hover:scale-110"
        >
          <Facebook className="h-5 w-5" />
        </a>
      ) : null}
    </div>
  );
}
