import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HotelLocationContext, UnifiedHotelOffer } from '../hotel-offer.types';

const SANDBOX_BASE = 'https://demandapi-sandbox.booking.com/3.1';
const PRODUCTION_BASE = 'https://demandapi.booking.com/3.1';

@Injectable()
export class BookingComService {
  private readonly logger = new Logger(BookingComService.name);

  constructor(private config: ConfigService) {}

  isConfigured(): boolean {
    return !!(this.config.get('BOOKING_API_KEY') && this.config.get('BOOKING_AFFILIATE_ID'));
  }

  private get baseUrl(): string {
    const env = this.config.get<string>('BOOKING_ENV', 'sandbox');
    return env === 'production' ? PRODUCTION_BASE : SANDBOX_BASE;
  }

  async searchOffers(params: {
    checkIn: string;
    checkOut: string;
    guests: number;
    rooms?: number;
    location: HotelLocationContext;
    max?: number;
  }): Promise<UnifiedHotelOffer[]> {
    const apiKey = this.config.get('BOOKING_API_KEY');
    const affiliateId = this.config.get('BOOKING_AFFILIATE_ID');
    if (!apiKey || !affiliateId) return [];

    const nights = this.nightsBetween(params.checkIn, params.checkOut);
    const body: Record<string, unknown> = {
      checkin: params.checkIn,
      checkout: params.checkOut,
      guests: {
        number_of_adults: params.guests,
        number_of_rooms: params.rooms || 1,
      },
      booker: {
        country: (params.location.countryCode || this.config.get<string>('BOOKING_BOOKER_COUNTRY') || 'us').toLowerCase(),
        platform: 'desktop',
      },
      rows: params.max || 25,
      extras: ['products'],
    };

    if (params.location.latitude != null && params.location.longitude != null) {
      body.coordinates = {
        latitude: params.location.latitude,
        longitude: params.location.longitude,
        radius: this.config.get<number>('BOOKING_SEARCH_RADIUS_KM', 25),
      };
    } else if (params.location.countryCode) {
      body.country = params.location.countryCode.toLowerCase();
    } else {
      body.coordinates = { latitude: 52.3676, longitude: 4.9041, radius: 25 };
    }

    try {
      const res = await fetch(`${this.baseUrl}/accommodations/search`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'X-Affiliate-Id': affiliateId,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        this.logger.warn(`Booking.com search failed: ${res.status} ${text.slice(0, 200)}`);
        return [];
      }

      const json = (await res.json()) as {
        data?: Array<{
          id: number;
          url?: string;
          deep_link_url?: string;
          price?: { total?: number; display?: number; base?: number };
          products?: Array<{
            room?: string;
            policies?: { meal_plan?: { type?: string } };
          }>;
        }>;
      };

      const currency = this.config.get('BOOKING_CURRENCY', 'USD');
      return (json.data ?? []).map((item) => {
        const total = item.price?.total ?? item.price?.display ?? item.price?.base ?? 0;
        const pricePerNight = nights > 0 ? Math.round(total / nights) : total;
        const product = item.products?.[0];
        const mealType = product?.policies?.meal_plan?.type?.replace(/_/g, ' ') || 'Room only';

        return {
          id: `booking:${item.id}`,
          source: 'booking' as const,
          name: `Booking.com Property #${item.id}`,
          stars: 4,
          rating: 8.5,
          reviewsCount: 0,
          amenities: ['Free WiFi', '24h Reception'],
          mealType,
          roomTypes: product?.room ? [product.room] : ['Standard Room'],
          images: [`https://picsum.photos/seed/booking${item.id}/800/600`],
          coordinates: {
            lat: params.location.latitude ?? 0,
            lng: params.location.longitude ?? 0,
          },
          pricePerNight,
          totalPrice: total,
          currency,
          checkIn: params.checkIn,
          checkOut: params.checkOut,
          nights,
          city: params.location.cityName
            ? {
                name: params.location.cityName,
                country:
                  params.location.countryCode || params.location.countryName
                    ? { code: params.location.countryCode, name: params.location.countryName || params.location.countryCode || '' }
                    : undefined,
              }
            : undefined,
          externalRef: String(item.id),
          deepLinkUrl: item.deep_link_url || item.url,
        };
      });
    } catch (err) {
      this.logger.warn(`Booking.com search error: ${err}`);
      return [];
    }
  }

  private nightsBetween(checkIn: string, checkOut: string): number {
    const start = new Date(checkIn).getTime();
    const end = new Date(checkOut).getTime();
    const diff = Math.round((end - start) / 86400000);
    return diff > 0 ? diff : 1;
  }
}
