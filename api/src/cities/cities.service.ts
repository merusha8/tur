import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const citySelect = {
  id: true,
  countryId: true,
  name: true,
  slug: true,
  airportCode: true,
  image: true,
  popular: true,
  latitude: true,
  longitude: true,
} as const;

@Injectable()
export class CitiesService {
  constructor(private prisma: PrismaService) {}

  findAll(query: { search?: string; countryId?: string; countryCode?: string; popular?: boolean; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 50, 100);
    const where: Record<string, unknown> = {};
    if (query.countryId) where.countryId = query.countryId;
    if (query.countryCode) where.country = { code: query.countryCode.toUpperCase() };
    if (query.popular === true) where.popular = true;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { airportCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return Promise.all([
      this.prisma.city.findMany({
        where,
        orderBy: [{ popular: 'desc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          ...citySelect,
          country: { select: { name: true, code: true, flag: true } },
          _count: { select: { hotels: true, resorts: true, airports: true } },
        },
      }),
      this.prisma.city.count({ where }),
    ]).then(([data, total]) => ({ data, total, page, limit, totalPages: Math.ceil(total / limit) }));
  }

  findOne(slug: string) {
    return this.prisma.city.findUnique({
      where: { slug },
      select: {
        ...citySelect,
        country: {
          select: {
            id: true,
            name: true,
            slug: true,
            code: true,
            flag: true,
            currency: true,
            language: true,
            visaRequired: true,
            description: true,
          },
        },
        airports: { select: { id: true, iataCode: true, name: true, isInternational: true } },
        resorts: {
          take: 10,
          orderBy: { rating: 'desc' },
          select: { id: true, cityId: true, name: true, beachType: true, description: true, images: true, rating: true },
        },
        hotels: {
          take: 12,
          orderBy: { rating: 'desc' },
          select: {
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
          },
        },
        tours: {
          take: 12,
          orderBy: { departureDate: 'asc' },
          select: {
            id: true,
            title: true,
            duration: true,
            price: true,
            oldPrice: true,
            hotTour: true,
            allInclusive: true,
            images: true,
            airline: true,
            departureDate: true,
            returnDate: true,
            availableSeats: true,
          },
        },
        destination: true,
      },
    });
  }
}
