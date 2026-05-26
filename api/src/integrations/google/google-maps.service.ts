import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { HotelSearchService } from '../hotel-search.service';
import { AirportDistance, HotelLocationContext, NearbyPlace } from './google-maps.types';

interface GooglePlaceResult {
  place_id?: string;
  name?: string;
  rating?: number;
  vicinity?: string;
  formatted_address?: string;
  geometry?: { location?: { lat?: number; lng?: number } };
  photos?: Array<{ photo_reference?: string }>;
  types?: string[];
}

@Injectable()
export class GoogleMapsService {
  private readonly logger = new Logger(GoogleMapsService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private hotelSearch: HotelSearchService,
  ) {}

  isConfigured(): boolean {
    return !!this.config.get('GOOGLE_MAPS_API_KEY');
  }

  async getHotelLocationContext(hotelId: string): Promise<HotelLocationContext> {
    const hotel = await this.resolveHotel(hotelId);
    let { lat, lng } = hotel.coordinates;
    const mapsConfigured = this.isConfigured();

    if ((lat === 0 && lng === 0) && mapsConfigured) {
      const geocoded = await this.geocode(`${hotel.name}, ${hotel.cityName || ''}`);
      if (geocoded) {
        lat = geocoded.lat;
        lng = geocoded.lng;
      }
    }

    if (lat === 0 && lng === 0 && hotel.cityId) {
      const city = await this.prisma.city.findUnique({ where: { id: hotel.cityId } });
      if (city?.latitude != null && city.longitude != null) {
        lat = city.latitude;
        lng = city.longitude;
      }
    }

    const airport = await this.resolveAirportDistance(lat, lng, hotel.cityId, hotel.airportCode);

    if (!mapsConfigured) {
      return {
        coordinates: { lat, lng },
        address: hotel.cityName,
        hotelName: hotel.name,
        cityName: hotel.cityName,
        nearbyPlaces: [],
        restaurants: [],
        beaches: [],
        airport,
        mapsConfigured: false,
      };
    }

    const [nearbyPlaces, restaurants, beaches] = await Promise.all([
      this.searchNearby(lat, lng, { type: 'tourist_attraction' }),
      this.searchNearby(lat, lng, { type: 'restaurant' }),
      this.searchNearby(lat, lng, { keyword: 'beach' }),
    ]);

    const address = await this.reverseGeocode(lat, lng);

    return {
      coordinates: { lat, lng },
      address: address || hotel.cityName,
      hotelName: hotel.name,
      cityName: hotel.cityName,
      nearbyPlaces,
      restaurants,
      beaches,
      airport,
      mapsConfigured: true,
    };
  }

  private async resolveHotel(hotelId: string) {
    const cached = await this.hotelSearch.resolveOffer(hotelId);
    if (cached) {
      return {
        name: cached.name,
        coordinates: cached.coordinates,
        cityId: undefined as string | undefined,
        cityName: cached.city?.name,
        airportCode: undefined as string | undefined,
      };
    }

    const hotel = await this.prisma.hotel.findUnique({
      where: { id: hotelId },
      select: {
        name: true,
        coordinates: true,
        cityId: true,
        city: { select: { name: true, airportCode: true, latitude: true, longitude: true } },
      },
    });

    if (!hotel) throw new Error('Hotel not found');

    const coords = (hotel.coordinates as { lat: number; lng: number }) || { lat: 0, lng: 0 };
    const useCityCoords = coords.lat === 0 && coords.lng === 0 && hotel.city?.latitude != null;

    return {
      name: hotel.name,
      coordinates: useCityCoords
        ? { lat: hotel.city!.latitude!, lng: hotel.city!.longitude! }
        : coords,
      cityId: hotel.cityId,
      cityName: hotel.city?.name,
      airportCode: hotel.city?.airportCode ?? undefined,
    };
  }

