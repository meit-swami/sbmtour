import { useEffect, useState, type FormEvent } from "react";
import { adminApiGet, adminApiPatch } from "@/lib/adminApi";

export function AdminWebSettingsPage() {
  const [row, setRow] = useState<Record<string, string | number | null>>({});
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    adminApiGet<{ data: Record<string, string | number | null> }>(
      "/api/admin/web-settings"
    )
      .then((r) => {
        setRow(r.data ?? {});
        setErr(null);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Load failed"));
  }, []);

  function set<K extends string>(key: K, v: string) {
    setRow((prev) => ({ ...prev, [key]: v }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    try {
      await adminApiPatch("/api/admin/web-settings", row);
      setMsg("Saved.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  }

  const ta = (key: string, label: string, rows = 4) => (
    <label key={key} className="block text-sm text-slate-700">
      {label}
      <textarea
        value={String(row[key] ?? "")}
        onChange={(e) => set(key, e.target.value)}
        rows={rows}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
      />
    </label>
  );

  const inp = (key: string, label: string) => (
    <label key={key} className="block text-sm text-slate-700">
      {label}
      <input
        value={String(row[key] ?? "")}
        onChange={(e) => set(key, e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
    </label>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800">Web settings</h2>
      <p className="mt-1 text-sm text-slate-600">
        Row <code className="text-xs">tbl_web_settings</code> id=1 — contact, SEO
        snippets, CMS HTML pages.
      </p>
      {err ? <p className="mt-4 text-sm text-rose-600">{err}</p> : null}
      {msg ? <p className="mt-4 text-sm text-emerald-600">{msg}</p> : null}
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="mt-6 max-w-3xl space-y-4"
      >
        {inp("site_name", "Site name")}
        {inp("site_description", "Site description")}
        {ta("copyright_text", "Copyright HTML", 3)}
        {inp("contact_page_title", "Contact page title")}
        {inp("address", "Address")}
        {inp("contact_number", "Phone")}
        {inp("contact_email", "Email")}
        {ta("map_embed_url", "Map embed URL / iframe HTML", 3)}
        {inp("facebook_url", "Facebook URL")}
        {inp("twitter_url", "Twitter URL")}
        {inp("tripadvisor_url", "TripAdvisor URL")}
        {ta("about_content", "About page HTML", 8)}
        {ta("faq_content", "FAQ HTML", 8)}
        {ta("privacy_content", "Privacy HTML", 8)}
        {ta("terms_of_use_content", "Terms HTML", 8)}
        <div className="grid gap-4 md:grid-cols-2">
          {inp("active_menu_type", "Menu type (default|dynamic)")}
          {inp("active_menu_id", "Active menu id")}
          {inp("active_footer_type", "Footer type (default|dynamic)")}
          {inp("active_footer_id", "Active footer id")}
        </div>
        <button
          type="submit"
          className="rounded-lg bg-admin-accent px-4 py-2 text-sm font-medium text-white hover:bg-admin-accent-hover"
        >
          Save all fields above
        </button>
      </form>
    </div>
  );
}
