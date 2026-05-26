import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, address: true, dateOfBirth: true, avatar: true, role: true,
        emailVerified: true, createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, data: Partial<{ firstName: string; lastName: string; phone: string; address: string; dateOfBirth: string; avatar: string }>) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, address: true, dateOfBirth: true, avatar: true },
    });
  }
}
