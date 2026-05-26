export type HotelOfferSource = 'booking' | 'expedia' | 'database';

export interface UnifiedHotelOffer {
  id: string;
  source: HotelOfferSource;
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
  totalPrice?: number;
  currency: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  city?: { name: string; country?: { name: string; code?: string } };
  resort?: { name: string; beachType?: string };
  beachAccess?: boolean;
  externalRef?: string;
  deepLinkUrl?: string;
}

export interface HotelSearchQuery {
  city?: string;
  cityId?: string;
  countryCode?: string;
  resortId?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  minStars?: number;
  mealType?: string;
  allInclusive?: boolean;
  beach?: boolean;
  beachType?: string;
  wifi?: boolean;
  pool?: boolean;
  familyFriendly?: boolean;
  luxury?: boolean;
  transferIncluded?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface HotelSearchResponse {
  data: UnifiedHotelOffer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  sources: Record<HotelOfferSource, number>;
  providers: { booking: boolean; expedia: boolean; database: boolean };
}

export interface HotelLocationContext {
  cityName?: string;
  countryCode?: string;
  countryName?: string;
  latitude?: number;
  longitude?: number;
}
