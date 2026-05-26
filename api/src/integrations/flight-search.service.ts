import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AmadeusService } from './amadeus/amadeus.service';
import { SkyscannerService } from './skyscanner/skyscanner.service';
import { FlightOfferCacheService } from './flight-offer-cache.service';
import {
  FlightSearchQuery,
  FlightSearchResponse,
  UnifiedFlightOffer,
} from './flight-offer.types';

@Injectable()
export class FlightSearchService {
  private readonly logger = new Logger(FlightSearchService.name);

  constructor(
    private prisma: PrismaService,
    private amadeus: AmadeusService,
    private skyscanner: SkyscannerService,
    private cache: FlightOfferCacheService,
  ) {}

  getProviderStatus() {
    return {
      amadeus: this.amadeus.isConfigured(),
      skyscanner: this.skyscanner.isConfigured(),
      database: true,
    };
  }

  async search(query: FlightSearchQuery): Promise<FlightSearchResponse> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const sources: Record<'amadeus' | 'skyscanner' | 'database', number> = {
      amadeus: 0,
      skyscanner: 0,
      database: 0,
    };

    let offers: UnifiedFlightOffer[] = [];

    const hasRoute = query.origin && query.destination && query.departureDate;

    if (hasRoute) {
      const [amadeusOffers, skyscannerOffers] = await Promise.all([
        this.amadeus.isConfigured()
          ? this.amadeus.searchOffers({
              origin: query.origin,
              destination: query.destination,
              departureDate: query.departureDate,
              returnDate: query.returnDate,
              adults: query.adults,
              children: query.children,
              travelClass: query.travelClass,
              nonStop: query.nonStop,
              max: 25,
            })
          : Promise.resolve([]),
        this.skyscanner.isConfigured()
          ? this.skyscanner.searchOffers({
              origin: query.origin,
              destination: query.destination,
              departureDate: query.departureDate,
              returnDate: query.returnDate,
              adults: query.adults,
              children: query.children,
              travelClass: query.travelClass,
            })
          : Promise.resolve([]),
      ]);

      sources.amadeus = amadeusOffers.length;
      sources.skyscanner = skyscannerOffers.length;
      offers = this.dedupeOffers([...amadeusOffers, ...skyscannerOffers]);
      await this.cache.setMany(offers);
    }

    const dbOffers = await this.searchDatabase(query);
    sources.database = dbOffers.length;

    if (!hasRoute || offers.length === 0) {
      offers = [...offers, ...dbOffers];
    } else {
      offers = [...offers, ...dbOffers.slice(0, 10)];
    }

    offers = this.applyFilters(offers, query);
    offers = this.sortOffers(offers, query.sort);

    const total = offers.length;
    const start = (page - 1) * limit;
    const data = offers.slice(start, start + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      sources,
      providers: this.getProviderStatus(),
    };
  }

  async resolveOffer(id: string): Promise<UnifiedFlightOffer | null> {
    if (this.cache.hasExternal(id)) {
      return await this.cache.get(id);
    }
    const flight = await this.prisma.flight.findUnique({ where: { id } });
    if (!flight) return null;
    return this.mapDbFlight(flight);
  }

  async materializeForBooking(offerId: string): Promise<string> {
    if (!this.cache.hasExternal(offerId)) {
      const exists = await this.prisma.flight.findUnique({ where: { id: offerId } });
      if (exists) return offerId;
      throw new Error('Flight not found');
    }

    const offer = await this.cache.get(offerId);
    if (!offer) throw new Error('Flight offer expired');

    const existing = await this.prisma.flight.findFirst({
      where: {
        flightNumber: offer.flightNumber,
        originCode: offer.originCode,
        destinationCode: offer.destinationCode,
        departureTime: new Date(offer.departureTime),
      },
    });
    if (existing) return existing.id;

    const created = await this.prisma.flight.create({
      data: {
        airline: offer.airline,
        airlineLogo: offer.airlineLogo,
        flightNumber: offer.flightNumber,
        origin: offer.origin,
        originCode: offer.originCode,
        destination: offer.destination,
        destinationCode: offer.destinationCode,
        departureTime: new Date(offer.departureTime),
        arrivalTime: new Date(offer.arrivalTime),
        duration: offer.duration,
        price: offer.price,
        class: offer.class,
        stops: offer.stops,
        amenities: offer.amenities,
        aircraft: offer.aircraft,
        image: offer.image,
        rating: offer.rating,
        availableSeats: offer.availableSeats,
      },
    });
    return created.id;
  }

  private async searchDatabase(query: FlightSearchQuery): Promise<UnifiedFlightOffer[]> {
    const where: Record<string, unknown> = {};
    if (query.origin) where.originCode = { contains: query.origin, mode: 'insensitive' };
    if (query.destination) where.destinationCode = { contains: query.destination, mode: 'insensitive' };
    if (query.airline) where.airline = { contains: query.airline, mode: 'insensitive' };
    if (query.maxPrice) where.price = { lte: query.maxPrice };
    if (query.nonStop) where.stops = 0;

    const flights = await this.prisma.flight.findMany({
      where,
      orderBy: { price: 'asc' },
      take: 50,
    });

    return flights.map((f) => this.mapDbFlight(f));
  }

  private mapDbFlight(f: {
    id: string;
    airline: string;
    airlineLogo: string | null;
    flightNumber: string;
    origin: string;
    originCode: string;
    destination: string;
    destinationCode: string;
    departureTime: Date;
    arrivalTime: Date;
    duration: number;
    price: number;
    class: string;
    stops: number;
    amenities: string[];
    aircraft: string | null;
    image: string | null;
    rating: number;
    availableSeats: number;
  }): UnifiedFlightOffer {
    return {
      id: f.id,
      source: 'database',
      airline: f.airline,
      airlineLogo: f.airlineLogo ?? undefined,
      flightNumber: f.flightNumber,
      origin: f.origin,
      originCode: f.originCode,
      destination: f.destination,
      destinationCode: f.destinationCode,
      departureTime: f.departureTime.toISOString(),
      arrivalTime: f.arrivalTime.toISOString(),
      duration: f.duration,
      price: f.price,
      currency: 'USD',
      class: f.class,
      stops: f.stops,
      amenities: f.amenities,
      aircraft: f.aircraft ?? undefined,
      image: f.image ?? undefined,
      rating: f.rating,
      availableSeats: f.availableSeats,
    };
  }

  private dedupeOffers(offers: UnifiedFlightOffer[]): UnifiedFlightOffer[] {
    const seen = new Set<string>();
    return offers.filter((o) => {
      const key = `${o.originCode}-${o.destinationCode}-${o.flightNumber}-${o.departureTime.slice(0, 16)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private applyFilters(offers: UnifiedFlightOffer[], query: FlightSearchQuery) {
    return offers.filter((o) => {
      if (query.maxPrice && o.price > query.maxPrice) return false;
      if (query.airline && !o.airline.toLowerCase().includes(query.airline.toLowerCase())) return false;
      if (query.nonStop && o.stops > 0) return false;
      return true;
    });
  }

  private sortOffers(offers: UnifiedFlightOffer[], sort?: string) {
    const list = [...offers];
    switch (sort) {
      case 'price_desc':
        return list.sort((a, b) => b.price - a.price);
      case 'duration':
        return list.sort((a, b) => a.duration - b.duration);
      case 'departure':
        return list.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
      case 'price_asc':
      default:
        return list.sort((a, b) => a.price - b.price);
    }
  }
}
