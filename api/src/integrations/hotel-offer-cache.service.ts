import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { UnifiedHotelOffer } from './hotel-offer.types';



@Injectable()

export class HotelOfferCacheService {

  private readonly ttlMs = 24 * 60 * 60 * 1000;



  constructor(private prisma: PrismaService) {}



  async set(offer: UnifiedHotelOffer) {

    await this.prisma.externalOffer.upsert({

      where: { id: offer.id },

      create: {

        id: offer.id,

        type: 'HOTEL',

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



  async setMany(offers: UnifiedHotelOffer[]) {

    await Promise.all(offers.map((o) => this.set(o)));

  }



  async get(id: string, options?: { touch?: boolean }): Promise<UnifiedHotelOffer | null> {

    const row = await this.prisma.externalOffer.findUnique({ where: { id } });

    if (!row || row.type !== 'HOTEL') return null;

    if (row.expiresAt.getTime() < Date.now()) {

      await this.prisma.externalOffer.delete({ where: { id } }).catch(() => undefined);

      return null;

    }

    if (options?.touch !== false) {

      await this.touch(id);

    }

    return row.payload as unknown as UnifiedHotelOffer;

  }



  async getExpiresAt(id: string): Promise<Date | null> {

    const row = await this.prisma.externalOffer.findUnique({ where: { id }, select: { expiresAt: true, type: true } });

    if (!row || row.type !== 'HOTEL') return null;

    if (row.expiresAt.getTime() < Date.now()) return null;

    return row.expiresAt;

  }



  async touch(id: string) {

    if (!this.hasExternal(id)) return;

    await this.prisma.externalOffer.updateMany({

      where: { id, expiresAt: { gt: new Date() } },

      data: { expiresAt: new Date(Date.now() + this.ttlMs) },

    });

  }



  hasExternal(id: string) {

    return id.startsWith('booking:') || id.startsWith('expedia:');

  }

}

