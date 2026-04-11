import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adminApiGet, adminApiPatch } from "@/lib/adminApi";

const WIDGET_TYPES = [
  "logo",
  "menu",
  "contact",
  "social",
  "instagram",
  "facebook",
  "youtube",
  "custom",
  "text",
] as const;

export function AdminFooterWidgetEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [widget_type, setWidgetType] = useState("text");
  const [widget_title, setWidgetTitle] = useState("");
  const [widget_content, setWidgetContent] = useState("");
  const [widget_url, setWidgetUrl] = useState("");
  const [widget_iframe, setWidgetIframe] = useState("");
  const [column_position, setColumnPosition] = useState("1");
  const [row_order, setRowOrder] = useState("0");
  const [css_class, setCssClass] = useState("");
  const [status, setStatus] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    adminApiGet<{ data: Record<string, string | number | null> }>(
      `/api/admin/footer/widgets/${id}`
    )
      .then((r) => {
        const d = r.data;
        setWidgetType(String(d.widget_type ?? "text"));
        setWidgetTitle(String(d.widget_title ?? ""));
        setWidgetContent(String(d.widget_content ?? ""));
        setWidgetUrl(String(d.widget_url ?? ""));
        setWidgetIframe(String(d.widget_iframe ?? ""));
        setColumnPosition(String(d.column_position ?? 1));
        setRowOrder(String(d.row_order ?? 0));
        setCssClass(String(d.css_class ?? ""));
        setStatus(Number(d.status) !== 0);
        setErr(null);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setErr(null);
    try {
      await adminApiPatch(`/api/admin/footer/widgets/${id}`, {
        widget_type,
        widget_title: widget_title.trim() || null,
        widget_content: widget_content || null,
        widget_url: widget_url.trim() || null,
        widget_iframe: widget_iframe || null,
        column_position: Number(column_position) || 1,
        row_order: Number(row_order) || 0,
        css_class: css_class.trim() || null,
        status: status ? 1 : 0,
      });
      navigate("/admin/footer");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <div>
      <Link
        to="/admin/footer"
        className="text-sm font-medium text-admin-accent hover:underline"
      >
        ← Footer builder
      </Link>
      <h2 className="mt-4 text-2xl font-bold text-slate-800">
        Edit widget #{id}
      </h2>
      {loading ? (
        <p className="mt-6 text-slate-500">Loading…</p>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="mt-6 max-w-xl space-y-4">
          <label className="block text-sm text-slate-700">
            Type
            <select
              value={widget_type}
              onChange={(e) => setWidgetType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              {WIDGET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-slate-700">
            Title
            <input
              value={widget_title}
              onChange={(e) => setWidgetTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm text-slate-700">
            Content (HTML)
            <textarea
              value={widget_content}
              onChange={(e) => setWidgetContent(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
            />
          </label>
          <label className="block text-sm text-slate-700">
            URL
            <input
              value={widget_url}
              onChange={(e) => setWidgetUrl(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm text-slate-700">
            Iframe embed (HTML)
            <textarea
              value={widget_iframe}
              onChange={(e) => setWidgetIframe(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-slate-700">
              Column
              <input
                type="number"
                min={1}
                value={column_position}
                onChange={(e) => setColumnPosition(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="text-sm text-slate-700">
              Row order
              <input
                type="number"
                value={row_order}
                onChange={(e) => setRowOrder(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
          </div>
          <label className="block text-sm text-slate-700">
            CSS class
            <input
              value={css_class}
              onChange={(e) => setCssClass(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={status}
              onChange={(e) => setStatus(e.target.checked)}
            />
            Active
          </label>
          {err ? <p className="text-sm text-rose-600">{err}</p> : null}
          <button
            type="submit"
            className="rounded-lg bg-admin-accent px-4 py-2 text-sm text-white"
          >
            Save
          </button>
        </form>
      )}
    </div>
  );
}
