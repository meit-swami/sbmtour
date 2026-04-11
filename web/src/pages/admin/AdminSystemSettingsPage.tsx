import { useEffect, useState, type FormEvent } from "react";
import { adminApiGet, adminApiPatch, adminApiPost } from "@/lib/adminApi";

export function AdminSystemSettingsPage() {
  const [app, setApp] = useState<Record<string, string>>({});
  const [smtp, setSmtp] = useState<{
    smtp_host: string;
    smtp_email: string;
    smtp_secure: string;
    port_no: string;
    smtp_password_set?: boolean;
  }>({
    smtp_host: "",
    smtp_email: "",
    smtp_secure: "tls",
    port_no: "587",
  });
  const [smtpPass, setSmtpPass] = useState("");
  const [testTo, setTestTo] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminApiGet<{ data: Record<string, unknown> }>("/api/admin/app-settings"),
      adminApiGet<{
        data: {
          smtp_host: string;
          smtp_email: string;
          smtp_secure: string;
          port_no: string;
          smtp_password_set?: boolean;
        };
      }>("/api/admin/smtp-settings"),
    ])
      .then(([a, s]) => {
        const row = a.data;
        const str: Record<string, string> = {};
        for (const [k, v] of Object.entries(row)) {
          str[k] = v == null ? "" : String(v);
        }
        setApp(str);
        setSmtp({
          smtp_host: s.data.smtp_host ?? "",
          smtp_email: s.data.smtp_email ?? "",
          smtp_secure: s.data.smtp_secure ?? "tls",
          port_no: s.data.port_no ?? "587",
          smtp_password_set: s.data.smtp_password_set,
        });
        setErr(null);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, []);

  async function saveApp(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    try {
      await adminApiPatch("/api/admin/app-settings", {
        app_name: app.app_name,
        app_email: app.app_email,
        app_order_email: app.app_order_email,
        app_contact: app.app_contact,
        app_website: app.app_website,
        app_description: app.app_description,
        active_theme: app.active_theme,
        facebook_url: app.facebook_url,
        twitter_url: app.twitter_url,
        youtube_url: app.youtube_url,
        instagram_url: app.instagram_url,
        app_currency_code: app.app_currency_code,
      });
      setMsg("App settings saved.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function saveSmtp(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    try {
      const body: Record<string, string> = {
        smtp_host: smtp.smtp_host,
        smtp_email: smtp.smtp_email,
        smtp_secure: smtp.smtp_secure,
        port_no: smtp.port_no,
      };
      if (smtpPass.trim()) body.smtp_password = smtpPass;
      await adminApiPatch("/api/admin/smtp-settings", body);
      setSmtpPass("");
      setSmtp((prev) => ({ ...prev, smtp_password_set: true }));
      setMsg("SMTP settings saved.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function sendTest(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    try {
      await adminApiPost("/api/admin/smtp-settings/test", { to: testTo.trim() });
      setMsg("Test email sent.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Send failed");
    }
  }

  if (loading) {
    return <p className="text-slate-500">Loading…</p>;
  }

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">System settings</h2>
        <p className="mt-1 text-sm text-slate-600">
          Legacy <code className="text-xs">tbl_settings</code> (app meta) and{" "}
          <code className="text-xs">tbl_smtp_settings</code> for outbound mail.
          Order / app emails here are also used for{" "}
          <strong className="font-medium">enquiry &amp; booking notifications</strong>{" "}
          when SMTP is configured.
        </p>
        {err ? <p className="mt-4 text-sm text-rose-600">{err}</p> : null}
        {msg ? <p className="mt-4 text-sm text-emerald-600">{msg}</p> : null}
      </div>

      <form
        onSubmit={(e) => void saveApp(e)}
        className="max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-slate-800">App (tbl_settings)</h3>
        {[
          ["app_name", "App name"],
          ["app_email", "App email"],
          ["app_order_email", "Order email"],
          ["app_contact", "Contact / phone"],
          ["app_website", "Website URL"],
          ["active_theme", "Active theme"],
          ["app_currency_code", "Currency code"],
          ["facebook_url", "Facebook URL"],
          ["twitter_url", "Twitter URL"],
          ["youtube_url", "YouTube URL"],
          ["instagram_url", "Instagram URL"],
        ].map(([key, label]) => (
          <label key={key} className="block text-sm text-slate-700">
            {label}
            <input
              value={app[key] ?? ""}
              onChange={(e) =>
                setApp((prev) => ({ ...prev, [key]: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        ))}
        <label className="block text-sm text-slate-700">
          Description (HTML)
          <textarea
            value={app.app_description ?? ""}
            onChange={(e) =>
              setApp((prev) => ({ ...prev, app_description: e.target.value }))
            }
            rows={4}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-admin-accent px-4 py-2 text-sm text-white"
        >
          Save app settings
        </button>
      </form>

      <form
        onSubmit={(e) => void saveSmtp(e)}
        className="max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-slate-800">
          SMTP (tbl_smtp_settings)
        </h3>
        <p className="text-xs text-slate-500">
          Password is never shown; leave blank to keep the current password.
          {smtp.smtp_password_set ? " A password is on file." : " No password stored yet."}
        </p>
        <label className="block text-sm text-slate-700">
          Host
          <input
            value={smtp.smtp_host}
            onChange={(e) =>
              setSmtp((prev) => ({ ...prev, smtp_host: e.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm text-slate-700">
          Port
          <input
            value={smtp.port_no}
            onChange={(e) =>
              setSmtp((prev) => ({ ...prev, port_no: e.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm text-slate-700">
          Secure (e.g. tls, ssl)
          <input
            value={smtp.smtp_secure}
            onChange={(e) =>
              setSmtp((prev) => ({ ...prev, smtp_secure: e.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm text-slate-700">
          SMTP username / from email
          <input
            value={smtp.smtp_email}
            onChange={(e) =>
              setSmtp((prev) => ({ ...prev, smtp_email: e.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm text-slate-700">
          SMTP password (optional update)
          <input
            type="password"
            autoComplete="new-password"
            value={smtpPass}
            onChange={(e) => setSmtpPass(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-admin-accent px-4 py-2 text-sm text-white"
        >
          Save SMTP
        </button>
      </form>

      <form
        onSubmit={(e) => void sendTest(e)}
        className="max-w-xl space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-6"
      >
        <h3 className="text-lg font-semibold text-slate-800">Send test email</h3>
        <label className="block text-sm text-slate-700">
          To
          <input
            type="email"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
        >
          Send test
        </button>
      </form>
    </div>
  );
}
