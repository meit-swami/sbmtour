import { useState, type FormEvent } from "react";
import { apiPost } from "@/lib/api";
import { usePageMeta } from "@/hooks/usePageMeta";

export function SupportTicketPage() {
  usePageMeta("Help & support | SBM Tour India");
  const [user_name, setUserName] = useState("");
  const [user_email, setUserEmail] = useState("");
  const [user_phone, setUserPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setSending(true);
    try {
      await apiPost("/api/contact-support", {
        user_name,
        user_email,
        user_phone: user_phone || undefined,
        message: message || undefined,
      });
      setFeedback({ ok: true, text: "Ticket created. We’ll get back to you soon." });
      setMessage("");
    } catch (err) {
      setFeedback({
        ok: false,
        text: err instanceof Error ? err.message : "Failed",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-3xl font-bold text-brand-navy">Help &amp; support</h1>
      <p className="mt-2 text-slate-600">
        Short support ticket — separate from the main trip enquiry form.
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Name *
          <input
            required
            value={user_name}
            onChange={(e) => setUserName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Email *
          <input
            required
            type="email"
            value={user_email}
            onChange={(e) => setUserEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Phone
          <input
            value={user_phone}
            onChange={(e) => setUserPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Message
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        {feedback ? (
          <p
            className={
              feedback.ok ? "text-sm text-emerald-700" : "text-sm text-rose-600"
            }
          >
            {feedback.text}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={sending}
          className="rounded-xl bg-brand-accent px-6 py-3 text-sm font-semibold text-white hover:bg-brand-accent-hover disabled:opacity-60"
        >
          {sending ? "Sending…" : "Submit"}
        </button>
      </form>
    </div>
  );
}
