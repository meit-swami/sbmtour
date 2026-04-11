import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { PublicLayout } from "./layouts/PublicLayout";
import { AdminAuthGate } from "./layouts/AdminAuthGate";
import { AdminLayout } from "./layouts/AdminLayout";
import { HomePage } from "./pages/HomePage";
import { CountriesPage } from "./pages/CountriesPage";
import { CountryDetailPage } from "./pages/CountryDetailPage";
import { DestinationsPage } from "./pages/DestinationsPage";
import { DestinationDetailPage } from "./pages/DestinationDetailPage";
import { PackagesPage } from "./pages/PackagesPage";
import { PackageDetailPage } from "./pages/PackageDetailPage";
import { BlogListPage } from "./pages/BlogListPage";
import { BlogPostPage } from "./pages/BlogPostPage";
import { HotelsPage } from "./pages/HotelsPage";
import { HotelDetailPage } from "./pages/HotelDetailPage";
import { VehiclesPage } from "./pages/VehiclesPage";
import { VehicleDetailPage } from "./pages/VehicleDetailPage";
import { ContactPage } from "./pages/ContactPage";
import { CmsStaticPage } from "./pages/CmsStaticPage";
import { PlanTripPage } from "./pages/PlanTripPage";
import { SupportTicketPage } from "./pages/SupportTicketPage";
import { TeamPage } from "./pages/TeamPage";
import { FaqDbPage } from "./pages/FaqDbPage";
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminEnquiriesPage } from "./pages/admin/AdminEnquiriesPage";
import { AdminCountryEditPage } from "./pages/admin/AdminCountryEditPage";
import { AdminDestinationEditPage } from "./pages/admin/AdminDestinationEditPage";
import { AdminPackageEditPage } from "./pages/admin/AdminPackageEditPage";
import { AdminJsonEditPage } from "./pages/admin/AdminJsonEditPage";
import { AdminWebSettingsPage } from "./pages/admin/AdminWebSettingsPage";
import { AdminSupportTicketsPage } from "./pages/admin/AdminSupportTicketsPage";
import { AdminBookingRequestsPage } from "./pages/admin/AdminBookingRequestsPage";
import { AdminAccountPage } from "./pages/admin/AdminAccountPage";
import { AdminSystemSettingsPage } from "./pages/admin/AdminSystemSettingsPage";
import { AdminMenuPage } from "./pages/admin/AdminMenuPage";
import { AdminMenuItemEditPage } from "./pages/admin/AdminMenuItemEditPage";
import { AdminFooterPage } from "./pages/admin/AdminFooterPage";
import { AdminFooterWidgetEditPage } from "./pages/admin/AdminFooterWidgetEditPage";
import { AdminLeadsPage } from "./pages/admin/AdminLeadsPage";
import { AdminLeadDetailPage } from "./pages/admin/AdminLeadDetailPage";
import {
  AdminBannersListPage,
  AdminBlogsListPage,
  AdminCarsListPage,
  AdminCountriesListPage,
  AdminDestinationsListPage,
  AdminHotelsListPage,
  AdminPackagesListPage,
  AdminReviewsListPage,
  AdminTeamListPage,
} from "./pages/admin/adminListWrappers";

