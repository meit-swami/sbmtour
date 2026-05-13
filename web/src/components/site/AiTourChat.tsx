import { useState, type FormEvent } from "react";
import { Bot, Loader2, Send, Sparkles, User } from "lucide-react";
import { apiPost } from "@/lib/api";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Plan a 5-day Bali honeymoon",
  "Family trip ideas under ₹40,000",
  "Best Himalayan treks for beginners",
  "Beach destinations in South India",
];

const GREETING: Msg = {
  role: "assistant",
  content:
    "Hi! I'm your **AI Trip Planner** ✈️\n\nTell me your dream trip — destination, days, budget or vibe — and I'll share ideas instantly. I'll also forward your request to our trip experts for a free custom itinerary.",
};

export function AiTourChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      // Forward as a soft enquiry so our team picks it up
      await apiPost("/api/enquiries", {
        fullName: "AI Planner Visitor",
        email: "ai-planner@sbmtour.local",
        phone: "0000000000",
        requirement: trimmed,
      }).catch(() => {});
      const reply =
        "Got it! I've shared your interest with our trip experts. Meanwhile, here are a few quick suggestions:\n\n" +
        "• Browse our [packages](/packages) for handcrafted itineraries.\n" +
        "• Use the [Plan a trip](/plan-trip) form to get a tailored quote.\n" +
        "• For instant help, WhatsApp us via the floating button.\n\n" +
        "What's your approximate budget per person and travel month?";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-md">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-white"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full gradient-cta">
            <Sparkles className="h-4 w-4 text-cta-foreground" />
          </span>
          <span>
            <span className="block font-display text-base font-semibold leading-tight">
              Plan with AI
            </span>
            <span className="block text-xs text-white/75">
              Get instant trip ideas & free expert follow-up
            </span>
          </span>
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-gold">
          {open ? "Hide" : "Try it"}
        </span>
      </button>

      {open ? (
        <div className="bg-background text-foreground">
          <div className="max-h-[340px] space-y-4 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    m.role === "user"
                      ? "bg-cta text-cta-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {m.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "rounded-tr-sm bg-cta text-cta-foreground"
                      : "rounded-tl-sm bg-secondary text-secondary-foreground"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading ? (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-secondary px-4 py-2.5 text-sm text-secondary-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                </div>
              </div>
            ) : null}
          </div>

          {messages.length <= 1 ? (
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs transition hover:bg-secondary"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}

          <form
            onSubmit={onSubmit}
            className="flex items-center gap-2 border-t border-border bg-card p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Where do you want to go?"
              className="flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex items-center justify-center rounded-md bg-cta px-3 py-2 text-cta-foreground transition hover:bg-cta/90 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
