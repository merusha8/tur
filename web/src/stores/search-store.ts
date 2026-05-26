import { create } from "zustand";

export interface TourPackageSearch {
  countryId: string;
  cityId: string;
  dateFrom: string;
  dateTo: string;
  adults: number;
  children: number;
  mealType: string;
  minStars: number;
  maxBudget: number;
  allInclusive: boolean;
}

interface FlightSearch {
  origin: string;
  destination: string;
  trip: "roundtrip" | "oneway";
  departDate: string;
  returnDate: string;
  passengers: number;
  travelClass: string;
}

interface HotelSearch {
  city: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

interface SearchState {
  flightSearch: FlightSearch;
  hotelSearch: HotelSearch;
  tourSearch: TourPackageSearch;
  setFlightSearch: (data: Partial<FlightSearch>) => void;
  setHotelSearch: (data: Partial<HotelSearch>) => void;
  setTourSearch: (data: Partial<TourPackageSearch>) => void;
}

const defaultFlight: FlightSearch = {
  origin: "ALA",
  destination: "",
  trip: "roundtrip",
  departDate: "",
  returnDate: "",
  passengers: 1,
  travelClass: "Economy",
};

const defaultHotel: HotelSearch = {
  city: "",
  checkIn: "",
  checkOut: "",
  guests: 2,
};

export const defaultTourSearch: TourPackageSearch = {
  countryId: "",
  cityId: "",
  dateFrom: "",
  dateTo: "",
  adults: 2,
  children: 0,
  mealType: "",
  minStars: 0,
  maxBudget: 5000,
  allInclusive: false,
};

export const useSearchStore = create<SearchState>((set) => ({
  flightSearch: defaultFlight,
  hotelSearch: defaultHotel,
  tourSearch: defaultTourSearch,
  setFlightSearch: (data) => set((s) => ({ flightSearch: { ...s.flightSearch, ...data } })),
  setHotelSearch: (data) => set((s) => ({ hotelSearch: { ...s.hotelSearch, ...data } })),
  setTourSearch: (data) => set((s) => ({ tourSearch: { ...s.tourSearch, ...data } })),
}));

export function tourSearchToParams(search: TourPackageSearch, extra?: Record<string, string | number>) {
  const p = new URLSearchParams();
  if (search.countryId) p.set("countryId", search.countryId);
  if (search.cityId) p.set("cityId", search.cityId);
  if (search.dateFrom) p.set("dateFrom", search.dateFrom);
  if (search.dateTo) p.set("dateTo", search.dateTo);
  p.set("adults", String(search.adults));
  p.set("children", String(search.children));
  if (search.mealType) p.set("mealType", search.mealType);
  if (search.minStars) p.set("minStars", String(search.minStars));
  if (search.maxBudget) p.set("maxPrice", String(search.maxBudget));
  if (search.allInclusive) p.set("allInclusive", "true");
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => {
      if (v !== undefined && v !== "") p.set(k, String(v));
    });
  }
  return p;
}

export function paramsToTourSearch(params: URLSearchParams): TourPackageSearch {
  return {
    countryId: params.get("countryId") || "",
    cityId: params.get("cityId") || "",
    dateFrom: params.get("dateFrom") || "",
    dateTo: params.get("dateTo") || "",
    adults: +(params.get("adults") || 2),
    children: +(params.get("children") || 0),
    mealType: params.get("mealType") || "",
    minStars: +(params.get("minStars") || 0),
    maxBudget: +(params.get("maxPrice") || 5000),
    allInclusive: params.get("allInclusive") === "true",
  };
}
