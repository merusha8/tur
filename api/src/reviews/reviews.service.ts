import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type ReviewSort = 'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'verified';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: {
    flightId?: string;
    hotelId?: string;
    tourId?: string;
    destinationId?: string;
    rating: number;
    title?: string;
    comment: string;
    pros?: string[];
    cons?: string[];
    images?: string[];
    location?: string;
  }) {
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const verified = await this.checkVerifiedTraveler(userId, data);

    const review = await this.prisma.review.create({
      data: {
        userId,
        ...data,
        pros: data.pros ?? [],
        cons: data.cons ?? [],
        images: data.images ?? [],
        verified,
      },
      include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
    });

    if (data.hotelId) {
      await this.syncHotelRating(data.hotelId);
    }

    return review;
  }

  async findAll(params: {
    flightId?: string;
    hotelId?: string;
    tourId?: string;
    destinationId?: string;
    featured?: boolean;
    rating?: number;
    verified?: boolean;
    sort?: ReviewSort;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 10, 50);
    const where: Record<string, unknown> = {};

    if (params.flightId) where.flightId = params.flightId;
    if (params.hotelId) where.hotelId = params.hotelId;
    if (params.tourId) where.tourId = params.tourId;
    if (params.destinationId) where.destinationId = params.destinationId;
    if (params.featured) where.featured = true;
    if (params.rating) where.rating = params.rating;
    if (params.verified === true) where.verified = true;

    const orderBy = this.resolveSort(params.sort);

    const [data, total, aggregate, distribution, verifiedCount] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.aggregate({ where, _avg: { rating: true } }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where,
        _count: { rating: true },
      }),
      this.prisma.review.count({ where: { ...where, verified: true } }),
    ]);

    const distMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach((d) => { distMap[d.rating] = d._count.rating; });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      summary: {
        averageRating: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
        totalReviews: total,
        distribution: distMap,
        verifiedCount,
      },
    };
  }

  private resolveSort(sort?: ReviewSort) {
    switch (sort) {
      case 'oldest':
        return { createdAt: 'asc' as const };
      case 'rating_high':
        return [{ rating: 'desc' as const }, { createdAt: 'desc' as const }];
      case 'rating_low':
        return [{ rating: 'asc' as const }, { createdAt: 'desc' as const }];
      case 'verified':
        return [{ verified: 'desc' as const }, { createdAt: 'desc' as const }];
      case 'newest':
      default:
        return { createdAt: 'desc' as const };
    }
  }

  private async checkVerifiedTraveler(
    userId: string,
    data: { flightId?: string; hotelId?: string; tourId?: string },
  ) {
    const bookingWhere: Record<string, unknown> = {
      userId,
      status: { in: ['CONFIRMED', 'COMPLETED'] },
      payment: { status: 'SUCCEEDED' },
    };
    if (data.hotelId) bookingWhere.hotelId = data.hotelId;
    else if (data.tourId) bookingWhere.tourId = data.tourId;
    else if (data.flightId) bookingWhere.flightId = data.flightId;
    else return false;

    const booking = await this.prisma.booking.findFirst({ where: bookingWhere });
    return !!booking;
  }

  private async syncHotelRating(hotelId: string) {
    const [agg, count] = await Promise.all([
      this.prisma.review.aggregate({ where: { hotelId }, _avg: { rating: true } }),
      this.prisma.review.count({ where: { hotelId } }),
    ]);
    await this.prisma.hotel.update({
      where: { id: hotelId },
      data: {
        rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
        reviewsCount: count,
      },
    });
  }
}
