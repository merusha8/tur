import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HotelSearchService } from '../integrations/hotel-search.service';
import { GoogleMapsService } from '../integrations/google/google-maps.service';
import { HotelSearchQuery } from '../integrations/hotel-offer.types';
import { BEACH_TYPES } from '../../prisma/data/travel-constants';

const hotelSelect = {
  id: true,
  cityId: true,
  resortId: true,
  name: true,
  stars: true,
  rating: true,
  reviewsCount: true,
  amenities: true,
  mealType: true,
  roomTypes: true,
  images: true,
  coordinates: true,
  pricePerNight: true,
} as const;

@Injectable()
export class HotelsService {
  constructor(
    private prisma: PrismaService,
    private hotelSearch: HotelSearchService,
    private googleMaps: GoogleMapsService,
  ) {}

  search(query: HotelSearchQuery) {
    return this.hotelSearch.search(query);
  }

  getProviders() {
    return this.hotelSearch.getProviderStatus();
  }

  async getSearchFilters() {
    const [mealTypes, starRows, priceRange, beachTypes] = await Promise.all([
      this.prisma.hotel.findMany({
        select: { mealType: true },
        distinct: ['mealType'],
        orderBy: { mealType: 'asc' },
      }),
      this.prisma.hotel.findMany({
        select: { stars: true },
        distinct: ['stars'],
        orderBy: { stars: 'asc' },
      }),
      this.prisma.hotel.aggregate({ _min: { pricePerNight: true }, _max: { pricePerNight: true } }),
      this.prisma.resort.findMany({
        select: { beachType: true },
        distinct: ['beachType'],
        where: { beachType: { not: 'None' } },
        orderBy: { beachType: 'asc' },
      }),
    ]);

    return {
      mealTypes: mealTypes.map((m) => m.mealType).filter(Boolean),
      beachTypes: BEACH_TYPES.filter((b) => b !== 'None'),
      beachTypesInDb: beachTypes.map((b) => b.beachType),
      starOptions: starRows.map((s) => s.stars).filter((s) => s >= 2),
      priceRange: {
        min: Math.floor(priceRange._min.pricePerNight ?? 50),
        max: Math.ceil(priceRange._max.pricePerNight ?? 2000),
      },
      sortOptions: [
        { value: 'rating', label: 'Best rating' },
        { value: 'price_asc', label: 'Price: low to high' },
        { value: 'price_desc', label: 'Price: high to low' },
        { value: 'stars', label: 'Stars' },
      ],
    };
  }

  async findAll(query: {
    search?: string;
    city?: string;
    cityId?: string;
    resortId?: string;
    countryCode?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    minStars?: number;
    mealType?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 50);
    const where: Record<string, unknown> = {};
    if (query.cityId) where.cityId = query.cityId;
    if (query.resortId) where.resortId = query.resortId;
    if (query.countryCode) where.city = { country: { code: query.countryCode.toUpperCase() } };
    if (query.city) where.city = { name: { contains: query.city, mode: 'insensitive' } };
    if (query.minRating) where.rating = { gte: query.minRating };
    if (query.minStars) where.stars = { gte: query.minStars };
    if (query.mealType) where.mealType = query.mealType;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { city: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }
    if (query.minPrice || query.maxPrice) {
      where.pricePerNight = {};
      if (query.minPrice) (where.pricePerNight as Record<string, number>).gte = query.minPrice;
      if (query.maxPrice) (where.pricePerNight as Record<string, number>).lte = query.maxPrice;
    }
    const orderBy =
      query.sort === 'price_asc' ? { pricePerNight: 'asc' as const }
      : query.sort === 'price_desc' ? { pricePerNight: 'desc' as const }
      : query.sort === 'stars' ? { stars: 'desc' as const }
      : { rating: 'desc' as const };

    const [data, total] = await Promise.all([
      this.prisma.hotel.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          ...hotelSelect,
          city: { select: { name: true, slug: true, country: { select: { name: true, code: true } } } },
          resort: { select: { id: true, name: true, beachType: true, rating: true } },
        },
      }),
      this.prisma.hotel.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const cached = await this.hotelSearch.resolveOffer(id);
    if (cached) {
      const offerExpiresAt = await this.hotelSearch.getOfferExpiresAt(id);
      return {
        ...cached,
        cityId: undefined,
        resortId: null,
        reviews: [],
        offerExpiresAt: offerExpiresAt?.toISOString() ?? null,
      };
    }

    const hotel = await this.prisma.hotel.findUnique({
      where: { id },
      select: {
        ...hotelSelect,
        city: {
          select: {
            id: true,
            name: true,
            slug: true,
            airportCode: true,
            image: true,
            country: { select: { name: true, code: true, flag: true } },
          },
        },
        resort: { select: { id: true, name: true, beachType: true, rating: true, images: true } },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
    if (!hotel) throw new NotFoundException('Hotel not found');
    return hotel;
  }

  async resolveForBooking(hotelId: string) {
    return this.hotelSearch.materializeForBooking(hotelId);
  }

  async getLocationContext(hotelId: string) {
    try {
      return await this.googleMaps.getHotelLocationContext(hotelId);
    } catch {
      throw new NotFoundException('Hotel location not found');
    }
  }
}
