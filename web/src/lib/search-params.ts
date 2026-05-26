export type TourFiltersState = {
  search?: string;
  airline?: string;
  hotTour?: boolean;
  allInclusive?: boolean;
  familyFriendly?: boolean;
  mealType?: string;
  minStars?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  category?: string;
  page?: number;
};

export type HotTourFiltersState = {
  search?: string;
  lastMinute?: boolean;
  minPrice?: number;
  maxPrice?: number;
  mealPlan?: string;
  sort?: string;
  page?: number;
};

export function tourFiltersToQuery(
  filters: TourFiltersState,
  extra?: { cityId?: string | null },
) {
  const sp = new URLSearchParams();
  const cityId = extra?.cityId;
  if (cityId) sp.set("cityId", cityId);
  if (filters.search) sp.set("search", filters.search);
  if (filters.airline) sp.set("airline", filters.airline);
  if (filters.hotTour) sp.set("hotTour", "true");
  if (filters.allInclusive) sp.set("allInclusive", "true");
  if (filters.familyFriendly) sp.set("familyFriendly", "true");
  if (filters.mealType) sp.set("mealType", filters.mealType);
  if (filters.minStars) sp.set("minStars", String(filters.minStars));
  if (filters.minPrice) sp.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice) sp.set("maxPrice", String(filters.maxPrice));
  if (filters.sort) sp.set("sort", filters.sort);
  if (filters.category) sp.set("category", filters.category);
  if (filters.page && filters.page > 1) sp.set("page", String(filters.page));
  return sp.toString();
}

export function hotTourFiltersToQuery(filters: HotTourFiltersState) {
  const sp = new URLSearchParams();
  if (filters.search) sp.set("search", filters.search);
  if (filters.lastMinute) sp.set("lastMinute", "true");
  if (filters.minPrice) sp.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice) sp.set("maxPrice", String(filters.maxPrice));
  if (filters.mealPlan) sp.set("mealPlan", filters.mealPlan);
  if (filters.sort && filters.sort !== "discount") sp.set("sort", filters.sort);
  if (filters.page && filters.page > 1) sp.set("page", String(filters.page));
  return sp.toString();
}

export function toursPath(filters: TourFiltersState, extra?: { cityId?: string | null }) {
  const qs = tourFiltersToQuery(filters, extra);
  return qs ? `/tours?${qs}` : "/tours";
}

export function hotToursPath(filters: HotTourFiltersState) {
  const qs = hotTourFiltersToQuery(filters);
  return qs ? `/hot-tours?${qs}` : "/hot-tours";
}
