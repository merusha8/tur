import { PrismaClient } from '@prisma/client';
import {
  FEATURED_CITIES,
  REALISTIC_RESORTS,
  REALISTIC_HOTELS,
  REALISTIC_TOURS,
  REALISTIC_FLIGHTS,
  REALISTIC_DESTINATIONS,
} from './realistic-seed-data';
import { slugify, uniqueSlug } from './helpers';

type CityRow = {
  id: string;
  name: string;
  slug: string;
  countryId: string;
  airportCode: string | null;
  latitude: number | null;
  longitude: number | null;
  image: string;
  country: { code: string; name: string };
};

export async function seedRealisticContent(
  prisma: PrismaClient,
  cityMetaBySlug: Map<string, { isCapital: boolean; isResortArea: boolean }>,
) {
  console.log('Injecting realistic curated data (Emirates, Rixos, Dubai, Maldives, Antalya)...');

  const countryRows = await prisma.country.findMany({ select: { id: true, code: true, name: true } });
  const countryByCode = new Map(countryRows.map((c) => [c.code, c]));

  const slugUsed = new Set((await prisma.city.findMany({ select: { slug: true } })).map((c) => c.slug));
  const iataUsed = new Set(
    (await prisma.airport.findMany({ select: { iataCode: true } })).map((a) => a.iataCode),
  );

  // Ensure featured cities exist
  for (const fc of FEATURED_CITIES) {
    const country = countryByCode.get(fc.countryCode);
    if (!country) continue;

    const existing = await prisma.city.findFirst({
      where: { countryId: country.id, name: fc.name },
      include: { country: { select: { code: true, name: true } } },
    });

    if (existing) {
      await prisma.city.update({
        where: { id: existing.id },
        data: {
          popular: fc.popular,
          airportCode: fc.iata ?? existing.airportCode,
          latitude: fc.latitude,
          longitude: fc.longitude,
          image: fc.image,
        },
      });
      cityMetaBySlug.set(existing.slug, { isCapital: false, isResortArea: fc.isResortArea });
      if (fc.iata) iataUsed.add(fc.iata);
      continue;
    }

    const slug = uniqueSlug(`${fc.name}-${fc.countryCode}`, slugUsed);
    const created = await prisma.city.create({
      data: {
        name: fc.name,
        slug,
        countryId: country.id,
        airportCode: fc.iata,
        image: fc.image,
        popular: fc.popular,
        latitude: fc.latitude,
        longitude: fc.longitude,
      },
      include: { country: { select: { code: true, name: true } } },
    });
    cityMetaBySlug.set(created.slug, { isCapital: false, isResortArea: fc.isResortArea });
    if (fc.iata) iataUsed.add(fc.iata);
  }

  const allCities = await prisma.city.findMany({
    include: { country: { select: { code: true, name: true } } },
  });
  const cityKey = (name: string, code: string) => `${name}:${code}`;
  const cityByKey = new Map(allCities.map((c) => [cityKey(c.name, c.country.code), c as CityRow]));

  // Airports for featured cities with IATA (ensure correct city linkage)
  for (const fc of FEATURED_CITIES) {
    if (!fc.iata) continue;
    const city = cityByKey.get(cityKey(fc.name, fc.countryCode));
    const country = countryByCode.get(fc.countryCode);
    if (!city || !country) continue;

    await prisma.city.update({
      where: { id: city.id },
      data: { airportCode: fc.iata },
    });

    await prisma.airport.upsert({
      where: { iataCode: fc.iata },
      update: {
        name: `${fc.name} International Airport`,
        cityId: city.id,
        countryId: country.id,
        latitude: fc.latitude,
        longitude: fc.longitude,
        isInternational: true,
      },
      create: {
        iataCode: fc.iata,
        name: `${fc.name} International Airport`,
        cityId: city.id,
        countryId: country.id,
        latitude: fc.latitude,
        longitude: fc.longitude,
        isInternational: true,
      },
    });
    iataUsed.add(fc.iata);
  }

  // JFK for Emirates NYC route
  const usCountry = countryByCode.get('US');
  if (usCountry) {
    let nyc = await prisma.city.findFirst({ where: { countryId: usCountry.id, name: 'New York' } });
    if (!nyc) {
      const slug = uniqueSlug('new-york-US', slugUsed);
      nyc = await prisma.city.create({
        data: {
          name: 'New York',
          slug,
          countryId: usCountry.id,
          airportCode: 'JFK',
          image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200',
          popular: true,
          latitude: 40.7128,
          longitude: -74.006,
        },
      });
    }
    await prisma.airport.upsert({
      where: { iataCode: 'JFK' },
      update: {
        name: 'John F. Kennedy International Airport',
        cityId: nyc.id,
        countryId: usCountry.id,
        latitude: 40.6413,
        longitude: -73.7781,
        isInternational: true,
      },
      create: {
        iataCode: 'JFK',
        name: 'John F. Kennedy International Airport',
        cityId: nyc.id,
        countryId: usCountry.id,
        latitude: 40.6413,
        longitude: -73.7781,
        isInternational: true,
      },
    });
  }

  const allAirports = await prisma.airport.findMany({ include: { city: true } });
  const airportByIata = new Map(allAirports.map((a) => [a.iataCode, a]));

  // Resorts
  const resortByKey = new Map<string, { id: string }>();
  for (const resort of REALISTIC_RESORTS) {
    const city = cityByKey.get(cityKey(resort.cityName, resort.countryCode));
    if (!city) continue;

    const existing = await prisma.resort.findFirst({
      where: { cityId: city.id, name: resort.name },
    });
    if (existing) {
      resortByKey.set(`${resort.cityName}:${resort.name}`, existing);
      continue;
    }

    const created = await prisma.resort.create({
      data: {
        cityId: city.id,
        name: resort.name,
        beachType: resort.beachType,
        description: resort.description,
        images: [...resort.images],
        rating: resort.rating,
      },
    });
    resortByKey.set(`${resort.cityName}:${resort.name}`, created);
  }

  // Hotels (upsert by name + city)
  const hotelByKey = new Map<string, { id: string; images: string[] }>();
  for (const hotel of REALISTIC_HOTELS) {
    const city = cityByKey.get(cityKey(hotel.cityName, hotel.countryCode));
    if (!city) continue;

    const resortId = hotel.resortName
      ? resortByKey.get(`${hotel.cityName}:${hotel.resortName}`)?.id
      : undefined;

    const existing = await prisma.hotel.findFirst({
      where: { cityId: city.id, name: hotel.name },
    });

    if (existing) {
      await prisma.hotel.update({
        where: { id: existing.id },
        data: {
          stars: hotel.stars,
          rating: hotel.rating,
          reviewsCount: hotel.reviewsCount,
          mealType: hotel.mealType,
          amenities: hotel.amenities,
          roomTypes: hotel.roomTypes,
          images: hotel.images,
          coordinates: hotel.coordinates,
          pricePerNight: hotel.pricePerNight,
          ...(resortId ? { resortId } : {}),
        },
      });
      hotelByKey.set(`${hotel.cityName}:${hotel.name}`, { id: existing.id, images: hotel.images });
      continue;
    }

    const created = await prisma.hotel.create({
      data: {
        cityId: city.id,
        resortId,
        name: hotel.name,
        stars: hotel.stars,
        rating: hotel.rating,
        reviewsCount: hotel.reviewsCount,
        amenities: hotel.amenities,
        mealType: hotel.mealType,
        roomTypes: hotel.roomTypes,
        images: hotel.images,
        coordinates: hotel.coordinates,
        pricePerNight: hotel.pricePerNight,
      },
    });
    hotelByKey.set(`${hotel.cityName}:${hotel.name}`, { id: created.id, images: hotel.images });
  }

  // Featured destinations
  const destSlugUsed = new Set(
    (await prisma.destination.findMany({ select: { slug: true } })).map((d) => d.slug),
  );
  for (const dest of REALISTIC_DESTINATIONS) {
    const city = cityByKey.get(cityKey(dest.cityName, dest.countryCode));
    if (!city) continue;

    const slug = dest.slug;
    await prisma.destination.upsert({
      where: { slug },
      update: {
        name: dest.cityName,
        country: city.country.name,
        description: dest.description,
        heroImage: city.image ?? dest.cityName,
        categories: [...dest.categories],
        featured: dest.featured,
        cityId: city.id,
        latitude: city.latitude,
        longitude: city.longitude,
        rating: 4.8,
        reviewCount: 2500,
      },
      create: {
        slug,
        name: dest.cityName,
        country: city.country.name,
        description: dest.description,
        heroImage: city.image ?? dest.cityName,
        images: REALISTIC_HOTELS.filter((h) => h.cityName === dest.cityName).slice(0, 3).flatMap((h) => h.images),
        categories: [...dest.categories],
        featured: dest.featured,
        cityId: city.id,
        latitude: city.latitude,
        longitude: city.longitude,
        rating: 4.8,
        reviewCount: 2500,
      },
    });
    destSlugUsed.add(slug);
  }

  // Tours
  const createdTourIds: string[] = [];
  for (const tour of REALISTIC_TOURS) {
    const city = cityByKey.get(cityKey(tour.cityName, tour.countryCode));
    const hotel = hotelByKey.get(`${tour.cityName}:${tour.hotelName}`);
    if (!city || !hotel) {
      console.warn(`Skipping tour "${tour.title}" — city or hotel not found (${tour.hotelName})`);
      continue;
    }

    const departureDate = new Date();
    departureDate.setDate(departureDate.getDate() + tour.daysUntilDeparture);
    const returnDate = new Date(departureDate);
    returnDate.setDate(returnDate.getDate() + tour.duration);

    const existing = await prisma.tour.findFirst({
      where: { title: tour.title, cityId: city.id },
    });

    if (existing) {
      await prisma.tour.update({
        where: { id: existing.id },
        data: {
          hotelId: hotel.id,
          description: tour.description,
          duration: tour.duration,
          departureDate,
          returnDate,
          price: tour.price,
          oldPrice: tour.oldPrice,
          hotTour: tour.hotTour,
          allInclusive: tour.allInclusive,
          airline: tour.airline,
          availableSeats: tour.availableSeats,
          images: tour.images,
        },
      });
      createdTourIds.push(existing.id);
    } else {
      const created = await prisma.tour.create({
        data: {
          countryId: city.countryId,
          cityId: city.id,
          hotelId: hotel.id,
          title: tour.title,
          description: tour.description,
          duration: tour.duration,
          departureDate,
          returnDate,
          price: tour.price,
          oldPrice: tour.oldPrice,
          hotTour: tour.hotTour,
          allInclusive: tour.allInclusive,
          airline: tour.airline,
          availableSeats: tour.availableSeats,
          images: tour.images,
        },
      });
      createdTourIds.push(created.id);
    }
  }

  // Hot tours for realistic hot tour packages
  const now = new Date();
  for (const tourSeed of REALISTIC_TOURS.filter((t) => t.hotTour)) {
    const tour = await prisma.tour.findFirst({ where: { title: tourSeed.title } });
    if (!tour) continue;

    const originalPrice = tour.oldPrice ?? Math.round(tour.price * 1.2);
    const discountPercent = Math.round(((originalPrice - tour.price) / originalPrice) * 100);
    const validFrom = new Date(now);
    const validUntil = new Date(now);
    validUntil.setDate(validUntil.getDate() + (tourSeed.daysUntilDeparture <= 14 ? 7 : 30));

    await prisma.hotTour.upsert({
      where: { tourId: tour.id },
      update: {
        originalPrice,
        discountedPrice: tour.price,
        discountPercent,
        validFrom,
        validUntil,
        departureCity: tourSeed.airline === 'Turkish Airlines' ? 'Istanbul' : 'Dubai',
        nights: tour.duration,
        mealPlan: tour.allInclusive ? 'All Inclusive' : 'Breakfast Only',
        lastMinute: tourSeed.daysUntilDeparture <= 14,
        seatsLeft: tour.availableSeats,
        isActive: true,
        featured: true,
      },
      create: {
        tourId: tour.id,
        originalPrice,
        discountedPrice: tour.price,
        discountPercent,
        validFrom,
        validUntil,
        departureCity: tourSeed.airline === 'Turkish Airlines' ? 'Istanbul' : 'Dubai',
        nights: tour.duration,
        mealPlan: tour.allInclusive ? 'All Inclusive' : 'Breakfast Only',
        lastMinute: tourSeed.daysUntilDeparture <= 14,
        seatsLeft: tour.availableSeats,
        isActive: true,
        featured: true,
      },
    });
  }

  // Priority airline flights
  let flightsAdded = 0;
  for (const f of REALISTIC_FLIGHTS) {
    const origin = airportByIata.get(f.originCode);
    const dest = airportByIata.get(f.destinationCode);
    if (!origin || !dest) {
      console.warn(`Skipping flight ${f.flightNumber} — airport ${f.originCode} or ${f.destinationCode} missing`);
      continue;
    }

    const existing = await prisma.flight.findFirst({
      where: { airline: f.airline, flightNumber: f.flightNumber },
    });
    if (existing) continue;

    const dep = new Date();
    dep.setDate(dep.getDate() + f.daysAhead);
    dep.setHours(f.departureHour, 0, 0, 0);
    const arr = new Date(dep.getTime() + f.durationMinutes * 60_000);

    await prisma.flight.create({
      data: {
        airline: f.airline,
        flightNumber: f.flightNumber,
        origin: f.originCity,
        originCode: f.originCode,
        destination: f.destinationCity,
        destinationCode: f.destinationCode,
        originAirportId: origin.id,
        destinationAirportId: dest.id,
        departureTime: dep,
        arrivalTime: arr,
        duration: f.durationMinutes,
        price: f.price,
        class: f.class,
        stops: f.stops,
        amenities: ['Wi-Fi', 'Meals', 'Entertainment'],
        aircraft: f.aircraft,
        image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800',
        rating: 4.7,
        availableSeats: 120,
      },
    });
    flightsAdded++;
  }

  // Search locations for featured cities
  for (const fc of FEATURED_CITIES) {
    const city = cityByKey.get(cityKey(fc.name, fc.countryCode));
    if (!city) continue;
    const existing = await prisma.searchLocation.findFirst({ where: { cityId: city.id } });
    const data = { name: city.name, country: city.country.name, type: 'city', slug: city.slug, cityId: city.id };
    if (existing) {
      await prisma.searchLocation.update({ where: { id: existing.id }, data });
    } else {
      await prisma.searchLocation.create({ data });
    }
  }

  const counts = {
    realisticHotels: REALISTIC_HOTELS.length,
    realisticTours: createdTourIds.length,
    realisticFlights: flightsAdded,
    realisticResorts: REALISTIC_RESORTS.length,
  };
  console.log('  ✓ Realistic seed:', counts);
  return counts;
}
