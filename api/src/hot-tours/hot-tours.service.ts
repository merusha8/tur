import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';



export const hotTourInclude = {

  tour: {

    select: {

      id: true,

      title: true,

      duration: true,

      price: true,

      oldPrice: true,

      hotTour: true,

      allInclusive: true,

      images: true,

      airline: true,

      departureDate: true,

      returnDate: true,

      availableSeats: true,

      city: { select: { id: true, name: true, slug: true } },

      country: { select: { id: true, name: true, code: true, flag: true } },

      hotel: { select: { id: true, name: true, stars: true, mealType: true, images: true } },

    },

  },

} as const;



export type HotTourQuery = {

  featured?: boolean;

  lastMinute?: boolean;

  search?: string;

  cityId?: string;

  countryId?: string;

  minPrice?: number;

  maxPrice?: number;

  mealPlan?: string;

  page?: number;

  limit?: number;

  sort?: string;

};



@Injectable()

export class HotToursService {

  constructor(private prisma: PrismaService) {}



  findAll(query: HotTourQuery) {

    const page = query.page || 1;

    const limit = Math.min(query.limit || 12, 50);

    const now = new Date();



    const tourWhere: Record<string, unknown> = {};

    if (query.search) {

      tourWhere.OR = [

        { title: { contains: query.search, mode: 'insensitive' } },

        { city: { name: { contains: query.search, mode: 'insensitive' } } },

        { country: { name: { contains: query.search, mode: 'insensitive' } } },

      ];

    }

    if (query.cityId) tourWhere.cityId = query.cityId;

    if (query.countryId) tourWhere.countryId = query.countryId;

    if (query.minPrice || query.maxPrice) {

      tourWhere.price = {};

      if (query.minPrice) (tourWhere.price as Record<string, number>).gte = query.minPrice;

      if (query.maxPrice) (tourWhere.price as Record<string, number>).lte = query.maxPrice;

    }

    if (query.mealPlan) tourWhere.hotel = { mealType: query.mealPlan };



    const where = {

      isActive: true,

      validUntil: { gte: now },

      ...(query.featured ? { featured: true } : {}),

      ...(query.lastMinute ? { lastMinute: true } : {}),

      ...(Object.keys(tourWhere).length ? { tour: tourWhere } : {}),

    };



    const orderBy =

      query.sort === 'discount' ? [{ discountPercent: 'desc' as const }]

      : query.sort === 'urgency' ? [{ validUntil: 'asc' as const }]

      : query.sort === 'seats' ? [{ seatsLeft: 'asc' as const }]

      : query.sort === 'price_asc' ? [{ discountedPrice: 'asc' as const }]

      : query.sort === 'price_desc' ? [{ discountedPrice: 'desc' as const }]

      : [{ featured: 'desc' as const }, { discountPercent: 'desc' as const }];



    return Promise.all([

      this.prisma.hotTour.findMany({

        where,

        orderBy,

        skip: (page - 1) * limit,

        take: limit,

        include: hotTourInclude,

      }),

      this.prisma.hotTour.count({ where }),

    ]).then(([data, total]) => ({ data, total, page, limit, totalPages: Math.ceil(total / limit) }));

  }



  async findOne(id: string) {

    const now = new Date();

    const deal = await this.prisma.hotTour.findFirst({

      where: { id, isActive: true, validUntil: { gte: now } },

      include: hotTourInclude,

    });

    if (!deal) throw new NotFoundException('Hot tour not found or expired');

    return deal;

  }



  async getFilters() {

    const [priceRange, mealPlans, activeCount] = await Promise.all([

      this.prisma.hotTour.aggregate({

        where: { isActive: true, validUntil: { gte: new Date() } },

        _min: { discountedPrice: true },

        _max: { discountedPrice: true },

      }),

      this.prisma.hotTour.findMany({

        where: { isActive: true },

        select: { mealPlan: true },

        distinct: ['mealPlan'],

        orderBy: { mealPlan: 'asc' },

      }),

      this.prisma.hotTour.count({ where: { isActive: true, validUntil: { gte: new Date() } } }),

    ]);



    return {

      activeCount,

      priceRange: {

        min: priceRange._min.discountedPrice ?? 0,

        max: priceRange._max.discountedPrice ?? 5000,

      },

      mealPlans: mealPlans.map((m) => m.mealPlan),

      sortOptions: [

        { value: 'discount', label: 'Highest discount' },

        { value: 'urgency', label: 'Ending soon' },

        { value: 'seats', label: 'Few seats left' },

        { value: 'price_asc', label: 'Price: Low to High' },

        { value: 'price_desc', label: 'Price: High to Low' },

      ],

    };

  }

}

