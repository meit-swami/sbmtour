import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Search, Users } from "lucide-react";

export function SearchBar({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [date, setDate] = useState("");
  const [travelers, setTravelers] = useState("2");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (date) params.set("date", date);
    if (travelers && travelers !== "2") params.set("travelers", travelers);
    const qs = params.toString();
    navigate(qs ? `/packages?${qs}` : "/packages");
  };

  return (
    <form
      onSubmit={submit}
      className={`grid grid-cols-1 gap-2 rounded-2xl border border-border bg-background/95 p-2 shadow-card backdrop-blur md:grid-cols-[1.4fr_1fr_0.9fr_auto] ${
        compact ? "" : "w-full max-w-4xl"
      }`}
    >
      <label className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-secondary/60">
        <MapPin className="h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Where
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Bali, Goa, Kerala…"
            className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      </label>
      <label className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-secondary/60">
        <Calendar className="h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            When
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent text-sm font-medium outline-none"
          />
        </div>
      </label>
      <label className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-secondary/60">
        <Users className="h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Travelers
          </div>
          <select
            value={travelers}
            onChange={(e) => setTravelers(e.target.value)}
            className="w-full bg-transparent text-sm font-medium outline-none"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </div>
      </label>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-xl bg-cta px-5 py-3 font-semibold text-cta-foreground shadow-cta transition hover:bg-cta/90"
      >
        <Search className="h-5 w-5 md:mr-2" />
        <span className="hidden md:inline">Search</span>
      </button>
    </form>
  );
}
