import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UnifiedFlightOffer } from '../flight-offer.types';

@Injectable()
export class AmadeusService {
  private readonly logger = new Logger(AmadeusService.name);
  private token: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private config: ConfigService) {}

  isConfigured(): boolean {
    return !!(this.config.get('AMADEUS_API_KEY') && this.config.get('AMADEUS_API_SECRET'));
  }

  private get baseUrl(): string {
    const env = this.config.get<string>('AMADEUS_ENV', 'test');
    return env === 'production'
      ? 'https://api.amadeus.com'
      : 'https://test.api.amadeus.com';
  }

  private async getToken(): Promise<string | null> {
    if (!this.isConfigured()) return null;
    if (this.token && Date.now() < this.tokenExpiresAt - 60_000) return this.token;

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.get('AMADEUS_API_KEY')!,
      client_secret: this.config.get('AMADEUS_API_SECRET')!,
    });

    try {
      const res = await fetch(`${this.baseUrl}/v1/security/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      if (!res.ok) {
        this.logger.warn(`Amadeus auth failed: ${res.status}`);
        return null;
      }
      const data = (await res.json()) as { access_token: string; expires_in: number };
      this.token = data.access_token;
      this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
      return this.token;
    } catch (err) {
      this.logger.warn(`Amadeus auth error: ${err}`);
      return null;
    }
  }

  async searchOffers(params: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    adults?: number;
    children?: number;
    travelClass?: string;
    nonStop?: boolean;
    max?: number;
  }): Promise<UnifiedFlightOffer[]> {
    const token = await this.getToken();
    if (!token) return [];

    const query = new URLSearchParams({
      originLocationCode: params.origin.toUpperCase(),
      destinationLocationCode: params.destination.toUpperCase(),
      departureDate: params.departureDate,
      adults: String(params.adults || 1),
      max: String(params.max || 20),
      currencyCode: this.config.get('AMADEUS_CURRENCY', 'USD'),
    });
    if (params.returnDate) query.set('returnDate', params.returnDate);
    if (params.children) query.set('children', String(params.children));
    if (params.travelClass) query.set('travelClass', params.travelClass);
    if (params.nonStop) query.set('nonStop', 'true');

    try {
      const res = await fetch(`${this.baseUrl}/v2/shopping/flight-offers?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        this.logger.warn(`Amadeus search failed: ${res.status} ${await res.text()}`);
        return [];
      }
      const json = (await res.json()) as {
        data?: AmadeusOffer[];
        dictionaries?: { carriers?: Record<string, string>; locations?: Record<string, { cityCode?: string }> };
      };
      const carriers = json.dictionaries?.carriers ?? {};
      return (json.data ?? []).map((offer) => this.mapOffer(offer, carriers));
    } catch (err) {
      this.logger.warn(`Amadeus search error: ${err}`);
      return [];
    }
  }

  private mapOffer(offer: AmadeusOffer, carriers: Record<string, string>): UnifiedFlightOffer {
    const itinerary = offer.itineraries[0];
    const segment = itinerary.segments[0];
    const lastSeg = itinerary.segments[itinerary.segments.length - 1];
    const carrier = offer.validatingAirlineCodes?.[0] || segment.carrierCode;
    const stops = itinerary.segments.length - 1;

    return {
      id: `amadeus:${offer.id}`,
      source: 'amadeus',
      airline: carriers[carrier] || carrier,
      flightNumber: `${segment.carrierCode}${segment.number}`,
      origin: segment.departure.iataCode,
      originCode: segment.departure.iataCode,
      destination: lastSeg.arrival.iataCode,
      destinationCode: lastSeg.arrival.iataCode,
      departureTime: segment.departure.at,
      arrivalTime: lastSeg.arrival.at,
      duration: this.parseIsoDuration(itinerary.duration),
      price: parseFloat(offer.price.total),
      currency: offer.price.currency,
      class: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'ECONOMY',
      stops,
      amenities: stops === 0 ? ['Wi-Fi', 'Meals'] : ['Meals'],
      aircraft: segment.aircraft?.code,
      rating: 4.5,
      availableSeats: offer.numberOfBookableSeats ?? 9,
      externalRef: offer.id,
    };
  }

  private parseIsoDuration(iso: string): number {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    const h = match?.[1] ? parseInt(match[1], 10) : 0;
    const m = match?.[2] ? parseInt(match[2], 10) : 0;
    return h * 60 + m;
  }
}

type AmadeusOffer = {
  id: string;
  price: { total: string; currency: string };
  itineraries: {
    duration: string;
    segments: {
      carrierCode: string;
      number: string;
      departure: { iataCode: string; at: string };
      arrival: { iataCode: string; at: string };
      aircraft?: { code?: string };
    }[];
  }[];
  validatingAirlineCodes?: string[];
  numberOfBookableSeats?: number;
  travelerPricings?: { fareDetailsBySegment?: { cabin?: string }[] }[];
};
