import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingComService } from './booking/booking-com.service';
import { ExpediaRapidService } from './expedia/expedia-rapid.service';
import { HotelOfferCacheService } from './hotel-offer-cache.service';
import {
  HotelLocationContext,
  HotelSearchQuery,
  HotelSearchResponse,
  UnifiedHotelOffer,
} from './hotel-offer.types';
import { matchesHotelFilters } from './hotel-filter.utils';

@Injectable()
export class HotelSearchService {
  private readonly logger = new Logger(HotelSearchService.name);

  constructor(
    private prisma: PrismaService,
    private bookingCom: BookingComService,
    private expedia: ExpediaRapidService,
    private cache: HotelOfferCacheService,
  ) {}

  getProviderStatus() {
    return {
      booking: this.bookingCom.isConfigured(),
      expedia: this.expedia.isConfigured(),
      database: true,
    };
  }

  async search(query: HotelSearchQuery): Promise<HotelSearchResponse> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const sources: Record<'booking' | 'expedia' | 'database', number> = {
      booking: 0,
      expedia: 0,
      database: 0,
    };

    const location = await this.resolveLocation(query);
    const { checkIn, checkOut, nights } = this.resolveDates(query);
    const guests = query.guests || 2;

    let offers: UnifiedHotelOffer[] = [];
    const hasStaySearch = !!(checkIn && checkOut);

    if (hasStaySearch) {
      const [bookingOffers, expediaOffers] = await Promise.all([
        this.bookingCom.isConfigured()
          ? this.bookingCom.searchOffers({
              checkIn,
              checkOut,
              guests,
              rooms: query.rooms || 1,
              location,
              max: 25,
            })
          : Promise.resolve([]),
        this.expedia.isConfigured()
          ? this.expedia.searchOffers({
              checkIn,
              checkOut,
              guests,
              location,
              max: 25,
            })
          : Promise.resolve([]),
      ]);

      sources.booking = bookingOffers.length;
      sources.expedia = expediaOffers.length;
      offers = this.dedupeOffers([...bookingOffers, ...expediaOffers]);
      await this.cache.setMany(offers);
    }

    const dbOffers = await this.searchDatabase(query, { checkIn, checkOut, nights });
    sources.database = dbOffers.length;

    if (!hasStaySearch || offers.length === 0) {
      offers = [...offers, ...dbOffers];
    } else {
      offers = [...offers, ...dbOffers.slice(0, 10)];
    }

    offers = this.applyFilters(offers, query);
    offers = this.sortOffers(offers, query.sort);

