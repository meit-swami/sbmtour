import { AdminApiListPage } from "./AdminApiListPage";

export { AdminPackagesListPage } from "./AdminPackagesListPage";

export function AdminCountriesListPage() {
  return (
    <AdminApiListPage
      title="Countries"
      listPath="/admin/countries"
      apiPath="/api/admin/countries?limit=200"
      nameKey="country_name"
      newPath="/admin/countries/new"
    />
  );
}

export function AdminDestinationsListPage() {
  return (
    <AdminApiListPage
      title="Destinations"
      listPath="/admin/destinations"
      apiPath="/api/admin/destinations?limit=200"
      nameKey="destination_name"
      newPath="/admin/destinations/new"
    />
  );
}

export function AdminHotelsListPage() {
  return (
    <AdminApiListPage
      title="Hotels"
      listPath="/admin/hotels"
      apiPath="/api/admin/hotels?limit=200"
      nameKey="hotelName"
    />
  );
}

export function AdminCarsListPage() {
  return (
    <AdminApiListPage
      title="Vehicles (cars)"
      listPath="/admin/cars"
      apiPath="/api/admin/cars?limit=200"
      nameKey="car_name"
    />
  );
}

export function AdminBlogsListPage() {
  return (
    <AdminApiListPage
      title="Blogs"
      listPath="/admin/blogs"
      apiPath="/api/admin/blogs?limit=200"
      nameKey="blog_name"
    />
  );
}

export function AdminBannersListPage() {
  return (
    <AdminApiListPage
      title="Banners"
      listPath="/admin/banners"
      apiPath="/api/admin/banners"
      nameKey="banner_title"
    />
  );
}

export function AdminReviewsListPage() {
  return (
    <AdminApiListPage
      title="Reviews"
      listPath="/admin/reviews"
      apiPath="/api/admin/reviews?limit=200"
      nameKey="reviewer_name"
    />
  );
}

export function AdminTeamListPage() {
  return (
    <AdminApiListPage
      title="Team"
      listPath="/admin/team"
      apiPath="/api/admin/team?limit=200"
      nameKey="person_name"
    />
  );
}
