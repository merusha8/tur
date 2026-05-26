import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VacationCategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.vacationCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  findOne(slug: string) {
    return this.prisma.vacationCategory.findUnique({
      where: { slug },
    });
  }
}
