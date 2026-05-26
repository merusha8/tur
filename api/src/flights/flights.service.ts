import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FlightSearchService } from '../integrations/flight-search.service';
import { FlightSearchQuery } from '../integrations/flight-offer.types';

@Injectable()
export class FlightsService {
  constructor(
    private prisma: PrismaService,
    private flightSearch: FlightSearchService,
  ) {}

  search(query: FlightSearchQuery) {
    return this.flightSearch.search(query);
  }

  getProviders() {
    return this.flightSearch.getProviderStatus();
  }

  async findAll(query: { origin?: string; destination?: string; minPrice?: number; maxPrice?: number; airline?: string }) {
    const result = await this.flightSearch.search({
      origin: query.origin || '',
      destination: query.destination || '',
      departureDate: new Date().toISOString().slice(0, 10),
      maxPrice: query.maxPrice,
      airline: query.airline,
      limit: 50,
    });
    return result.data;
  }

  async findOne(id: string) {
    const cached = await this.flightSearch.resolveOffer(id);
    if (cached) return cached;

    const flight = await this.prisma.flight.findUnique({
      where: { id },
      include: { reviews: { include: { user: { select: { firstName: true, lastName: true } } }, take: 10 } },
    });
    if (!flight) throw new NotFoundException('Flight not found');
    return flight;
  }

  async resolveForBooking(flightId: string) {
    return this.flightSearch.materializeForBooking(flightId);
  }
}
