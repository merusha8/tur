import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const resortSelect = {
  id: true,
  cityId: true,
  name: true,
  beachType: true,
  description: true,
  images: true,
  rating: true,
} as const;

@Injectable()
export class ResortsService {
  constructor(private prisma: PrismaService) {}

  findAll(query: { search?: string; beachType?: string; cityId?: string; countryCode?: string; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 12, 50);
    const where: Record<string, unknown> = {};
    if (query.beachType) where.beachType = query.beachType;
    if (query.cityId) where.cityId = query.cityId;
    if (query.countryCode) where.city = { country: { code: query.countryCode.toUpperCase() } };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return Promise.all([
      this.prisma.resort.findMany({
        where,
        orderBy: [{ rating: 'desc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          ...resortSelect,
          city: {
            select: {
              name: true,
              slug: true,
              country: { select: { name: true, code: true, flag: true } },
            },
          },
          _count: { select: { hotels: true } },
        },
      }),
      this.prisma.resort.count({ where }),
    ]).then(([data, total]) => ({ data, total, page, limit, totalPages: Math.ceil(total / limit) }));
  }

  async findOne(id: string) {
    const resort = await this.prisma.resort.findFirst({
      where: { OR: [{ id }, { name: { equals: id, mode: 'insensitive' } }] },
      select: {
        ...resortSelect,
        city: {
          select: {
            id: true,
            name: true,
            slug: true,
            airportCode: true,
            image: true,
            popular: true,
            country: {
              select: { id: true, name: true, code: true, flag: true, currency: true, visaRequired: true },
            },
          },
        },
        hotels: { take: 10, orderBy: { rating: 'desc' } },
      },
    });
    if (!resort) throw new NotFoundException('Resort not found');
    return resort;
  }

  getBeachTypes() {
    return this.prisma.resort
      .findMany({ select: { beachType: true }, distinct: ['beachType'], orderBy: { beachType: 'asc' } })
      .then((r) => r.map((x) => x.beachType));
  }
}
