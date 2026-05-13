import { useLocation, Outlet } from "react-router-dom";
import { Footer } from "@/components/site/Footer";
import { LeadFormPopup } from "@/components/site/LeadFormPopup";
import { Navbar } from "@/components/site/Navbar";
import { WhatsAppFab } from "@/components/site/WhatsAppFab";

export function PublicLayout() {
  const location = useLocation();
  const transparentOnTop = location.pathname === "/";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar transparentOnTop={transparentOnTop} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFab />
      <LeadFormPopup />
    </div>
  );
}