export function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="countries" element={<CountriesPage />} />
        <Route path="countries/:slug" element={<CountryDetailPage />} />
        <Route path="destinations" element={<DestinationsPage />} />
        <Route path="destinations/:slug" element={<DestinationDetailPage />} />
        <Route path="packages" element={<PackagesPage />} />
        <Route path="packages/:slug" element={<PackageDetailPage />} />
        <Route path="blog" element={<BlogListPage />} />
        <Route path="blog/:slug" element={<BlogPostPage />} />
        <Route path="hotels" element={<HotelsPage />} />
        <Route path="hotels/:slug" element={<HotelDetailPage />} />
        <Route path="vehicles" element={<VehiclesPage />} />
        <Route path="vehicles/:slug" element={<VehicleDetailPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="plan-trip" element={<PlanTripPage />} />
        <Route path="support" element={<SupportTicketPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="faqs-db" element={<FaqDbPage />} />
        <Route path="about" element={<CmsStaticPage page="about" />} />
        <Route path="faq" element={<CmsStaticPage page="faq" />} />
        <Route path="privacy" element={<CmsStaticPage page="privacy" />} />
        <Route path="terms" element={<CmsStaticPage page="terms" />} />
        <Route path="why-us" element={<CmsStaticPage page="why-us" />} />
        <Route path="refund" element={<CmsStaticPage page="refund" />} />
        <Route path="cancellation" element={<CmsStaticPage page="cancellation" />} />
        <Route path="payments" element={<CmsStaticPage page="payments" />} />
      </Route>

      <Route path="admin" element={<Outlet />}>
        <Route path="login" element={<AdminLoginPage />} />
        <Route element={<AdminAuthGate />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="enquiries" element={<AdminEnquiriesPage />} />
            <Route path="leads" element={<AdminLeadsPage />} />
            <Route path="leads/:id" element={<AdminLeadDetailPage />} />
            <Route path="menu" element={<AdminMenuPage />} />
            <Route path="menu/items/new" element={<AdminMenuItemEditPage />} />
            <Route path="menu/items/:id" element={<AdminMenuItemEditPage />} />
            <Route path="footer" element={<AdminFooterPage />} />
            <Route
              path="footer/widgets/:id"
              element={<AdminFooterWidgetEditPage />}
            />
            <Route path="support-tickets" element={<AdminSupportTicketsPage />} />
            <Route path="booking-requests" element={<AdminBookingRequestsPage />} />
            <Route path="web-settings" element={<AdminWebSettingsPage />} />
            <Route path="system-settings" element={<AdminSystemSettingsPage />} />
            <Route path="account" element={<AdminAccountPage />} />
            <Route path="countries" element={<AdminCountriesListPage />} />
            <Route path="countries/:id" element={<AdminCountryEditPage />} />
            <Route path="destinations" element={<AdminDestinationsListPage />} />
            <Route path="destinations/:id" element={<AdminDestinationEditPage />} />
            <Route path="packages" element={<AdminPackagesListPage />} />
            <Route path="packages/:id" element={<AdminPackageEditPage />} />
            <Route path="hotels" element={<AdminHotelsListPage />} />
            <Route
              path="hotels/:id"
              element={
                <AdminJsonEditPage
                  title="Hotels"
                  apiBase="/api/admin/hotels"
                  listPath="/admin/hotels"
                />
              }
            />
            <Route path="cars" element={<AdminCarsListPage />} />
            <Route
              path="cars/:id"
              element={
                <AdminJsonEditPage
                  title="Vehicles"
                  apiBase="/api/admin/cars"
                  listPath="/admin/cars"
                />
              }
            />
            <Route path="blogs" element={<AdminBlogsListPage />} />
            <Route
              path="blogs/:id"
              element={
                <AdminJsonEditPage
                  title="Blogs"
                  apiBase="/api/admin/blogs"
                  listPath="/admin/blogs"
                />
              }
            />
            <Route path="banners" element={<AdminBannersListPage />} />
            <Route
              path="banners/:id"
              element={
                <AdminJsonEditPage
                  title="Banners"
                  apiBase="/api/admin/banners"
                  listPath="/admin/banners"
                />
              }
            />
            <Route path="reviews" element={<AdminReviewsListPage />} />
            <Route
              path="reviews/:id"
              element={
                <AdminJsonEditPage
                  title="Reviews"
                  apiBase="/api/admin/reviews"
                  listPath="/admin/reviews"
                />
              }
            />
            <Route path="team" element={<AdminTeamListPage />} />
            <Route
              path="team/:id"
              element={
                <AdminJsonEditPage
                  title="Team"
                  apiBase="/api/admin/team"
                  listPath="/admin/team"
                />
              }
            />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
