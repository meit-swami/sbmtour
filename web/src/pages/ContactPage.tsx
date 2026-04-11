import { useEffect, useState, type FormEvent } from "react";
import { apiGet, apiPost } from "@/lib/api";
type WebSettings = {
  contact_page_title?: string;
  address?: string;
  contact_number?: string;
  contact_email?: string;
  map_embed_url?: string | null;
};

export function ContactPage() {
  const [ws, setWs] = useState<WebSettings | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(
    null
  );

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
      setFeedback({ ok: true, text: "Message sent. We’ll reply soon." });
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

  const mapUrl = ws?.map_embed_url?.trim();
  const showIframe =
    mapUrl &&
    (mapUrl.startsWith("https://www.google.com/maps/embed") ||
      mapUrl.includes("google.com/maps"));

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold text-brand-navy">
        {ws?.contact_page_title?.trim() || "Contact us"}
      </h1>
      <p className="mt-2 text-slate-600">
        Reach us directly or send a quick message — enquiries are stored in{" "}
        <code className="text-xs">contactform</code>.
      </p>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-brand-navy">Details</h2>
          <ul className="mt-4 space-y-3 text-slate-700">
            {ws?.address ? <li>{ws.address}</li> : null}
            {ws?.contact_number ? (
              <li>
                <a
                  href={`tel:${ws.contact_number}`}
                  className="text-brand-accent hover:underline"
                >
                  {ws.contact_number}
                </a>
              </li>
            ) : null}
            {ws?.contact_email ? (
              <li>
                <a
                  href={`mailto:${ws.contact_email}`}
                  className="text-brand-accent hover:underline"
                >
                  {ws.contact_email}
                </a>
              </li>
            ) : null}
          </ul>

          {showIframe ? (
            <div className="mt-6 aspect-video w-full overflow-hidden rounded-xl border border-slate-200">
              <iframe
                title="Map"
                src={mapUrl}
                className="h-full w-full border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : mapUrl ? (
            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-block text-sm font-medium text-brand-accent hover:underline"
            >
              Open map
            </a>
          ) : null}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-navy">Message</h2>
          {feedback ? (
            <p
              className={`mt-2 text-sm ${
                feedback.ok ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {feedback.text}
            </p>
          ) : null}
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="How can we help?"
              rows={4}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={sending}
              className="rounded-lg bg-brand-accent px-6 py-2.5 text-sm font-semibold text-brand-navy hover:bg-brand-accent-hover disabled:opacity-60"
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
