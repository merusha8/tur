import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AirportsService {
  constructor(private prisma: PrismaService) {}

  findAll(query: { search?: string; countryCode?: string; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 50, 100);
    const where: Record<string, unknown> = {};
    if (query.countryCode) where.country = { code: query.countryCode.toUpperCase() };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { iataCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return Promise.all([
      this.prisma.airport.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          city: { select: { name: true, slug: true } },
          country: { select: { name: true, code: true } },
        },
      }),
      this.prisma.airport.count({ where }),
    ]).then(([data, total]) => ({ data, total, page, limit, totalPages: Math.ceil(total / limit) }));
  }

  findByIata(code: string) {
    return this.prisma.airport.findUnique({
      where: { iataCode: code.toUpperCase() },
      include: { city: true, country: true },
    });
  }
}
