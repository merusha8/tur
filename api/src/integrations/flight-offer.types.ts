export type FlightOfferSource = 'amadeus' | 'skyscanner' | 'database';

export interface UnifiedFlightOffer {
  id: string;
  source: FlightOfferSource;
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
  currency: string;
  class: string;
  stops: number;
  amenities: string[];
  aircraft?: string;
  image?: string;
  rating: number;
  availableSeats: number;
  externalRef?: string;
}

export interface FlightSearchQuery {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  travelClass?: string;
  maxPrice?: number;
  airline?: string;
  nonStop?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface FlightSearchResponse {
  data: UnifiedFlightOffer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  sources: Record<FlightOfferSource, number>;
  providers: { amadeus: boolean; skyscanner: boolean; database: boolean };
}