  private async searchNearby(
    lat: number,
    lng: number,
    opts: { type?: string; keyword?: string },
  ): Promise<NearbyPlace[]> {
    const key = this.config.get('GOOGLE_MAPS_API_KEY');
    if (!key || (lat === 0 && lng === 0)) return [];

    const radius = this.config.get('GOOGLE_PLACES_RADIUS_M', 5000);
    const params = new URLSearchParams({
      location: `${lat},${lng}`,
      radius: String(radius),
      key,
    });
    if (opts.type) params.set('type', opts.type);
    if (opts.keyword) params.set('keyword', opts.keyword);

    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`);
      if (!res.ok) return [];

      const json = (await res.json()) as { results?: GooglePlaceResult[]; status?: string };
      if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
        this.logger.warn(`Places nearby search: ${json.status}`);
        return [];
      }

      return (json.results ?? [])
        .slice(0, 8)
        .map((place) => this.mapPlace(place, lat, lng, key))
        .filter(Boolean) as NearbyPlace[];
    } catch (err) {
      this.logger.warn(`Places search error: ${err}`);
      return [];
    }
  }

  private mapPlace(place: GooglePlaceResult, originLat: number, originLng: number, apiKey: string): NearbyPlace | null {
    const lat = place.geometry?.location?.lat;
    const lng = place.geometry?.location?.lng;
    if (lat == null || lng == null || !place.name) return null;

    const photoRef = place.photos?.[0]?.photo_reference;
    return {
      id: place.place_id || place.name,
      name: place.name,
      rating: place.rating,
      distanceKm: this.haversineKm(originLat, originLng, lat, lng),
      address: place.vicinity || place.formatted_address,
      types: place.types,
      lat,
      lng,
      photoUrl: photoRef
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${apiKey}`
        : undefined,
    };
  }

  private async resolveAirportDistance(
    lat: number,
    lng: number,
    cityId?: string,
    airportCode?: string,
  ): Promise<AirportDistance | undefined> {
    let airport = airportCode
      ? await this.prisma.airport.findFirst({ where: { iataCode: airportCode.toUpperCase() } })
      : null;

    if (!airport && cityId) {
      airport = await this.prisma.airport.findFirst({
        where: { cityId },
        orderBy: [{ isInternational: 'desc' }, { name: 'asc' }],
      });
    }

    if (!airport && lat !== 0 && lng !== 0 && this.isConfigured()) {
      const found = await this.searchNearby(lat, lng, { type: 'airport' });
      const nearest = found.sort((a, b) => a.distanceKm - b.distanceKm)[0];
      if (nearest) {
        const duration = await this.distanceMatrix(lat, lng, nearest.lat, nearest.lng);
        return {
          name: nearest.name,
          distanceKm: nearest.distanceKm,
          durationText: duration,
          lat: nearest.lat,
          lng: nearest.lng,
        };
      }
    }

    if (!airport?.latitude || !airport?.longitude) return undefined;

    const distanceKm = this.haversineKm(lat, lng, airport.latitude, airport.longitude);
    let durationText: string | undefined;

    if (this.isConfigured() && lat !== 0 && lng !== 0) {
      durationText = await this.distanceMatrix(lat, lng, airport.latitude, airport.longitude);
    } else {
      durationText = `~${Math.round(distanceKm / 60)} hr drive`;
    }

    return {
      name: airport.name,
      iataCode: airport.iataCode,
      distanceKm: Math.round(distanceKm * 10) / 10,
      durationText,
      lat: airport.latitude,
      lng: airport.longitude,
    };
  }

  private async distanceMatrix(originLat: number, originLng: number, destLat: number, destLng: number) {
    const key = this.config.get('GOOGLE_MAPS_API_KEY');
    if (!key) return undefined;

    const params = new URLSearchParams({
      origins: `${originLat},${originLng}`,
      destinations: `${destLat},${destLng}`,
      key,
      units: 'metric',
    });

    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?${params}`);
      if (!res.ok) return undefined;
      const json = (await res.json()) as {
        rows?: Array<{ elements?: Array<{ status?: string; distance?: { text?: string }; duration?: { text?: string } }> }>;
      };
      const el = json.rows?.[0]?.elements?.[0];
      if (el?.status !== 'OK') return undefined;
      return el.duration?.text ? `${el.distance?.text || ''} · ${el.duration.text}`.trim() : el.distance?.text;
    } catch {
      return undefined;
    }
  }

  private async geocode(address: string) {
    const key = this.config.get('GOOGLE_MAPS_API_KEY');
    if (!key || !address.trim()) return null;

    const params = new URLSearchParams({ address, key });
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
      const json = (await res.json()) as { results?: Array<{ geometry?: { location?: { lat?: number; lng?: number } } }> };
      const loc = json.results?.[0]?.geometry?.location;
      if (loc?.lat == null || loc?.lng == null) return null;
      return { lat: loc.lat, lng: loc.lng };
    } catch {
      return null;
    }
  }

  private async reverseGeocode(lat: number, lng: number) {
    const key = this.config.get('GOOGLE_MAPS_API_KEY');
    if (!key || (lat === 0 && lng === 0)) return undefined;

    const params = new URLSearchParams({ latlng: `${lat},${lng}`, key });
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
      const json = (await res.json()) as { results?: Array<{ formatted_address?: string }> };
      return json.results?.[0]?.formatted_address;
    } catch {
      return undefined;
    }
  }

  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
  }
}
