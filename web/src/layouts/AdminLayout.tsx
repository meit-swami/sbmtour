import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getAdminUser, setAdminToken } from "@/lib/adminApi";

const sidebar: { to: string; label: string }[] = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/enquiries", label: "Enquiries" },
  { to: "/admin/leads", label: "Leads (CRM)" },
  { to: "/admin/menu", label: "Menu builder" },
  { to: "/admin/footer", label: "Footer builder" },
  { to: "/admin/support-tickets", label: "Support tickets" },
  { to: "/admin/booking-requests", label: "Booking requests" },
  { to: "/admin/web-settings", label: "Web settings" },
  { to: "/admin/system-settings", label: "System (app + SMTP)" },
  { to: "/admin/account", label: "Account" },
  { to: "/admin/countries", label: "Countries" },
  { to: "/admin/destinations", label: "Destinations" },
  { to: "/admin/packages", label: "Packages" },
  { to: "/admin/hotels", label: "Hotels" },
  { to: "/admin/cars", label: "Vehicles" },
  { to: "/admin/blogs", label: "Blogs" },
  { to: "/admin/banners", label: "Banners" },
  { to: "/admin/reviews", label: "Reviews" },
  { to: "/admin/team", label: "Team" },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const user = getAdminUser();

  function logout() {
    setAdminToken(null);
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-56 shrink-0 flex-col overflow-y-auto border-r border-slate-800 bg-admin-sidebar text-slate-200 md:flex">
        <div className="border-b border-slate-700 px-4 py-5">
          <span className="text-lg font-semibold text-white">SBM</span>
          <span className="text-admin-accent"> CMS</span>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3 pb-8">
          {sidebar.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "rounded-md px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-admin-accent/15 text-admin-accent"
                    : "text-slate-300 hover:bg-white/5 hover:text-white",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
          <h1 className="text-sm font-semibold text-slate-800">
            Online Tourism CMS
          </h1>
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="text-sm text-admin-accent hover:text-admin-accent-hover"
            >
              Visit website
            </a>
            {user ? (
              <span className="text-xs text-slate-500">{user.username}</span>
            ) : null}
            <button
              type="button"
              onClick={logout}
              className="text-xs font-medium text-slate-600 hover:text-admin-accent"
            >
              Log out
            </button>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
