import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HotelsService } from '../hotels/hotels.service';
import { FlightsService } from '../flights/flights.service';

@Injectable()
export class FavoritesService {
  constructor(
    private prisma: PrismaService,
    private hotelsService: HotelsService,
    private flightsService: FlightsService,
  ) {}

  async findAll(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: {
        flight: true,
        hotel: { include: { city: { select: { name: true } } } },
        tour: { include: { city: { select: { name: true } }, country: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async resolveHotelId(hotelId: string): Promise<string> {
    try {
      return await this.hotelsService.resolveForBooking(hotelId);
    } catch {
      throw new BadRequestException('Hotel not found or offer expired');
    }
  }

  private async resolveFlightId(flightId: string): Promise<string> {
    try {
      return await this.flightsService.resolveForBooking(flightId);
    } catch {
      throw new BadRequestException('Flight not found or offer expired');
    }
  }

  async toggle(userId: string, data: { flightId?: string; hotelId?: string; tourId?: string }) {
    const keys = [data.flightId, data.hotelId, data.tourId].filter(Boolean);
    if (keys.length !== 1) {
      throw new BadRequestException('Provide exactly one of flightId, hotelId, or tourId');
    }

    let flightId = data.flightId;
    if (flightId) {
      flightId = await this.resolveFlightId(flightId);
    }

    let hotelId = data.hotelId;
    if (hotelId) {
      hotelId = await this.resolveHotelId(hotelId);
    }

    const where = {
      userId,
      flightId: flightId ?? null,
      hotelId: hotelId ?? null,
      tourId: data.tourId ?? null,
    };

    const existing = await this.prisma.favorite.findFirst({ where });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false, flightId, hotelId: hotelId ?? undefined };
    }

    await this.prisma.favorite.create({
      data: { userId, flightId, hotelId, tourId: data.tourId },
    });
    return { favorited: true, flightId, hotelId: hotelId ?? undefined };
  }
}
