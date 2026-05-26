import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HotelLocationContext, UnifiedHotelOffer } from '../hotel-offer.types';

@Injectable()
export class ExpediaRapidService {
  private readonly logger = new Logger(ExpediaRapidService.name);

  constructor(private config: ConfigService) {}

  isConfigured(): boolean {
    return !!(this.config.get('EXPEDIA_RAPID_API_KEY') && this.config.get('EXPEDIA_RAPID_API_SECRET'));
  }

  private get baseUrl(): string {
    const env = this.config.get<string>('EXPEDIA_RAPID_ENV', 'test');
    return env === 'production' ? 'https://api.ean.com' : 'https://test.ean.com';
  }

  private authHeader(): string | null {
    const apiKey = this.config.get('EXPEDIA_RAPID_API_KEY');
    const secret = this.config.get('EXPEDIA_RAPID_API_SECRET');
    if (!apiKey || !secret) return null;

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash('sha512').update(`${apiKey}${secret}${timestamp}`).digest('hex');
    return `EAN APIKey=${apiKey},Signature=${signature},timestamp=${timestamp}`;
  }

  async searchOffers(params: {
    checkIn: string;
    checkOut: string;
    guests: number;
    location: HotelLocationContext;
    max?: number;
  }): Promise<UnifiedHotelOffer[]> {
    const auth = this.authHeader();
    if (!auth) return [];

    const propertyIds = await this.findPropertyIds(params.location, params.max || 25);
    if (propertyIds.length === 0) return [];

    const nights = this.nightsBetween(params.checkIn, params.checkOut);
    const currency = this.config.get('EXPEDIA_RAPID_CURRENCY', 'USD');
    const query = new URLSearchParams({
      checkin: params.checkIn,
      checkout: params.checkOut,
      currency,
      country_code: (params.location.countryCode || 'US').toUpperCase(),
      language: this.config.get('EXPEDIA_RAPID_LOCALE', 'en-US'),
      occupancy: String(params.guests),
      rate_plan_count: '1',
      sales_channel: 'website',
      sales_environment: 'hotel_only',
      travel_purpose: 'leisure',
    });
    propertyIds.forEach((id) => query.append('property_id', id));

    try {
      const res = await fetch(`${this.baseUrl}/v3/properties/availability?${query}`, {
        headers: {
          Accept: 'application/json',
          Authorization: auth,
          'User-Agent': 'MeruTour/1.0',
        },
      });

      if (!res.ok) {
        const text = await res.text();
        this.logger.warn(`Expedia availability failed: ${res.status} ${text.slice(0, 200)}`);
        return [];
      }

      const json = (await res.json()) as Array<{
        property_id?: string;
        status?: string;
        rooms?: Array<{
          id?: string;
          room_name?: string;
          rates?: Array<{
            id?: string;
            refundable?: boolean;
            occupancy_pricing?: Record<string, { totals?: { inclusive?: { billable_currency?: { value?: string; currency?: string } } } }>;
          }>;
        }>;
      }>;

      const contentMap = await this.fetchPropertyContent(propertyIds, auth);

      return json
        .filter((p) => p.status === 'available' && p.rooms?.length)
        .map((property) => {
          const room = property.rooms![0];
          const rate = room.rates?.[0];
          const pricing = rate?.occupancy_pricing?.[String(params.guests)] ?? rate?.occupancy_pricing?.['2'];
          const totalStr = pricing?.totals?.inclusive?.billable_currency?.value;
          const total = totalStr ? parseFloat(totalStr) : 0;
          const pricePerNight = nights > 0 ? Math.round(total / nights) : total;
          const content = contentMap.get(property.property_id || '') ?? {};
          const pid = property.property_id || room.id || 'unknown';

          return {
            id: `expedia:${pid}`,
            source: 'expedia' as const,
            name: content.name || `Expedia Property ${pid}`,
            stars: content.stars ?? 4,
            rating: content.rating ?? 8.0,
            reviewsCount: content.reviewsCount ?? 0,
            amenities: content.amenities ?? ['Free WiFi'],
            mealType: rate?.refundable ? 'Flexible rate' : 'Non-refundable',
            roomTypes: room.room_name ? [room.room_name] : ['Standard Room'],
            images: content.images?.length ? content.images : [`https://picsum.photos/seed/expedia${pid}/800/600`],
            coordinates: content.coordinates ?? {
              lat: params.location.latitude ?? 0,
              lng: params.location.longitude ?? 0,
            },
            pricePerNight,
            totalPrice: total,
            currency: pricing?.totals?.inclusive?.billable_currency?.currency || currency,
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
            externalRef: pid,
          };
        })
        .filter((o) => o.pricePerNight > 0);
    } catch (err) {
      this.logger.warn(`Expedia search error: ${err}`);
      return [];
    }
  }