    const total = offers.length;
    const start = (page - 1) * limit;
    const data = offers.slice(start, start + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      sources,
      providers: this.getProviderStatus(),
    };
  }

  async resolveOffer(id: string): Promise<UnifiedHotelOffer | null> {
    if (this.cache.hasExternal(id)) {
      return await this.cache.get(id);
    }

    const hotel = await this.prisma.hotel.findUnique({
      where: { id },
      include: { city: { include: { country: true } } },
    });
    if (!hotel) return null;
    return this.mapDbHotel(hotel);
  }

  getOfferExpiresAt(id: string) {
    return this.cache.getExpiresAt(id);
  }

  async materializeForBooking(offerId: string): Promise<string> {
    if (!this.cache.hasExternal(offerId)) {
      const exists = await this.prisma.hotel.findUnique({ where: { id: offerId } });
      if (exists) return offerId;
      throw new Error('Hotel not found');
    }

    const offer = await this.cache.get(offerId);
    if (!offer) throw new Error('Hotel offer expired');

    const existing = await this.prisma.hotel.findFirst({
      where: { name: offer.name, pricePerNight: offer.pricePerNight },
    });
    if (existing) return existing.id;

    let cityId: string | undefined;
    if (offer.city?.name) {
      const city = await this.prisma.city.findFirst({
        where: { name: { equals: offer.city.name, mode: 'insensitive' } },
      });
      cityId = city?.id;
    }
    if (!cityId) {
      const fallback = await this.prisma.city.findFirst({ orderBy: { createdAt: 'asc' } });
      if (!fallback) throw new Error('No city available for external hotel');
      cityId = fallback.id;
    }

    const created = await this.prisma.hotel.create({
      data: {
        cityId,
        name: offer.name,
        stars: offer.stars,
        rating: offer.rating,
        reviewsCount: offer.reviewsCount,
        amenities: offer.amenities,
        mealType: offer.mealType,
        roomTypes: offer.roomTypes,
        images: offer.images,
        coordinates: offer.coordinates,
        pricePerNight: offer.pricePerNight,
      },
    });
    return created.id;
  }

  private async resolveLocation(query: HotelSearchQuery): Promise<HotelLocationContext> {
    if (query.cityId) {
      const city = await this.prisma.city.findUnique({
        where: { id: query.cityId },
        include: { country: true },
      });
      if (city) {
        return {
          cityName: city.name,
          countryCode: city.country.code,
          countryName: city.country.name,
          latitude: city.latitude ?? undefined,
          longitude: city.longitude ?? undefined,
        };
      }
    }

    if (query.city) {
      const city = await this.prisma.city.findFirst({
        where: { name: { contains: query.city, mode: 'insensitive' } },
        include: { country: true },
      });
      if (city) {
        return {
          cityName: city.name,
          countryCode: city.country.code,
          countryName: city.country.name,
          latitude: city.latitude ?? undefined,
          longitude: city.longitude ?? undefined,
        };
      }
      return { cityName: query.city, countryCode: query.countryCode };
    }

    if (query.countryCode) {
      const country = await this.prisma.country.findFirst({
        where: { code: query.countryCode.toUpperCase() },
      });
      const city = await this.prisma.city.findFirst({
        where: { country: { code: query.countryCode.toUpperCase() } },
      });
      return {
        cityName: city?.name,
        countryCode: query.countryCode.toUpperCase(),
        countryName: country?.name,
        latitude: city?.latitude ?? undefined,
        longitude: city?.longitude ?? undefined,
      };
    }

    return {};
  }

  private resolveDates(query: HotelSearchQuery) {
    const today = new Date();
    const checkIn = query.checkIn || this.formatDate(today);
    const defaultOut = new Date(today);
    defaultOut.setDate(defaultOut.getDate() + 3);
    const checkOut = query.checkOut || this.formatDate(defaultOut);
    const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
    return { checkIn, checkOut, nights };
  }

  private formatDate(d: Date) {
    return d.toISOString().slice(0, 10);
  }

  private async searchDatabase(
    query: HotelSearchQuery,
    dates: { checkIn: string; checkOut: string; nights: number },
  ): Promise<UnifiedHotelOffer[]> {
    const where: Record<string, unknown> = {};
    const and: Record<string, unknown>[] = [];

    if (query.cityId) where.cityId = query.cityId;
    if (query.resortId) where.resortId = query.resortId;
    if (query.countryCode) where.city = { country: { code: query.countryCode.toUpperCase() } };
    if (query.city) where.city = { name: { contains: query.city, mode: 'insensitive' } };
    if (query.minRating) where.rating = { gte: query.minRating };
    if (query.minStars) where.stars = { gte: query.minStars };

    if (query.allInclusive) {
      where.mealType = { contains: 'All Inclusive', mode: 'insensitive' };
    } else if (query.mealType) {
      where.mealType = { contains: query.mealType, mode: 'insensitive' };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { city: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }
    if (query.minPrice != null || query.maxPrice != null) {
      where.pricePerNight = {};
      if (query.minPrice != null) (where.pricePerNight as Record<string, number>).gte = query.minPrice;
      if (query.maxPrice != null) (where.pricePerNight as Record<string, number>).lte = query.maxPrice;
    }

    if (query.wifi) and.push({ amenities: { has: 'Wi-Fi' } });
    if (query.pool) and.push({ amenities: { has: 'Pool' } });
    if (query.beach) and.push({ OR: [{ resort: { beachType: { not: 'None' } } }, { amenities: { has: 'Beach Access' } }] });
    if (query.beachType) and.push({ resort: { beachType: query.beachType } });
    if (and.length) where.AND = and;

    const hotels = await this.prisma.hotel.findMany({
      where,
      orderBy: { rating: 'desc' },
      take: 150,
      include: {
        city: { include: { country: true } },
        resort: { select: { name: true, beachType: true } },
      },
    });

    return hotels
      .map((h) => this.mapDbHotel(h, dates))
      .filter((o) => matchesHotelFilters(o, query));
  }

  private mapDbHotel(
    h: {
      id: string;
      name: string;
      stars: number;
      rating: number;
      reviewsCount: number;
      amenities: string[];
      mealType: string;
      roomTypes: string[];
      images: string[];
      coordinates: unknown;
      pricePerNight: number;
      city?: { name: string; country?: { name: string; code: string } };
      resort?: { name: string; beachType: string } | null;
    },
    dates?: { checkIn: string; checkOut: string; nights: number },
  ): UnifiedHotelOffer {
    const coords = (h.coordinates as { lat: number; lng: number }) || { lat: 0, lng: 0 };
    const nights = dates?.nights ?? 3;
    const beachType = h.resort?.beachType;
    return {
      id: h.id,
      source: 'database',
      name: h.name,
      stars: h.stars,
      rating: h.rating,
      reviewsCount: h.reviewsCount,
      amenities: h.amenities,
      mealType: h.mealType,
      roomTypes: h.roomTypes,
      images: h.images,
      coordinates: coords,
      pricePerNight: h.pricePerNight,
      totalPrice: h.pricePerNight * nights,
      currency: 'USD',
      checkIn: dates?.checkIn,
      checkOut: dates?.checkOut,
      nights,
      city: h.city
        ? { name: h.city.name, country: h.city.country ? { name: h.city.country.name, code: h.city.country.code } : undefined }
        : undefined,
      resort: h.resort ? { name: h.resort.name, beachType: h.resort.beachType } : undefined,
      beachAccess: !!beachType && beachType !== 'None',
    };
  }

  private dedupeOffers(offers: UnifiedHotelOffer[]): UnifiedHotelOffer[] {
    const seen = new Set<string>();
    return offers.filter((o) => {
      const key = `${o.name.toLowerCase()}-${o.pricePerNight}-${o.source}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private applyFilters(offers: UnifiedHotelOffer[], query: HotelSearchQuery) {
    return offers.filter((o) => matchesHotelFilters(o, query));
  }

  private sortOffers(offers: UnifiedHotelOffer[], sort?: string) {
    const list = [...offers];
    switch (sort) {
      case 'price_desc':
        return list.sort((a, b) => b.pricePerNight - a.pricePerNight);
      case 'price_asc':
        return list.sort((a, b) => a.pricePerNight - b.pricePerNight);
      case 'stars':
        return list.sort((a, b) => b.stars - a.stars);
      case 'rating':
      default:
        return list.sort((a, b) => b.rating - a.rating);
    }
  }
}
