export type BannerRow = {
  id: number;
  banner_title: string;
  banner_slug: string;
  banner_desc: string;
  media_type: "image" | "video";
  desktop_image: string | null;
  mobile_image: string | null;
  desktop_video: string | null;
  mobile_video: string | null;
  banner_image: string | null;
};

export type DestinationRow = {
  id: number;
  destination_name: string;
  destination_slug: string;
  destination_type: string;
  destination_image: string;
  country_name: string;
  country_slug: string;
};

export type PackageRow = {
  id: number;
  packName: string;
  package_slug: string;
  packDuration: string;
  packType: string;
  featured_image: string;
  is_featured: number;
  today_deal: number;
  single_discounted_price: string | number | null;
  dual_discounted_price: string | number | null;
  triple_discounted_price: string | number | null;
  quad_discounted_price: string | number | null;
  single_actual_price: string | number | null;
  dual_actual_price: string | number | null;
  country_name: string;
  destination_name: string | null;
};

export type ReviewRow = {
  id: number;
  reviewer_name: string;
  reviewer_place: string;
  review_desc: string;
  review_image: string;
};

export type BlogRow = {
  id: number;
  blog_name: string;
  blogPlace: string;
  blog_slug: string;
  blogDate: string;
  blogDesc: string;
  blog_image: string;
};

export type HomePayload = {
  banners: BannerRow[];
  destinationTypes: string[];
  packagesDomestic: PackageRow[];
  packagesInternational: PackageRow[];
  reviews: ReviewRow[];
  blogs: BlogRow[];
};
