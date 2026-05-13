import { useState, type FormEvent } from "react";
import { Calendar, MapPin, Phone, Send, Sparkles, Users } from "lucide-react";
import { apiPost } from "@/lib/api";
import { usePageMeta } from "@/hooks/usePageMeta";

export function PlanTripPage() {
  usePageMeta(
    "Plan your trip | SBM Tour India",
    "Tell us your dream itinerary and we'll craft a custom plan within 24 hours."
  );
  const [destination, setDestination] = useState("");
  const [origin, setOrigin] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [durationDays, setDurationDays] = useState("7");
  const [numAdults, setNumAdults] = useState("2");
  const [additional, setAdditional] = useState("");
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

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
          customer_name: customerName || undefined,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          departure_date: departureDate || undefined,
          duration_days: Number(durationDays) || 7,
          num_adults: Number(numAdults) || 2,
          additional_requirements: additional || undefined,
          whatsapp_updates: whatsappUpdates ? "yes" : "no",
        }
      );
      setFeedback({
        ok: true,
        text: `Received! Reference: ${r.data.booking_id}. We will contact you shortly.`,
      });
    } catch (err) {
      setFeedback({
        ok: false,
        text: err instanceof Error ? err.message : "Failed to submit.",
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
            <Sparkles className="h-3.5 w-3.5" /> Custom itineraries
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold md:text-5xl">
            Plan your perfect trip
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Share your travel idea — our destination specialists will craft a custom itinerary at the best price, usually within 24 hours.
          </p>
        </div>
      </div>

      <div className="container mx-auto grid gap-10 px-4 py-12 lg:grid-cols-[1.1fr_1fr] lg:px-8">
        <div className="rounded-3xl gradient-ocean p-8 text-primary-foreground md:p-12">
          <h2 className="font-display text-3xl font-extrabold leading-tight md:text-4xl">
            Tailored just for you
          </h2>
          <p className="mt-3 text-primary-foreground/90">
            Whether it's a romantic honeymoon, a family adventure or a solo trek — we plan trips that fit your style and budget.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex items-start gap-2">
              ✓ Free, no-obligation quote
            </li>
            <li className="flex items-start gap-2">✓ Handcrafted by local experts</li>
            <li className="flex items-start gap-2">✓ Best price guarantee</li>
            <li className="flex items-start gap-2">✓ 24/7 trip support during travel</li>
          </ul>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-card md:p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              icon={MapPin}
              label="Destination *"
              value={destination}
              onChange={setDestination}
              required
              placeholder="Bali, Goa, Kerala…"
            />
            <Field
              icon={MapPin}
              label="Travelling from"
              value={origin}
              onChange={setOrigin}
              placeholder="Mumbai, Delhi…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              icon={Calendar}
              type="date"
              label="Departure"
              value={departureDate}
              onChange={setDepartureDate}
            />
            <Field
              label="Days"
              type="number"
              value={durationDays}
              onChange={setDurationDays}
            />
            <Field
              icon={Users}
              label="Adults"
              type="number"
              value={numAdults}
              onChange={setNumAdults}
            />
          </div>

          <Field
            label="Your name"
            value={customerName}
            onChange={setCustomerName}
            placeholder="Jane Doe"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Email *"
              type="email"
              value={customerEmail}
              onChange={setCustomerEmail}
              required
              placeholder="jane@example.com"
            />
            <Field
              icon={Phone}
              label="Phone / WhatsApp *"
              value={customerPhone}
              onChange={setCustomerPhone}
              required
              placeholder="+91 98765 43210"
            />
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">
              Notes
            </span>
            <textarea
              rows={4}
              value={additional}
              onChange={(e) => setAdditional(e.target.value)}
              placeholder="Budget, preferences, special requests…"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={whatsappUpdates}
              onChange={(e) => setWhatsappUpdates(e.target.checked)}
              className="h-4 w-4"
            />
            <span>Send me WhatsApp updates</span>
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
                Send request <Send className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );
}

function Field({
  icon: Icon,
  label,
  type = "text",
  value,
  onChange,
  required,
  placeholder,
}: {
  icon?: React.ComponentType<{ className?: string }>;
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
      <div className="relative mt-1">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        ) : null}
        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-border bg-background py-2 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 ${
            Icon ? "pl-9" : "pl-3"
          }`}
        />
      </div>
    </label>
  );
}
