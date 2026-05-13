import { useEffect, useState, type FormEvent } from "react";
import { Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { sanitizedFooterHtml } from "@/lib/sanitizeHtml";
import { usePageMeta } from "@/hooks/usePageMeta";

type WebSettings = {
  contact_page_title?: string;
  address?: string;
  contact_number?: string;
  contact_email?: string;
  map_embed_url?: string | null;
};

export function ContactPage() {
  usePageMeta("Contact | SBM Tour India", "Talk to our travel specialists.");
  const [ws, setWs] = useState<WebSettings | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    apiGet<{ data: WebSettings }>("/api/web-settings")
      .then((r) => setWs(r.data))
      .catch(() => setWs(null));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setSending(true);
    try {
      await apiPost("/api/enquiries", {
        fullName: name,
        email,
        phone,
        requirement: msg || undefined,
        destination: "Contact page",
      });
      setFeedback({ ok: true, text: "Message sent. We'll reply soon." });
      setName("");
      setEmail("");
      setPhone("");
      setMsg("");
    } catch (err) {
      setFeedback({
        ok: false,
        text: err instanceof Error ? err.message : "Failed to send",
      });
    } finally {
      setSending(false);
    }
  }

  const whatsappHref = ws?.contact_number
    ? `https://wa.me/${ws.contact_number.replace(/\D/g, "").replace(/^(?!91)/, "91")}`
    : null;

  return (
    <>
      <div className="border-b border-border bg-secondary/40 pb-12 pt-28">
        <div className="container mx-auto px-4 lg:px-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-cta">
            Get in touch
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold md:text-5xl">
            {ws?.contact_page_title?.trim() || "Plan your dream trip with us"}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Tell us where you'd like to go and we'll craft a custom itinerary in 24 hours. No obligation, no fees.
          </p>
        </div>
      </div>

      <div className="container mx-auto grid items-start gap-12 px-4 py-12 lg:grid-cols-2 lg:px-8">
        <div>
          <div className="space-y-4">
            {ws?.address ? (
              <ContactRow icon={MapPin} title="Office" value={ws.address} />
            ) : null}
            {ws?.contact_number ? (
              <ContactRow
                icon={Phone}
                title="Call"
                value={ws.contact_number}
                href={`tel:${ws.contact_number}`}
              />
            ) : null}
            {ws?.contact_email ? (
              <ContactRow
                icon={Mail}
                title="Email"
                value={ws.contact_email}
                href={`mailto:${ws.contact_email}`}
              />
            ) : null}
          </div>

          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-3 font-semibold text-forest-foreground shadow-cta transition hover:scale-[1.02]"
            >
              <MessageCircle className="h-5 w-5" /> WhatsApp us instantly
            </a>
          ) : null}

          {ws?.map_embed_url ? (
            <div
              className="mt-8 overflow-hidden rounded-2xl border border-border shadow-soft [&_iframe]:aspect-[16/9] [&_iframe]:w-full"
              dangerouslySetInnerHTML={sanitizedFooterHtml(String(ws.map_embed_url))}
            />
          ) : null}
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card md:p-8"
        >
          <h2 className="font-display text-xl font-semibold">Send an enquiry</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Name"
              value={name}
              onChange={setName}
              required
              placeholder="Jane Doe"
            />
            <Field
              label="Phone"
              value={phone}
              onChange={setPhone}
              required
              placeholder="+91 98765 43210"
            />
          </div>
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            required
            placeholder="jane@example.com"
          />
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">
              Tell us about your trip
            </span>
            <textarea
              rows={4}
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Travel dates, group size, interests…"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          {feedback ? (
            <p className={feedback.ok ? "text-sm text-forest" : "text-sm text-destructive"}>
              {feedback.text}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={sending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cta px-4 py-3 font-semibold text-cta-foreground shadow-cta hover:bg-cta/90 disabled:opacity-60"
          >
            {sending ? (
              "Sending…"
            ) : (
              <>
                Send enquiry <Send className="h-4 w-4" />
              </>
            )}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            We respond within 4 hours during business days.
          </p>
        </form>
      </div>
    </>
  );
}

function ContactRow({
  icon: Icon,
  title,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block transition hover:opacity-80">
      {inner}
    </a>
  ) : (
    inner
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  );
}
