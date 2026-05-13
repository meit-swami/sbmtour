import { useEffect, useState, type FormEvent } from "react";
import { Calendar, Mail, MapPin, Phone, Send, Sparkles, User, X } from "lucide-react";
import { apiPost } from "@/lib/api";

export function LeadFormPopup() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [destination, setDestination] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [travelers, setTravelers] = useState("2");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const KEY = "sbm_lead_popup_seen";
    if (sessionStorage.getItem(KEY)) return;
    const t = window.setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(KEY, "1");
    }, 3500);
    return () => window.clearTimeout(t);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setFeedback({ ok: false, text: "Name, email and phone are required." });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const extras = [
        travelDate ? `Travel date: ${travelDate}` : "",
        travelers ? `Travelers: ${travelers}` : "",
        message ? `Notes: ${message}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      await apiPost("/api/enquiries", {
        fullName: name,
        email,
        phone,
        destination: destination || undefined,
        requirement: extras || undefined,
      });
      setFeedback({
        ok: true,
        text: "Thanks! Our travel expert will reach out within 24 hours.",
      });
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
      window.setTimeout(() => setOpen(false), 1800);
    } catch (err) {
      setFeedback({
        ok: false,
        text: err instanceof Error ? err.message : "Could not send. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="relative grid w-full max-w-3xl overflow-hidden rounded-3xl bg-card shadow-card md:grid-cols-[0.9fr_1.1fr]">
        <button
          type="button"
          aria-label="Close"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 shadow-soft hover:bg-background"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="relative hidden md:block">
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80"
            alt="Beach"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 gradient-hero" />
          <div className="relative flex h-full flex-col justify-end p-8 text-white">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Free expert advice
            </span>
            <h3 className="mt-3 font-display text-3xl font-extrabold leading-tight">
              Get a custom trip plan in 24 hours
            </h3>
            <p className="mt-2 text-sm text-white/85">
              Tell us where you'd like to go and we'll craft a tailored itinerary at the best price.
            </p>
          </div>
        </div>
        <div className="max-h-[90vh] overflow-y-auto p-6 md:p-8">
          <h3 className="font-display text-2xl font-bold text-foreground">
            Get a free trip quote
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Crafted by local experts in under 24 hours.
          </p>
          <form onSubmit={onSubmit} className="mt-5 grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                icon={User}
                placeholder="Full name *"
                value={name}
                onChange={setName}
                required
              />
              <Field
                icon={Phone}
                placeholder="Phone *"
                value={phone}
                onChange={setPhone}
                required
              />
            </div>
            <Field
              icon={Mail}
              type="email"
              placeholder="Email *"
              value={email}
              onChange={setEmail}
              required
            />
            <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr_0.6fr]">
              <Field
                icon={MapPin}
                placeholder="Destination"
                value={destination}
                onChange={setDestination}
              />
              <Field
                icon={Calendar}
                type="date"
                placeholder=""
                value={travelDate}
                onChange={setTravelDate}
              />
              <input
                type="number"
                min={1}
                max={20}
                value={travelers}
                onChange={(e) => setTravelers(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Budget, preferences, special requests…"
              maxLength={500}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            {feedback ? (
              <p
                className={`text-sm ${
                  feedback.ok ? "text-forest" : "text-destructive"
                }`}
              >
                {feedback.text}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cta px-4 py-3 font-semibold text-cta-foreground shadow-cta transition hover:bg-cta/90 disabled:opacity-60"
            >
              {submitting ? "Sending…" : <><Send className="h-4 w-4" /> Get a free quote</>}
            </button>
            <p className="text-xs text-muted-foreground">
              By submitting you agree to be contacted by our travel experts. No spam, ever.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
  required,
}: {
  icon: React.ComponentType<{ className?: string }>;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}
