import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UnifiedFlightOffer } from './flight-offer.types';

@Injectable()
export class FlightOfferCacheService {
  private readonly ttlMs = 24 * 60 * 60 * 1000;

  constructor(private prisma: PrismaService) {}

  async set(offer: UnifiedFlightOffer) {
    await this.prisma.externalOffer.upsert({
      where: { id: offer.id },
      create: {
        id: offer.id,
        type: 'FLIGHT',
        provider: offer.source || offer.id.split(':')[0] || 'external',
        payload: offer as object,
        expiresAt: new Date(Date.now() + this.ttlMs),
      },
      update: {
        payload: offer as object,
        expiresAt: new Date(Date.now() + this.ttlMs),
      },
    });
  }

  async setMany(offers: UnifiedFlightOffer[]) {
    await Promise.all(offers.map((o) => this.set(o)));
  }

  async get(id: string): Promise<UnifiedFlightOffer | null> {
    const row = await this.prisma.externalOffer.findUnique({ where: { id } });
    if (!row || row.type !== 'FLIGHT') return null;
    if (row.expiresAt.getTime() < Date.now()) {
      await this.prisma.externalOffer.delete({ where: { id } }).catch(() => undefined);
      return null;
    }
    return row.payload as unknown as UnifiedFlightOffer;
  }

  hasExternal(id: string) {
    return id.startsWith('amadeus:') || id.startsWith('skyscanner:');
  }
}
