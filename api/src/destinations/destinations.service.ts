import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const tourListSelect = {
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
  city: { select: { name: true, slug: true } },
  country: { select: { name: true, code: true } },
  hotel: { select: { id: true, name: true, stars: true } },
} as const;

@Injectable()
export class DestinationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(featured?: boolean, search?: string) {
    const where: Record<string, unknown> = {};
    if (featured) where.featured = true;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
      ];
    }
    const destinations = await this.prisma.destination.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { city: { select: { id: true } } },
    });
    const withCounts = await Promise.all(
      destinations.map(async (d) => {
        const [hotelCount, tourCount] = d.cityId
          ? await Promise.all([
              this.prisma.hotel.count({ where: { cityId: d.cityId } }),
              this.prisma.tour.count({ where: { cityId: d.cityId } }),
            ])
          : [0, 0];
        return { ...d, _count: { hotels: hotelCount, tours: tourCount } };
      }),
    );
    return withCounts;
  }

  async findBySlug(slug: string) {
    const destination = await this.prisma.destination.findUnique({
      where: { slug },
      include: {
        city: { select: { id: true, name: true, slug: true } },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
    if (!destination) throw new NotFoundException('Destination not found');

    const [hotels, tours] = destination.cityId
      ? await Promise.all([
          this.prisma.hotel.findMany({
            where: { cityId: destination.cityId },
            take: 6,
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
          }),
          this.prisma.tour.findMany({
            where: { cityId: destination.cityId },
            take: 6,
            orderBy: { departureDate: 'asc' },
            select: tourListSelect,
          }),
        ])
      : [[], []];

    return { ...destination, hotels, tours };
  }

  async create(data: Record<string, unknown>) {
    return this.prisma.destination.create({ data: data as never });
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.destination.update({ where: { id }, data: data as never });
  }

  async remove(id: string) {
    return this.prisma.destination.delete({ where: { id } });
  }
}
