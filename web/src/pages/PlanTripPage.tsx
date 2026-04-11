import { useState, type FormEvent } from "react";
import { apiPost } from "@/lib/api";
import { usePageMeta } from "@/hooks/usePageMeta";

export function PlanTripPage() {
  usePageMeta("Plan your trip | SBM Tour India");
  const [destination, setDestination] = useState("");
  const [origin, setOrigin] = useState("");
  const [customer_name, setCustomerName] = useState("");
  const [customer_email, setCustomerEmail] = useState("");
  const [customer_phone, setCustomerPhone] = useState("");
  const [departure_date, setDepartureDate] = useState("");
  const [duration_days, setDurationDays] = useState("7");
  const [num_adults, setNumAdults] = useState("2");
  const [additional_requirements, setAdditional] = useState("");
  const [whatsapp_updates, setWhatsapp] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setSending(true);
    try {
      const r = await apiPost<{ data: { booking_id: string } }>(
        "/api/booking-requests",
        {
          destination,
          origin: origin || destination,
          customer_name: customer_name || undefined,
          customer_email,
          customer_phone,
          departure_date: departure_date || undefined,
          duration_days: Number(duration_days) || 7,
          num_adults: Number(num_adults) || 2,
          additional_requirements: additional_requirements || undefined,
          whatsapp_updates: whatsapp_updates ? "yes" : "no",
        }
      );
      setFeedback({
        ok: true,
        text: `Received. Reference: ${r.data.booking_id}. We will contact you shortly.`,
      });
    } catch (err) {
      setFeedback({
        ok: false,
        text: err instanceof Error ? err.message : "Failed to submit",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-3xl font-bold text-brand-navy">Plan your trip</h1>
      <p className="mt-2 text-slate-600">
        Structured booking request — stored in our system for faster follow-up.
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Where do you want to go? *
          <input
            required
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Travelling from (optional)
          <input
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Departure date
            <input
              type="date"
              value={departure_date}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Duration (days)
            <input
              type="number"
              min={1}
              value={duration_days}
              onChange={(e) => setDurationDays(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Adults
          <input
            type="number"
            min={1}
            value={num_adults}
            onChange={(e) => setNumAdults(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Your name
          <input
            value={customer_name}
            onChange={(e) => setCustomerName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Email *
          <input
            required
            type="email"
            value={customer_email}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Phone / WhatsApp *
          <input
            required
            value={customer_phone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Notes
          <textarea
            value={additional_requirements}
            onChange={(e) => setAdditional(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={whatsapp_updates}
            onChange={(e) => setWhatsapp(e.target.checked)}
          />
          WhatsApp updates OK
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
          {sending ? "Sending…" : "Submit request"}
        </button>
      </form>
    </div>
  );
}
