import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const analytics = await this.getAnalytics();
    return {
      stats: analytics.overview,
      recentBookings: analytics.recentBookings,
      bookingsByType: analytics.bookingsByType,
      revenueByMonth: analytics.revenueByMonth,
    };
  }

  async getAnalytics() {
    const [overview, bookingsByType, bookingsByStatus, payments, recentBookings, hotToursActive] = await Promise.all([
      this.getOverviewStats(),
      this.prisma.booking.groupBy({ by: ['type'], _count: { type: true } }),
      this.prisma.booking.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.payment.findMany({
        where: { status: 'SUCCEEDED' },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
      this.prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          flight: true,
          hotel: true,
          tour: true,
          payment: true,
        },
      }),
      this.prisma.hotTour.count({ where: { isActive: true, validUntil: { gte: new Date() } } }),
    ]);

    const monthMap = new Map<string, { revenue: number; bookings: number }>();
    for (const p of payments) {
      const key = p.createdAt.toISOString().slice(0, 7);
      const row = monthMap.get(key) || { revenue: 0, bookings: 0 };
      row.revenue += p.amount;
      row.bookings += 1;
      monthMap.set(key, row);
    }

    const revenueByMonth = [...monthMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({ month, ...data }));

    return {
      overview: { ...overview, hotToursActive },
      bookingsByType: Object.fromEntries(bookingsByType.map((b) => [b.type, b._count.type])),
      bookingsByStatus: Object.fromEntries(bookingsByStatus.map((b) => [b.status, b._count.status])),
      revenueByMonth,
      recentBookings,
    };
  }

  private async getOverviewStats() {
    const [users, bookings, flights, hotels, tours, destinations, payments, revenue] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.booking.count(),
      this.prisma.flight.count(),
      this.prisma.hotel.count(),
      this.prisma.tour.count(),
      this.prisma.destination.count(),
      this.prisma.payment.count({ where: { status: 'SUCCEEDED' } }),
      this.prisma.payment.aggregate({ where: { status: 'SUCCEEDED' }, _sum: { amount: true } }),
    ]);
    return {
      users,
      bookings,
      flights,
      hotels,
      tours,
      destinations,
      payments,
      revenue: revenue._sum.amount || 0,
    };
  }

  async getUsers() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, firstName: true, lastName: true, role: true, banned: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBookings() {
    return this.prisma.booking.findMany({
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        flight: true,
        hotel: { include: { city: { select: { name: true } } } },
        tour: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFlights(query?: { search?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = Math.min(query?.limit || 50, 100);
    const where = query?.search
      ? {
          OR: [
            { airline: { contains: query.search, mode: 'insensitive' as const } },
            { flightNumber: { contains: query.search, mode: 'insensitive' as const } },
            { originCode: { contains: query.search, mode: 'insensitive' as const } },
            { destinationCode: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.flight.findMany({
        where,
        orderBy: { departureTime: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.flight.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createFlight(data: {
    airline: string;
    flightNumber: string;
    origin: string;
    originCode: string;
    destination: string;
    destinationCode: string;
    originAirportId?: string;
    destinationAirportId?: string;
    departureTime: string;
    arrivalTime: string;
    duration: number;
    price: number;
    class?: string;
    stops?: number;
    amenities?: string[];
    aircraft?: string;
    image?: string;
    rating?: number;
    availableSeats?: number;
  }) {
    const originCode = data.originCode.toUpperCase();
    const destinationCode = data.destinationCode.toUpperCase();

    let originAirportId = data.originAirportId;
    let destinationAirportId = data.destinationAirportId;

    if (!originAirportId) {
      const airport = await this.prisma.airport.findFirst({ where: { iataCode: originCode } });
      originAirportId = airport?.id;
    }
    if (!destinationAirportId) {
      const airport = await this.prisma.airport.findFirst({ where: { iataCode: destinationCode } });
      destinationAirportId = airport?.id;
    }

    return this.prisma.flight.create({
      data: {
        airline: data.airline,
        flightNumber: data.flightNumber,
        origin: data.origin,
        originCode,
        destination: data.destination,
        destinationCode,
        originAirportId,
        destinationAirportId,
        departureTime: new Date(data.departureTime),
        arrivalTime: new Date(data.arrivalTime),
        duration: data.duration,
        price: data.price,
        class: data.class ?? 'Economy',
        stops: data.stops ?? 0,
        amenities: data.amenities ?? ['Wi-Fi', 'Meals'],
        aircraft: data.aircraft,
        image: data.image,
        rating: data.rating ?? 4.5,
        availableSeats: data.availableSeats ?? 100,
      },
    });
  }

  async updateFlight(id: string, data: Record<string, unknown>) {
    const exists = await this.prisma.flight.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Flight not found');

    const payload = { ...data };
    if (typeof payload.originCode === 'string') payload.originCode = payload.originCode.toUpperCase();
    if (typeof payload.destinationCode === 'string') payload.destinationCode = payload.destinationCode.toUpperCase();
    if (payload.departureTime) payload.departureTime = new Date(payload.departureTime as string);
    if (payload.arrivalTime) payload.arrivalTime = new Date(payload.arrivalTime as string);

    return this.prisma.flight.update({ where: { id }, data: payload as never });
  }

  async deleteFlight(id: string) {
    const flight = await this.prisma.flight.findUnique({
      where: { id },
      include: { _count: { select: { bookings: true } } },
    });
    if (!flight) throw new NotFoundException('Flight not found');
    if (flight._count.bookings > 0) {
      throw new BadRequestException('Cannot delete flight with existing bookings');
    }
    return this.prisma.flight.delete({ where: { id } });
  }

  async getAirports(search?: string) {
    return this.prisma.airport.findMany({
      where: search
        ? {
            OR: [
              { iataCode: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
              { city: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : undefined,
      orderBy: { iataCode: 'asc' },
      take: 100,
      select: {
        id: true,
        name: true,
        iataCode: true,
        city: { select: { name: true, country: { select: { name: true } } } },
      },
    });
  }

  async getHotels() {
    return this.prisma.hotel.findMany({
      orderBy: { createdAt: 'desc' },
      include: { city: { select: { id: true, name: true, country: { select: { name: true } } } }, resort: true },
    });
  }

  async createHotel(data: {
    cityId: string;
    name: string;
    stars?: number;
    rating?: number;
    pricePerNight: number;
    mealType?: string;
    amenities?: string[];
    roomTypes?: string[];
    images?: string[];
    coordinates?: { lat: number; lng: number };
    resortId?: string;
  }) {
    const city = await this.prisma.city.findUnique({ where: { id: data.cityId } });
    if (!city) throw new BadRequestException('City not found');

    return this.prisma.hotel.create({
      data: {
        cityId: data.cityId,
        resortId: data.resortId,
        name: data.name,
        stars: data.stars ?? 4,
        rating: data.rating ?? 4.5,
        reviewsCount: 0,
        amenities: data.amenities ?? ['Wi-Fi', 'Pool'],
        mealType: data.mealType ?? 'Breakfast Only',
        roomTypes: data.roomTypes ?? ['Standard Room'],
        images: data.images?.length ? data.images : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'],
        coordinates: data.coordinates ?? { lat: city.latitude ?? 0, lng: city.longitude ?? 0 },
        pricePerNight: data.pricePerNight,
      },
      include: { city: { select: { name: true, country: { select: { name: true } } } } },
    });
  }

  async updateHotel(id: string, data: Record<string, unknown>) {
    const exists = await this.prisma.hotel.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Hotel not found');
    return this.prisma.hotel.update({
      where: { id },
      data: data as never,
      include: { city: { select: { name: true, country: { select: { name: true } } } } },
    });
  }

  async getDestinations() {
    return this.prisma.destination.findMany({
      orderBy: { name: 'asc' },
      include: { city: { select: { id: true, name: true } } },
    });
  }

  async createDestination(data: {
    name: string;
    country: string;
    description: string;
    heroImage: string;
    images?: string[];
    categories?: string[];
    rating?: number;
    reviewCount?: number;
    featured?: boolean;
    cityId?: string;
    latitude?: number;
    longitude?: number;
  }) {
    const slug = this.slugify(data.name);
    return this.prisma.destination.create({
      data: {
        slug,
        name: data.name,
        country: data.country,
        description: data.description,
        heroImage: data.heroImage,
        images: data.images ?? [data.heroImage],
        categories: data.categories ?? [],
        rating: data.rating ?? 4.5,
        reviewCount: data.reviewCount ?? 0,
        featured: data.featured ?? false,
        cityId: data.cityId,
        latitude: data.latitude,
        longitude: data.longitude,
      },
    });
  }

  async updateDestination(id: string, data: Record<string, unknown>) {
    const exists = await this.prisma.destination.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Destination not found');
    const payload = { ...data };
    if (typeof payload.name === 'string') payload.slug = this.slugify(payload.name);
    return this.prisma.destination.update({ where: { id }, data: payload as never });
  }

  async deleteDestination(id: string) {
    const exists = await this.prisma.destination.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Destination not found');
    return this.prisma.destination.delete({ where: { id } });
  }

  async getTours(query?: { search?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = Math.min(query?.limit || 50, 100);
    const where = query?.search
      ? { title: { contains: query.search, mode: 'insensitive' as const } }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.tour.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          city: { select: { id: true, name: true } },
          country: { select: { id: true, name: true } },
          hotel: { select: { id: true, name: true } },
          hotTourDeal: true,
        },
      }),
      this.prisma.tour.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createTour(data: {
    countryId: string;
    cityId: string;
    hotelId: string;
    title: string;
    description: string;
    duration: number;
    departureDate: string;
    returnDate: string;
    price: number;
    oldPrice?: number;
    hotTour?: boolean;
    allInclusive?: boolean;
    availableSeats?: number;
    airline: string;
    images?: string[];
  }) {
    return this.prisma.tour.create({
      data: {
        ...data,
        departureDate: new Date(data.departureDate),
        returnDate: new Date(data.returnDate),
        images: data.images?.length ? data.images : ['https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800'],
        hotTour: data.hotTour ?? false,
        allInclusive: data.allInclusive ?? false,
        availableSeats: data.availableSeats ?? 20,
      },
      include: { city: true, country: true, hotel: true },
    });
  }

  async updateTour(id: string, data: Record<string, unknown>) {
    const payload = { ...data };
    if (payload.departureDate) payload.departureDate = new Date(payload.departureDate as string);
    if (payload.returnDate) payload.returnDate = new Date(payload.returnDate as string);
    return this.prisma.tour.update({
      where: { id },
      data: payload as never,
      include: { city: true, country: true, hotel: true, hotTourDeal: true },
    });
  }

  async deleteTour(id: string) {
    await this.prisma.hotTour.deleteMany({ where: { tourId: id } });
    return this.prisma.tour.delete({ where: { id } });
  }

  async getHotTours() {
    return this.prisma.hotTour.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tour: {
          include: {
            city: { select: { name: true } },
            country: { select: { name: true } },
          },
        },
      },
    });
  }

  async createHotTour(data: {
    tourId: string;
    originalPrice: number;
    discountedPrice: number;
    discountPercent?: number;
    validFrom: string;
    validUntil: string;
    departureCity: string;
    nights: number;
    mealPlan?: string;
    lastMinute?: boolean;
    seatsLeft?: number;
    featured?: boolean;
  }) {
    const tour = await this.prisma.tour.findUnique({ where: { id: data.tourId } });
    if (!tour) throw new BadRequestException('Tour not found');

    const discountPercent = data.discountPercent
      ?? Math.round((1 - data.discountedPrice / data.originalPrice) * 100);

    const [hotTour] = await this.prisma.$transaction([
      this.prisma.hotTour.create({
        data: {
          tourId: data.tourId,
          originalPrice: data.originalPrice,
          discountedPrice: data.discountedPrice,
          discountPercent,
          validFrom: new Date(data.validFrom),
          validUntil: new Date(data.validUntil),
          departureCity: data.departureCity,
          nights: data.nights,
          mealPlan: data.mealPlan ?? 'All Inclusive',
          lastMinute: data.lastMinute ?? false,
          seatsLeft: data.seatsLeft ?? 10,
          featured: data.featured ?? false,
        },
        include: { tour: true },
      }),
      this.prisma.tour.update({
        where: { id: data.tourId },
        data: { hotTour: true, price: data.discountedPrice, oldPrice: data.originalPrice },
      }),
    ]);

    return hotTour;
  }

  async updateHotTour(id: string, data: Record<string, unknown>) {
    const payload = { ...data };
    if (payload.validFrom) payload.validFrom = new Date(payload.validFrom as string);
    if (payload.validUntil) payload.validUntil = new Date(payload.validUntil as string);

    const hotTour = await this.prisma.hotTour.update({
      where: { id },
      data: payload as never,
      include: { tour: true },
    });

    if (data.discountedPrice != null || data.originalPrice != null) {
      await this.prisma.tour.update({
        where: { id: hotTour.tourId },
        data: {
          ...(data.discountedPrice != null ? { price: Number(data.discountedPrice) } : {}),
          ...(data.originalPrice != null ? { oldPrice: Number(data.originalPrice) } : {}),
          hotTour: true,
        },
      });
    }

    return hotTour;
  }

  async deleteHotTour(id: string) {
    const hotTour = await this.prisma.hotTour.findUnique({ where: { id } });
    if (!hotTour) throw new NotFoundException('Hot tour not found');
    await this.prisma.tour.update({ where: { id: hotTour.tourId }, data: { hotTour: false } });
    return this.prisma.hotTour.delete({ where: { id } });
  }

  async getPayments() {
    return this.prisma.payment.findMany({
      include: { user: { select: { email: true } }, booking: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFormOptions(query?: { citySearch?: string; hotelSearch?: string; tourSearch?: string }) {
    const cityWhere = query?.citySearch
      ? { name: { contains: query.citySearch, mode: 'insensitive' as const } }
      : undefined;
    const hotelWhere = query?.hotelSearch
      ? { name: { contains: query.hotelSearch, mode: 'insensitive' as const } }
      : undefined;
    const tourWhere = query?.tourSearch
      ? { title: { contains: query.tourSearch, mode: 'insensitive' as const } }
      : undefined;

    const [countries, cities, hotels, tours] = await Promise.all([
      this.prisma.country.findMany({ select: { id: true, name: true, code: true }, orderBy: { name: 'asc' }, take: 300 }),
      this.prisma.city.findMany({
        where: cityWhere,
        select: { id: true, name: true, countryId: true },
        orderBy: { name: 'asc' },
        take: 100,
      }),
      this.prisma.hotel.findMany({
        where: hotelWhere,
        select: { id: true, name: true, cityId: true },
        orderBy: { name: 'asc' },
        take: 100,
      }),
      this.prisma.tour.findMany({
        where: tourWhere,
        select: { id: true, title: true, price: true, oldPrice: true, duration: true, city: { select: { name: true } } },
        orderBy: { title: 'asc' },
        take: 100,
      }),
    ]);
    return { countries, cities, hotels, tours };
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async getCountries() {
    return this.prisma.country.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { cities: true, tours: true } } },
    });
  }

  async createCountry(data: {
    name: string;
    code: string;
    flag?: string;
    currency?: string;
    language?: string;
    description?: string;
    visaRequired?: boolean;
  }) {
    const slug = this.slugify(data.name);
    const code = data.code.toUpperCase();
    return this.prisma.country.create({
      data: {
        name: data.name,
        slug,
        code,
        flag: data.flag || '🌍',
        currency: data.currency || 'USD',
        language: data.language || 'English',
        description: data.description || '',
        visaRequired: data.visaRequired ?? false,
      },
    });
  }

  async updateCountry(id: string, data: Record<string, unknown>) {
    const exists = await this.prisma.country.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Country not found');
    const payload = { ...data };
    if (typeof payload.name === 'string') payload.slug = this.slugify(payload.name);
    if (typeof payload.code === 'string') payload.code = payload.code.toUpperCase();
    return this.prisma.country.update({ where: { id }, data: payload as never });
  }

  async deleteCountry(id: string) {
    const exists = await this.prisma.country.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Country not found');
    return this.prisma.country.delete({ where: { id } });
  }

  async getCities(countryId?: string) {
    return this.prisma.city.findMany({
      where: countryId ? { countryId } : undefined,
      orderBy: { name: 'asc' },
      take: 1000,
      include: { country: { select: { id: true, name: true, code: true } } },
    });
  }

  async createCity(data: {
    countryId: string;
    name: string;
    image?: string;
    popular?: boolean;
    airportCode?: string;
    latitude?: number;
    longitude?: number;
  }) {
    const country = await this.prisma.country.findUnique({ where: { id: data.countryId } });
    if (!country) throw new BadRequestException('Country not found');
    const slug = this.slugify(data.name);
    return this.prisma.city.create({
      data: {
        countryId: data.countryId,
        name: data.name,
        slug,
        image: data.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
        popular: data.popular ?? false,
        airportCode: data.airportCode,
        latitude: data.latitude,
        longitude: data.longitude,
      },
      include: { country: { select: { name: true } } },
    });
  }

  async updateCity(id: string, data: Record<string, unknown>) {
    const exists = await this.prisma.city.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('City not found');
    const payload = { ...data };
    if (typeof payload.name === 'string') payload.slug = this.slugify(payload.name);
    return this.prisma.city.update({
      where: { id },
      data: payload as never,
      include: { country: { select: { name: true } } },
    });
  }

  async deleteCity(id: string) {
    const exists = await this.prisma.city.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('City not found');
    return this.prisma.city.delete({ where: { id } });
  }

  async updateUserRole(id: string, role: 'USER' | 'ADMIN') {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, banned: true, createdAt: true },
    });
  }

  async updateUserBanned(id: string, banned: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'ADMIN' && banned) {
      throw new BadRequestException('Cannot ban an admin account');
    }
    return this.prisma.user.update({
      where: { id },
      data: { banned },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, banned: true, createdAt: true },
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'ADMIN') {
      throw new BadRequestException('Cannot delete an admin account');
    }
    return this.prisma.user.delete({ where: { id } });
  }

  async updateBookingStatus(id: string, status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED') {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    return this.prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        flight: true,
        hotel: { include: { city: { select: { name: true } } } },
        tour: true,
        payment: true,
      },
    });
  }

  async deleteHotel(id: string) {
    const hotel = await this.prisma.hotel.findUnique({ where: { id }, include: { _count: { select: { bookings: true } } } });
    if (!hotel) throw new NotFoundException('Hotel not found');
    if (hotel._count.bookings > 0) {
      throw new BadRequestException('Cannot delete hotel with existing bookings');
    }
    return this.prisma.hotel.delete({ where: { id } });
  }

  async getReviews(query?: { verified?: string; featured?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = Math.min(query?.limit || 50, 100);
    const where: Record<string, unknown> = {};
    if (query?.verified === 'true') where.verified = true;
    if (query?.verified === 'false') where.verified = false;
    if (query?.featured === 'true') where.featured = true;

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          hotel: { select: { name: true } },
          tour: { select: { title: true } },
          flight: { select: { airline: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateReview(id: string, data: { verified?: boolean; featured?: boolean }) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    return this.prisma.review.update({
      where: { id },
      data,
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
    });
  }

  async deleteReview(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    return this.prisma.review.delete({ where: { id } });
  }

  async getNewsletterSubscriptions() {
    return this.prisma.newsletterSubscription.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async updateNewsletterSubscription(id: string, data: { active: boolean }) {
    const sub = await this.prisma.newsletterSubscription.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('Subscription not found');
    return this.prisma.newsletterSubscription.update({ where: { id }, data });
  }

  async deleteNewsletterSubscription(id: string) {
    const sub = await this.prisma.newsletterSubscription.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('Subscription not found');
    return this.prisma.newsletterSubscription.delete({ where: { id } });
  }

  async getContactInquiries() {
    return this.prisma.contactInquiry.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async deleteContactInquiry(id: string) {
    const inquiry = await this.prisma.contactInquiry.findUnique({ where: { id } });
    if (!inquiry) throw new NotFoundException('Inquiry not found');
    return this.prisma.contactInquiry.delete({ where: { id } });
  }

  async getResorts() {
    return this.prisma.resort.findMany({
      orderBy: { name: 'asc' },
      include: { city: { select: { id: true, name: true, country: { select: { name: true } } } }, _count: { select: { hotels: true } } },
    });
  }

  async createResort(data: {
    cityId: string;
    name: string;
    beachType: string;
    description: string;
    images?: string[];
    rating?: number;
  }) {
    const city = await this.prisma.city.findUnique({ where: { id: data.cityId } });
    if (!city) throw new BadRequestException('City not found');
    return this.prisma.resort.create({
      data: {
        cityId: data.cityId,
        name: data.name,
        beachType: data.beachType,
        description: data.description,
        images: data.images?.length ? data.images : ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'],
        rating: data.rating ?? 4.5,
      },
      include: { city: { select: { name: true, country: { select: { name: true } } } } },
    });
  }

  async updateResort(id: string, data: Record<string, unknown>) {
    const exists = await this.prisma.resort.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Resort not found');
    return this.prisma.resort.update({
      where: { id },
      data: data as never,
      include: { city: { select: { name: true, country: { select: { name: true } } } } },
    });
  }

  async deleteResort(id: string) {
    const resort = await this.prisma.resort.findUnique({
      where: { id },
      include: { _count: { select: { hotels: true } } },
    });
    if (!resort) throw new NotFoundException('Resort not found');
    if (resort._count.hotels > 0) {
      throw new BadRequestException('Cannot delete resort with linked hotels');
    }
    return this.prisma.resort.delete({ where: { id } });
  }
}
