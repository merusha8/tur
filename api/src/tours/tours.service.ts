import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const tourSelect = {
  id: true,
  countryId: true,
  cityId: true,
  hotelId: true,
  title: true,
  description: true,
  duration: true,
  departureDate: true,
  returnDate: true,
  price: true,
  oldPrice: true,
  hotTour: true,
  allInclusive: true,
  availableSeats: true,
  airline: true,
  images: true,
} as const;

const tourRelations = {
  country: { select: { id: true, name: true, code: true, flag: true } },
  city: { select: { id: true, name: true, slug: true } },
  hotel: {
    select: {
      id: true,
      name: true,
      stars: true,
      rating: true,
      mealType: true,
      images: true,
      pricePerNight: true,
    },
  },
} as const;

export type TourSearchQuery = {
  search?: string;
  countryId?: string;
  countryCode?: string;
  cityId?: string;
  hotelId?: string;
  hotTour?: boolean;
  allInclusive?: boolean;
  airline?: string;
  mealType?: string;
  minStars?: number;
  maxStars?: number;
  dateFrom?: string;
  dateTo?: string;
  adults?: number;
  children?: number;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  page?: number;
  limit?: number;
  familyFriendly?: boolean;
  sort?: string;
  category?: string;
};

@Injectable()
export class ToursService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: TourSearchQuery) {
    const page = query.page || 1;
    const limit = query.limit || 12;
    const where: Record<string, unknown> = {};

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { city: { name: { contains: query.search, mode: 'insensitive' } } },
        { country: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }
    if (query.category) {
      const cat = query.category.replace(/-/g, ' ');
      const categoryOr = [
        { title: { contains: cat, mode: 'insensitive' as const } },
        { description: { contains: cat, mode: 'insensitive' as const } },
        { city: { name: { contains: cat, mode: 'insensitive' as const } } },
        { country: { name: { contains: cat, mode: 'insensitive' as const } } },
      ];
      if (cat.toLowerCase().includes('all inclusive')) where.allInclusive = true;
      if (cat.toLowerCase().includes('hot')) where.hotTour = true;
      where.AND = [...((where.AND as unknown[]) || []), { OR: categoryOr }];
    }
    if (query.countryId) where.countryId = query.countryId;
    if (query.countryCode) where.country = { code: query.countryCode.toUpperCase() };
    if (query.cityId) where.cityId = query.cityId;
    if (query.hotelId) where.hotelId = query.hotelId;
    if (query.hotTour === true) where.hotTour = true;
    if (query.allInclusive === true) where.allInclusive = true;
    if (query.airline) where.airline = query.airline;

    if (query.dateFrom || query.dateTo) {
      where.departureDate = {};
      if (query.dateFrom) (where.departureDate as Record<string, Date>).gte = new Date(query.dateFrom);
      if (query.dateTo) {
        const end = new Date(query.dateTo);
        end.setHours(23, 59, 59, 999);
        (where.departureDate as Record<string, Date>).lte = end;
      }
    }

    const travelers = (query.adults || 0) + (query.children || 0);
    if (travelers > 0) {
      where.availableSeats = { gte: travelers };
    }

    if (query.minDuration || query.maxDuration) {
      where.duration = {};
      if (query.minDuration) (where.duration as Record<string, number>).gte = query.minDuration;
      if (query.maxDuration) (where.duration as Record<string, number>).lte = query.maxDuration;
    }
    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) (where.price as Record<string, number>).gte = query.minPrice;
      if (query.maxPrice) (where.price as Record<string, number>).lte = query.maxPrice;
    }

    const hotelWhere: Record<string, unknown> = {};
    if (query.mealType) hotelWhere.mealType = query.mealType;
    if (query.minStars) hotelWhere.stars = { gte: query.minStars };
    if (query.maxStars) {
      hotelWhere.stars = { ...(hotelWhere.stars as object), lte: query.maxStars };
    }
    if (query.familyFriendly) {
      hotelWhere.amenities = { has: 'Family Friendly' };
    }
    if (Object.keys(hotelWhere).length) where.hotel = hotelWhere;

    const orderBy =
      query.sort === 'price_asc' ? { price: 'asc' as const }
      : query.sort === 'price_desc' ? { price: 'desc' as const }
      : query.sort === 'departure' ? { departureDate: 'asc' as const }
      : query.sort === 'duration' ? { duration: 'asc' as const }
      : query.sort === 'stars' ? { hotel: { stars: 'desc' as const } }
      : query.sort === 'rating' ? { hotel: { rating: 'desc' as const } }
      : { departureDate: 'asc' as const };

    const adults = query.adults || 2;
    const children = query.children || 0;

    const [rows, total] = await Promise.all([
      this.prisma.tour.findMany({
        where,
        select: { ...tourSelect, ...tourRelations },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.tour.count({ where }),
    ]);

    const data = rows.map((tour) => ({
      ...tour,
      totalPrice: Math.round(tour.price * adults + tour.price * children * 0.5),
      pricePerPerson: tour.price,
      travelers: { adults, children },
    }));

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const tour = await this.prisma.tour.findUnique({
      where: { id },
      select: {
        ...tourSelect,
        ...tourRelations,
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
    if (!tour) throw new NotFoundException('Tour not found');
    return tour;
  }

  async getSearchFilters() {
    const [mealTypes, starRows, airlines, priceRange] = await Promise.all([
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
      this.getAirlines(),
      this.prisma.tour.aggregate({ _min: { price: true }, _max: { price: true } }),
    ]);

    return {
      mealTypes: mealTypes.map((m) => m.mealType),
      starOptions: starRows.map((s) => s.stars).filter((s) => s >= 2),
      airlines,
      priceRange: {
        min: priceRange._min.price ?? 0,
        max: priceRange._max.price ?? 5000,
      },
      sortOptions: [
        { value: 'departure', label: 'Departure date' },
        { value: 'price_asc', label: 'Price: Low to High' },
        { value: 'price_desc', label: 'Price: High to Low' },
        { value: 'stars', label: 'Hotel stars' },
        { value: 'rating', label: 'Hotel rating' },
        { value: 'duration', label: 'Duration' },
      ],
    };
  }

  async create(data: Record<string, unknown>) {
    return this.prisma.tour.create({ data: data as never });
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.tour.update({ where: { id }, data: data as never });
  }

  async remove(id: string) {
    return this.prisma.tour.delete({ where: { id } });
  }

  async getAirlines() {
    const rows = await this.prisma.tour.findMany({
      select: { airline: true },
      distinct: ['airline'],
      orderBy: { airline: 'asc' },
    });
    return rows.map((r) => r.airline);
  }
}