  private async findPropertyIds(location: HotelLocationContext, max: number): Promise<string[]> {
    const auth = this.authHeader();
    if (!auth) return [];

    const query = new URLSearchParams({
      language: this.config.get('EXPEDIA_RAPID_LOCALE', 'en-US'),
      supply_source: 'expedia',
    });

    if (location.latitude != null && location.longitude != null) {
      query.set('latitude', String(location.latitude));
      query.set('longitude', String(location.longitude));
      query.set('radius', String(this.config.get('EXPEDIA_SEARCH_RADIUS_KM', 25)));
    } else {
      query.set('country_code', (location.countryCode || 'US').toUpperCase());
    }

    try {
      const res = await fetch(`${this.baseUrl}/v3/properties/geography?${query}`, {
        headers: {
          Accept: 'application/json',
          Authorization: auth,
          'User-Agent': 'MeruTour/1.0',
        },
      });

      if (!res.ok) {
        const fallback = this.config.get<string>('EXPEDIA_TEST_PROPERTY_IDS', '19248,20167');
        return fallback.split(',').map((s) => s.trim()).filter(Boolean).slice(0, max);
      }

      const json = (await res.json()) as { property_id?: string[] } | Array<{ property_id?: string }>;
      const ids = Array.isArray(json)
        ? json.map((x) => x.property_id).filter(Boolean) as string[]
        : (json.property_id ?? []);
      return ids.slice(0, max);
    } catch {
      const fallback = this.config.get<string>('EXPEDIA_TEST_PROPERTY_IDS', '19248,20167');
      return fallback.split(',').map((s) => s.trim()).filter(Boolean).slice(0, max);
    }
  }

  private async fetchPropertyContent(
    propertyIds: string[],
    auth: string,
  ): Promise<Map<string, { name?: string; stars?: number; rating?: number; reviewsCount?: number; amenities?: string[]; images?: string[]; coordinates?: { lat: number; lng: number } }>> {
    const map = new Map<string, { name?: string; stars?: number; rating?: number; reviewsCount?: number; amenities?: string[]; images?: string[]; coordinates?: { lat: number; lng: number } }>();
    if (propertyIds.length === 0) return map;

    const query = new URLSearchParams({
      language: this.config.get('EXPEDIA_RAPID_LOCALE', 'en-US'),
      supply_source: 'expedia',
    });
    propertyIds.forEach((id) => query.append('property_id', id));
    query.append('include', 'name');
    query.append('include', 'ratings');
    query.append('include', 'location');
    query.append('include', 'amenities');
    query.append('include', 'images');

    try {
      const res = await fetch(`${this.baseUrl}/v3/properties/content?${query}`, {
        headers: {
          Accept: 'application/json',
          Authorization: auth,
          'User-Agent': 'MeruTour/1.0',
        },
      });
      if (!res.ok) return map;

      const json = (await res.json()) as Record<
        string,
        {
          name?: string;
          ratings?: { property?: { rating?: string; count?: string }; guest?: { overall?: string; count?: string } };
          location?: { coordinates?: { latitude?: number; longitude?: number } };
          amenities?: Record<string, { name?: string }>;
          images?: Array<{ links?: Record<string, { href?: string }> }>;
        }
      >;

      for (const [pid, content] of Object.entries(json)) {
        const guestRating = content.ratings?.guest?.overall ? parseFloat(content.ratings.guest.overall) : undefined;
        map.set(pid, {
          name: content.name,
          stars: content.ratings?.property?.rating ? Math.round(parseFloat(content.ratings.property.rating)) : 4,
          rating: guestRating ?? 8.0,
          reviewsCount: content.ratings?.guest?.count ? parseInt(content.ratings.guest.count, 10) : 0,
          amenities: content.amenities ? Object.values(content.amenities).map((a) => a.name).filter(Boolean) as string[] : ['Free WiFi'],
          images: content.images?.map((img) => img.links?.['350px']?.href || img.links?.['1000px']?.href).filter(Boolean) as string[] | undefined,
          coordinates: content.location?.coordinates
            ? { lat: content.location.coordinates.latitude ?? 0, lng: content.location.coordinates.longitude ?? 0 }
            : undefined,
        });
      }
    } catch (err) {
      this.logger.warn(`Expedia content fetch error: ${err}`);
    }

    return map;
  }

  private nightsBetween(checkIn: string, checkOut: string): number {
    const start = new Date(checkIn).getTime();
    const end = new Date(checkOut).getTime();
    const diff = Math.round((end - start) / 86400000);
    return diff > 0 ? diff : 1;
  }
}
