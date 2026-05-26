import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FlightsService } from '../flights/flights.service';
import { HotelsService } from '../hotels/hotels.service';

type BookingType = 'FLIGHT' | 'HOTEL' | 'TOUR';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private flightsService: FlightsService,
    private hotelsService: HotelsService,
  ) {}

  async create(userId: string, data: {
    type: BookingType;
    flightId?: string;
    hotelId?: string;
    tourId?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    passengers?: number;
    totalPrice: number;
  }) {
    const reference = `MT-${Date.now().toString(36).toUpperCase()}`;

    if (data.type === 'FLIGHT' && !data.flightId) {
      throw new BadRequestException('Flight ID required');
    }
    if (data.type === 'HOTEL' && !data.hotelId) {
      throw new BadRequestException('Hotel ID required');
    }
    if (data.type === 'TOUR' && !data.tourId) {
      throw new BadRequestException('Tour ID required');
    }

    let flightId = data.flightId;
    if (data.type === 'FLIGHT' && flightId) {
      flightId = await this.flightsService.resolveForBooking(flightId);
    }

    let hotelId = data.hotelId;
    if (data.type === 'HOTEL' && hotelId) {
      hotelId = await this.hotelsService.resolveForBooking(hotelId);
    }

    if (data.type === 'TOUR' && data.tourId) {
      const travelers = data.guests || 1;
      return this.prisma.$transaction(async (tx) => {
        const tour = await tx.tour.findUnique({ where: { id: data.tourId } });
        if (!tour) throw new NotFoundException('Tour not found');
        if (tour.availableSeats < travelers) {
          throw new BadRequestException('Not enough seats available for this tour');
        }

        await tx.tour.update({
          where: { id: data.tourId },
          data: { availableSeats: { decrement: travelers } },
        });

        return tx.booking.create({
          data: {
            userId,
            type: data.type,
            tourId: data.tourId,
            guests: travelers,
            passengers: data.passengers || travelers,
            totalPrice: data.totalPrice,
            reference,
            status: 'PENDING',
          },
          include: { tour: true },
        });
      });
    }

    return this.prisma.booking.create({
      data: {
        userId,
        type: data.type,
        flightId,
        hotelId,
        tourId: data.tourId,
        checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
        checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
        guests: data.guests || 1,
        passengers: data.passengers || 1,
        totalPrice: data.totalPrice,
        reference,
        status: 'PENDING',
      },
      include: { flight: true, hotel: { include: { city: { select: { name: true } } } }, tour: true },
    });
  }

  async findUserBookings(userId: string, type?: string) {
    return this.prisma.booking.findMany({
      where: { userId, ...(type ? { type: type as BookingType } : {}) },
      include: {
        flight: true,
        hotel: { include: { city: { select: { name: true } } } },
        tour: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id, userId },
      include: {
        flight: true,
        hotel: { include: { city: { select: { name: true } } } },
        tour: true,
        payment: true,
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async cancel(id: string, userId: string) {
    const booking = await this.findOne(id, userId);
    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Booking is already cancelled');
    }

    return this.prisma.$transaction(async (tx) => {
      if (booking.type === 'TOUR' && booking.tourId) {
        const travelers = booking.guests || 1;
        await tx.tour.update({
          where: { id: booking.tourId },
          data: { availableSeats: { increment: travelers } },
        });
      }

      return tx.booking.update({
        where: { id: booking.id },
        data: { status: 'CANCELLED' },
        include: {
          flight: true,
          hotel: { include: { city: { select: { name: true } } } },
          tour: true,
          payment: true,
        },
      });
    });
  }
}
