import { useState, type FormEvent } from "react";
import { HeadphonesIcon, Send } from "lucide-react";
import { apiPost } from "@/lib/api";
import { usePageMeta } from "@/hooks/usePageMeta";

export function SupportTicketPage() {
  usePageMeta("Help & support | SBM Tour India");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setSending(true);
    try {
      await apiPost("/api/contact-support", {
        user_name: name,
        user_email: email,
        user_phone: phone || undefined,
        message: message || undefined,
      });
      setFeedback({ ok: true, text: "Ticket created. We'll get back to you soon." });
      setMessage("");
    } catch (err) {
      setFeedback({
        ok: false,
        text: err instanceof Error ? err.message : "Failed.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="border-b border-border bg-secondary/40 pb-12 pt-28">
        <div className="container mx-auto px-4 lg:px-8">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cta">
            <HeadphonesIcon className="h-3.5 w-3.5" /> 24/7 support
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold md:text-5xl">
            Help & support
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            For trip booking enquiries please use{" "}
            <a href="/plan-trip" className="text-primary hover:underline">
              Plan a trip
            </a>
            . This form is for general support tickets.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-12 lg:px-8">
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-card md:p-8"
        >
          <label className="block text-sm font-medium">
            Name *
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <label className="block text-sm font-medium">
            Email *
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <label className="block text-sm font-medium">
            Phone
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <label className="block text-sm font-medium">
            Message
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
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
                Submit ticket <Send className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );
}
