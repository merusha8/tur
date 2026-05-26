import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UnifiedFlightOffer } from '../flight-offer.types';

const SKYSCANNER_BASE = 'https://partners.api.skyscanner.net/apiservices/v3/flights/live/search';

@Injectable()
export class SkyscannerService {
  private readonly logger = new Logger(SkyscannerService.name);

  constructor(private config: ConfigService) {}

  isConfigured(): boolean {
    return !!this.config.get('SKYSCANNER_API_KEY');
  }

  async searchOffers(params: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    adults?: number;
    children?: number;
    travelClass?: string;
  }): Promise<UnifiedFlightOffer[]> {
    const apiKey = this.config.get('SKYSCANNER_API_KEY');
    if (!apiKey) return [];

    const [y, m, d] = params.departureDate.split('-').map(Number);
    const queryLegs: Record<string, unknown>[] = [
      {
        originPlaceId: { iata: params.origin.toUpperCase() },
        destinationPlaceId: { iata: params.destination.toUpperCase() },
        date: { year: y, month: m, day: d },
      },
    ];

    if (params.returnDate) {
      const [ry, rm, rd] = params.returnDate.split('-').map(Number);
      queryLegs.push({
        originPlaceId: { iata: params.destination.toUpperCase() },
        destinationPlaceId: { iata: params.origin.toUpperCase() },
        date: { year: ry, month: rm, day: rd },
      });
    }

    const body = {
      query: {
        market: this.config.get('SKYSCANNER_MARKET', 'US'),
        locale: this.config.get('SKYSCANNER_LOCALE', 'en-US'),
        currency: this.config.get('SKYSCANNER_CURRENCY', 'USD'),
        queryLegs,
        adults: params.adults || 1,
        childrenAges: params.children ? Array(params.children).fill(8) : [],
        cabinClass: this.mapCabin(params.travelClass),
      },
    };

    try {
      const createRes = await fetch(`${SKYSCANNER_BASE}/create`, {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!createRes.ok) {
        this.logger.warn(`Skyscanner create failed: ${createRes.status}`);
        return [];
      }
      const createJson = (await createRes.json()) as {
        sessionToken?: string;
        content?: SkyscannerContent;
      };

      let content = createJson.content;
      const sessionToken = createJson.sessionToken;

      if (sessionToken) {
        for (let i = 0; i < 8; i++) {
          await this.sleep(1500);
          const pollRes = await fetch(`${SKYSCANNER_BASE}/poll/${sessionToken}`, {
            method: 'POST',
            headers: { 'x-api-key': apiKey },
          });
          if (!pollRes.ok) break;
          const pollJson = (await pollRes.json()) as { content?: SkyscannerContent; status?: string };
          content = pollJson.content ?? content;
          if (pollJson.status === 'RESULT_STATUS_COMPLETE') break;
        }
      }

      return this.parseContent(content);
    } catch (err) {
      this.logger.warn(`Skyscanner search error: ${err}`);
      return [];
    }
  }

  private parseContent(content?: SkyscannerContent): UnifiedFlightOffer[] {
    if (!content?.results?.itineraries) return [];

    const carriers = content.results.carriers ?? {};
    const places = content.results.places ?? {};
    const legs = content.results.legs ?? {};
    const segments = content.results.segments ?? {};
    const offers: UnifiedFlightOffer[] = [];

    for (const [itineraryId, itinerary] of Object.entries(content.results.itineraries)) {
      const pricing = itinerary.pricingOptions?.[0];
      if (!pricing) continue;

      const legIds = itinerary.legIds ?? [];
      const firstLeg = legs[legIds[0]];
      if (!firstLeg?.segmentIds?.length) continue;

      const firstSeg = segments[firstLeg.segmentIds[0]];
      const lastSeg = segments[firstLeg.segmentIds[firstLeg.segmentIds.length - 1]];
      if (!firstSeg || !lastSeg) continue;

      const originPlace = places[firstSeg.originPlaceId];
      const destPlace = places[lastSeg.destinationPlaceId];
      const carrierId = firstSeg.marketingCarrierId;
      const carrier = carrierId ? carriers[carrierId] : undefined;
      const stops = firstLeg.segmentIds.length - 1;

      offers.push({
        id: `skyscanner:${itineraryId}`,
        source: 'skyscanner',
        airline: carrier?.name || firstSeg.marketingCarrierId || 'Airline',
        flightNumber: `${firstSeg.marketingCarrierId}${firstSeg.flightNumber || ''}`,
        origin: originPlace?.name || firstSeg.originPlaceId,
        originCode: originPlace?.iata || firstSeg.originPlaceId,
        destination: destPlace?.name || lastSeg.destinationPlaceId,
        destinationCode: destPlace?.iata || lastSeg.destinationPlaceId,
        departureTime: firstSeg.departureDateTime?.iso8601 || new Date().toISOString(),
        arrivalTime: lastSeg.arrivalDateTime?.iso8601 || new Date().toISOString(),
        duration: firstLeg.durationInMinutes || 0,
        price: pricing.price?.amount || 0,
        currency: pricing.price?.unit || content.results.currency || 'USD',
        class: 'ECONOMY',
        stops,
        amenities: stops === 0 ? ['Wi-Fi', 'Meals'] : ['Meals'],
        rating: 4.4,
        availableSeats: 9,
        externalRef: itineraryId,
      });
    }

    return offers.slice(0, 25);
  }

  private mapCabin(travelClass?: string): string {
    switch (travelClass?.toUpperCase()) {
      case 'BUSINESS':
        return 'CABIN_CLASS_BUSINESS';
      case 'PREMIUM_ECONOMY':
        return 'CABIN_CLASS_PREMIUM_ECONOMY';
      case 'FIRST':
        return 'CABIN_CLASS_FIRST';
      default:
        return 'CABIN_CLASS_ECONOMY';
    }
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

type SkyscannerContent = {
  results?: {
    currency?: string;
    itineraries?: Record<string, {
      legIds?: string[];
      pricingOptions?: { price?: { amount?: number; unit?: string } }[];
    }>;
    carriers?: Record<string, { name?: string; iata?: string }>;
    places?: Record<string, { name?: string; iata?: string }>;
    legs?: Record<string, { segmentIds?: string[]; durationInMinutes?: number }>;
    segments?: Record<string, {
      originPlaceId: string;
      destinationPlaceId: string;
      departureDateTime?: { iso8601?: string };
      arrivalDateTime?: { iso8601?: string };
      marketingCarrierId?: string;
      flightNumber?: string;
    }>;
  };
};
