import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CountriesService {
  constructor(private prisma: PrismaService) {}

  findAll(query: { search?: string; visaRequired?: boolean; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 50, 100);
    const where: Record<string, unknown> = {};
    if (query.visaRequired !== undefined) where.visaRequired = query.visaRequired;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { language: { contains: query.search, mode: 'insensitive' } },
        { currency: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return Promise.all([
      this.prisma.country.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
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
          _count: { select: { cities: true, airports: true } },
        },
      }),
      this.prisma.country.count({ where }),
    ]).then(([data, total]) => ({ data, total, page, limit, totalPages: Math.ceil(total / limit) }));
  }

  findOne(slugOrCode: string) {
    return this.prisma.country.findFirst({
      where: { OR: [{ slug: slugOrCode }, { code: slugOrCode.toUpperCase() }] },
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
        _count: { select: { cities: true, airports: true } },
        cities: {
          take: 20,
          orderBy: [{ popular: 'desc' }, { name: 'asc' }],
          select: { id: true, name: true, slug: true, airportCode: true, image: true, popular: true },
        },
      },
    });
  }
}
