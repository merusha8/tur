export interface Destination {
  id: string;
  slug: string;
  name: string;
  country: string;
  description: string;
  heroImage: string;
  images: string[];
  categories: string[];
  rating: number;
  reviewCount: number;
  latitude?: number;
  longitude?: number;
  faq?: { q: string; a: string }[];
  featured?: boolean;
  city?: { id: string; name: string; slug: string };
  tours?: Tour[];
  hotels?: Hotel[];
  reviews?: Review[];
  _count?: { tours: number; hotels: number };
}

export interface Tour {
  id: string;
  countryId: string;
  cityId: string;
  hotelId: string;
  title: string;
  description: string;
  duration: number;
  departureDate: string;
  returnDate: string;
  price: number;
  oldPrice?: number | null;
  hotTour: boolean;
  allInclusive: boolean;
  availableSeats: number;
  airline: string;
  images: string[];
  totalPrice?: number;
  pricePerPerson?: number;
  travelers?: { adults: number; children: number };
  country?: { id?: string; name: string; code?: string; flag?: string };
  city?: { id?: string; name: string; slug?: string };
  hotel?: { id?: string; name: string; stars?: number; rating?: number; mealType?: string; images?: string[]; pricePerNight?: number };
  reviews?: Review[];
}

export interface Hotel {
  id: string;
  cityId?: string;
  resortId?: string | null;
  name: string;
  stars: number;
  rating: number;
  reviewsCount: number;
  amenities: string[];
  mealType: string;
  roomTypes: string[];
  images: string[];
  coordinates: { lat: number; lng: number };
  pricePerNight: number;
  source?: "booking" | "expedia" | "database";
  currency?: string;
  totalPrice?: number;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  deepLinkUrl?: string;
  offerExpiresAt?: string | null;
  city?: { name: string; slug?: string; country?: { name: string; code?: string } };
  resort?: { id: string; name: string; beachType?: string; rating?: number };
}

export interface HotelSearchFilters {
  mealTypes: string[];
  beachTypes: string[];
  beachTypesInDb: string[];
  starOptions: number[];
  priceRange: { min: number; max: number };
  sortOptions: { value: string; label: string }[];
}

export interface HotelsSearchResponse {
  data: Hotel[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  sources: { booking: number; expedia: number; database: number };
  providers: { booking: boolean; expedia: boolean; database: boolean };
}

export interface NearbyPlace {
  id: string;
  name: string;
  rating?: number;
  distanceKm: number;
  address?: string;
  types?: string[];
  lat: number;
  lng: number;
  photoUrl?: string;
}

export interface AirportDistance {
  name: string;
  iataCode?: string;
  distanceKm: number;
  durationText?: string;
  lat?: number;
  lng?: number;
}

export interface HotelLocationContext {
  coordinates: { lat: number; lng: number };
  address?: string;
  hotelName: string;
  cityName?: string;
  nearbyPlaces: NearbyPlace[];
  restaurants: NearbyPlace[];
  beaches: NearbyPlace[];
  airport?: AirportDistance;
  mapsConfigured: boolean;
}

export interface Review {
  id: string;
  rating: number;
  title?: string;
  comment: string;
  pros?: string[];
  cons?: string[];
  images?: string[];
  location?: string;
  imageUrl?: string;
  verified?: boolean;
  featured?: boolean;
  createdAt?: string;
  user?: { firstName: string; lastName: string; avatar?: string };
}

export interface ReviewsSummary {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
  verifiedCount: number;
}

export interface ReviewsResponse {
  data: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: ReviewsSummary;
}

export interface HotTourDeal {
  id: string;
  tourId: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
  validFrom: string;
  validUntil: string;
  departureCity: string;
  nights: number;
  mealPlan: string;
  lastMinute: boolean;
  seatsLeft: number;
  featured: boolean;
  tour: Tour;
}

export interface HotToursResponse {
  data: HotTourDeal[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PromoBanner {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
  buttonText: string;
  icon: string;
}

export interface PlanTripCity {
  id: string;
  name: string;
  slug: string;
  image: string;
  displayName: string;
  country: { name: string };
}

export interface HomePageData {
  hero: { image: string; title: string; subtitle: string };
  promoBanners: PromoBanner[];
  hotTours: HotTourDeal[];
  bestDeals: HotTourDeal[];
  trendingDestinations: Destination[];
  popularHotels: Hotel[];
  featuredReviews: Review[];
  planTripCities: PlanTripCity[];
}

export interface FlightOffer {
  id: string;
  source?: "amadeus" | "skyscanner" | "database";
  airline: string;
  airlineLogo?: string;
  flightNumber: string;
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  price: number;
  currency?: string;
  class?: string;
  stops: number;
  amenities: string[];
  aircraft?: string;
  image?: string;
  rating: number;
  availableSeats?: number;
  reviews?: Review[];
}

export interface FlightsSearchResponse {
  data: FlightOffer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  sources: { amadeus: number; skyscanner: number; database: number };
  providers: { amadeus: boolean; skyscanner: boolean; database: boolean };
}

export interface SearchQuickLink {
  label: string;
  href: string;
}

export interface SearchResult {
  id: string;
  label: string;
  type: "country" | "city" | "hotel" | "resort" | "tour";
  subtitle?: string;
  country?: string;
  countryCode?: string;
  airportCode?: string;
  image?: string;
  stars?: number;
  flag?: string;
  slug?: string;
  href: string;
  quickLinks?: SearchQuickLink[];
}

export interface ToursResponse {
  data: Tour[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
