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
