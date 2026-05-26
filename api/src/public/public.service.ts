import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { hotTourInclude } from '../hot-tours/hot-tours.service';

const hotelHomeSelect = {
  id: true,
  name: true,
  stars: true,
  rating: true,
  reviewsCount: true,
  mealType: true,
  images: true,
  pricePerNight: true,
  city: { select: { name: true, slug: true, country: { select: { name: true } } } },
} as const;

const PLAN_TRIP_CITIES = [
  { query: 'Istanbul', label: 'Istanbul' },
  { query: 'Paris', label: 'Paris' },
  { query: 'Tokyo', label: 'Tokyo' },
  { query: 'Malé', label: 'Maldives' },
  { query: 'Dubai', label: 'Dubai' },
  { query: 'London', label: 'London' },
  { query: 'Bali', label: 'Bali' },
  { query: 'New York', label: 'New York' },
] as const;

@Injectable()
export class PublicService {
  constructor(private prisma: PrismaService) {}

  async getHome() {
    const now = new Date();
    const activeHotWhere = { isActive: true, validUntil: { gte: now } };

    const [hero, promoBanners, hotTours, bestDeals, trendingDestinations, popularHotels, featuredReviews, planTripCities] =
      await Promise.all([
        this.prisma.siteSetting.findMany({
          where: { key: { in: ['hero_image', 'hero_title', 'hero_subtitle'] } },
        }),
        this.prisma.promoBanner.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
        this.prisma.hotTour.findMany({
          where: { ...activeHotWhere, featured: true },
          take: 6,
          orderBy: [{ lastMinute: 'desc' }, { discountPercent: 'desc' }],
          include: hotTourInclude,
        }),
        this.prisma.hotTour.findMany({
          where: activeHotWhere,
          take: 4,
          orderBy: { discountPercent: 'desc' },
          include: hotTourInclude,
        }),
        this.prisma.destination.findMany({
          orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
          take: 8,
          select: {
            id: true,
            slug: true,
            name: true,
            country: true,
            heroImage: true,
            categories: true,
            rating: true,
            reviewCount: true,
          },
        }),
        this.prisma.hotel.findMany({
          orderBy: [{ rating: 'desc' }, { reviewsCount: 'desc' }],
          take: 6,
          select: hotelHomeSelect,
        }),
        this.prisma.review.findMany({
          where: { featured: true },
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { firstName: true, lastName: true } } },
        }),
        this.getPlanTripCities(),
      ]);

    const heroMap = Object.fromEntries(hero.map((s: { key: string; value: string }) => [s.key, s.value]));
    return {
      hero: {
        image: heroMap.hero_image || '',
        title: heroMap.hero_title || '',
        subtitle: heroMap.hero_subtitle || '',
      },
      promoBanners,
      hotTours,
      bestDeals,
      trendingDestinations,
      popularHotels,
      featuredReviews,
      planTripCities,
    };
  }

  private async getPlanTripCities() {
    const results = await Promise.all(
      PLAN_TRIP_CITIES.map(async ({ query, label }) => {
        const city = await this.prisma.city.findFirst({
          where: {
            OR: [
              { name: { equals: query, mode: 'insensitive' } },
              { name: { contains: query, mode: 'insensitive' } },
              { slug: { contains: query.toLowerCase().replace(/\s+/g, '-'), mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            country: { select: { name: true } },
          },
          orderBy: [{ popular: 'desc' }, { name: 'asc' }],
        });
        if (!city) return null;
        return { ...city, displayName: label };
      }),
    );
    return results.filter(Boolean);
  }

  async getStats() {
    const [countries, cities, airports, resorts, destinations, tours, hotels, flights, hotTours, bookings, users, avgRating] =
      await Promise.all([
        this.prisma.country.count(),
        this.prisma.city.count(),
        this.prisma.airport.count(),
        this.prisma.resort.count(),
        this.prisma.destination.count(),
        this.prisma.tour.count(),
        this.prisma.hotel.count(),
        this.prisma.flight.count(),
        this.prisma.hotTour.count({ where: { isActive: true } }),
        this.prisma.booking.count({ where: { status: 'CONFIRMED' } }),
        this.prisma.user.count({ where: { role: 'USER' } }),
        this.prisma.review.aggregate({ _avg: { rating: true } }),
      ]);

    return {
      countries,
      cities,
      airports,
      resorts,
      destinations,
      tours,
      hotels,
      flights,
      hotTours,
      confirmedBookings: bookings,
      travelers: users,
      averageRating: avgRating._avg.rating ? Number(avgRating._avg.rating.toFixed(1)) : 0,
    };
  }

  async getContactInfo() {
    const settings = await this.prisma.siteSetting.findMany({
      where: { key: { in: ['contact_email', 'contact_phone', 'contact_address', 'about_mission', 'about_why_choose'] } },
    });
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return {
      email: map.contact_email || '',
      phone: map.contact_phone || '',
      address: map.contact_address || '',
      mission: map.about_mission || '',
      whyChoose: map.about_why_choose ? JSON.parse(map.about_why_choose) : [],
    };
  }

  async getFooter() {
    const [destinations, categories] = await Promise.all([
      this.prisma.destination.findMany({ orderBy: { name: 'asc' }, take: 5, select: { name: true, slug: true } }),
      this.prisma.vacationCategory.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' }, take: 8, select: { name: true, slug: true } }),
    ]);
    return {
      destinations,
      tourCategories: categories.map((c) => c.name),
    };
  }

  async submitContact(data: { firstName: string; lastName: string; email: string; subject: string; message: string }) {
    return this.prisma.contactInquiry.create({ data });
  }

  async subscribeNewsletter(email: string) {
    const normalized = email.trim().toLowerCase();
    return this.prisma.newsletterSubscription.upsert({
      where: { email: normalized },
      create: { email: normalized },
      update: { active: true },
    });
  }

  async getPageBanner(href: string) {
    return this.prisma.promoBanner.findFirst({ where: { href, active: true } });
  }
}
