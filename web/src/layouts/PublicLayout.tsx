import { Outlet } from "react-router-dom";
import { FloatingContactWidgets } from "@/components/FloatingContactWidgets";
import { PublicNav } from "@/components/PublicNav";
import { SiteFooter } from "@/components/SiteFooter";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <PublicNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      <FloatingContactWidgets />
    </div>
  );
}
