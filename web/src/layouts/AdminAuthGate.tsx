import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { getAdminToken } from "@/lib/adminApi";

export function AdminAuthGate() {
  const navigate = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!getAdminToken()) {
      navigate("/admin/login", {
        replace: true,
        state: { from: loc.pathname },
      });
    }
  }, [navigate, loc.pathname]);

  if (!getAdminToken()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
        Checking session…
      </div>
    );
  }

  return <Outlet />;
}
