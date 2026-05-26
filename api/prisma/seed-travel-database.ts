import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import {
  VACATION_CATEGORIES,
  RESORT_TYPES,
  BEACH_TYPES,
  AIRLINES,
  HOTEL_BRANDS,
  HOTEL_SUFFIXES,
  AMENITIES,
  FREEBIES,
  MEAL_PLANS,
  ROOM_TYPES,
  TOUR_PREFIXES,
  TOUR_SUFFIXES,
  IMAGE_POOL,
  CITY_SUFFIXES,
  CITY_PREFIXES,
  KNOWN_IATA,
} from './data/travel-constants';
import {
  slugify,
  mulberry32,
  pick,
  pickN,
  randInt,
  randFloat,
  batchCreateMany,
  uniqueSlug,
  generateIata,
} from './data/helpers';
import { buildCountryDescription, isVisaRequired } from './data/country-meta';
import { seedRealisticContent } from './data/seed-realistic-content';
import { PRIORITY_AIRLINES } from './data/realistic-seed-data';
import * as bcrypt from 'bcryptjs';

type CountryRow = {
  code: string;
  name: string;
  nameRu: string;
  region: string;
  capital: string;
  population: number;
  flag: string;
  currency: string;
  language: string;
};

const prisma = new PrismaClient();
const rand = mulberry32(42);

const TOURIST_CITY_NAMES = ['Maldives', 'Phuket', 'Bali', 'Antalya', 'Sharm', 'Cancún', 'Hurghada', 'Dubai', 'Paris', 'Rome', 'Barcelona'];

type CitySeedMeta = { isCapital: boolean; isResortArea: boolean };

function loadCountries(): CountryRow[] {
  const file = path.join(__dirname, 'data', 'countries.json');
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as CountryRow[];
}

function citiesForCountry(population: number, region: string): number {
  const base = population > 100_000_000 ? 95 : population > 50_000_000 ? 70 : population > 20_000_000 ? 50 : population > 5_000_000 ? 35 : population > 1_000_000 ? 22 : 15;
  const regionBonus = region === 'Europe' || region === 'Asia' ? 5 : 0;
  return Math.min(120, base + regionBonus + randInt(0, 8, rand));
}

function generateCityNames(country: CountryRow, count: number, usedNames: Set<string>): string[] {
  const names: string[] = [];
  if (!usedNames.has(country.capital)) {
    names.push(country.capital);
    usedNames.add(country.capital);
  }
  const regional = ['North', 'South', 'Central', 'East', 'West'];
  for (const r of regional) {
    if (names.length >= count) break;
    const n = `${r} ${country.name}`;
    if (!usedNames.has(n)) {
      names.push(n);
      usedNames.add(n);
    }
  }
  while (names.length < count) {
    const style = randInt(0, 2, rand);
    let name: string;
    if (style === 0) {
      name = `${pick(CITY_PREFIXES, rand)} ${pick(CITY_SUFFIXES, rand).replace(/^[a-z]/, (c) => c.toUpperCase())}`;
    } else if (style === 1) {
      name = `${country.name.slice(0, 4)}${pick(['ton', 'ville', 'berg', 'ford'], rand)}`;
    } else {
      name = `${pick(CITY_PREFIXES, rand)} ${country.capital.slice(0, 5)}${pick(CITY_SUFFIXES, rand)}`;
    }
    name = name.charAt(0).toUpperCase() + name.slice(1);
    if (!usedNames.has(name)) {
      names.push(name);
      usedNames.add(name);
    }
  }
  return names.slice(0, count);
}

export async function seedTravelDatabase() {
  console.log('\n🌍 Seeding travel database...\n');
  const countries = loadCountries();
  const slugUsed = new Set<string>();
  const iataUsed = new Set<string>(Object.values(KNOWN_IATA));

  // Clear travel data (preserve users, settings, bookings if any)
  console.log('Clearing existing travel data...');
  await prisma.$transaction([
    prisma.hotTour.deleteMany(),
    prisma.review.deleteMany({ where: { OR: [{ tourId: { not: null } }, { hotelId: { not: null } }, { flightId: { not: null } }, { destinationId: { not: null } }] } }),
    prisma.favorite.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.flight.deleteMany(),
    prisma.tour.deleteMany(),
    prisma.hotel.deleteMany(),
    prisma.destination.deleteMany(),
    prisma.resort.deleteMany(),
    prisma.airport.deleteMany(),
    prisma.city.deleteMany(),
    prisma.vacationCategory.deleteMany(),
    prisma.country.deleteMany(),
    prisma.searchLocation.deleteMany(),
  ]);

  // Countries
  const countryRecords = countries.map((c) => ({
    name: c.name,
    slug: uniqueSlug(c.name, slugUsed),
    code: c.code,
    flag: c.flag,
    currency: c.currency || 'USD',
    language: c.language || 'English',
    visaRequired: isVisaRequired(c.code),
    description: buildCountryDescription(c.name, c.region, c.capital),
  }));
  await batchCreateMany(countryRecords, 100, (batch) => prisma.country.createMany({ data: batch, skipDuplicates: true }), 'Countries');

  const countryRows = await prisma.country.findMany({ select: { id: true, code: true, name: true } });
  const countryByCode = new Map(countryRows.map((c) => [c.code, c]));

  // Vacation categories
  await prisma.vacationCategory.createMany({ data: VACATION_CATEGORIES });
  const categories = await prisma.vacationCategory.findMany();
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  // Cities
  console.log('Generating cities...');
  const citySlugUsed = new Set<string>();
  const cityMetaBySlug = new Map<string, CitySeedMeta>();
  const cityRecords: {
    slug: string;
    name: string;
    countryId: string;
    airportCode: string | null;
    image: string;
    popular: boolean;
    latitude: number;
    longitude: number;
  }[] = [];

  for (const c of countries) {
    const country = countryByCode.get(c.code);
    if (!country) continue;
    const count = citiesForCountry(c.population, c.region);
    const usedNames = new Set<string>();
    const names = generateCityNames(c, count, usedNames);
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const isCapital = name === c.capital;
      const isResortArea =
        rand() < 0.12 || TOURIST_CITY_NAMES.some((r) => name.includes(r));
      const knownIata = KNOWN_IATA[name];
      let airportCode: string | null = null;
      if (knownIata && !iataUsed.has(knownIata)) {
        airportCode = knownIata;
        iataUsed.add(knownIata);
      }
      const popular = isCapital || !!airportCode || isResortArea || rand() < 0.04;
      const slug = uniqueSlug(`${name}-${c.code}`, citySlugUsed);
      const coords = {
        lat: randFloat(-60, 70, rand, 4),
        lng: randFloat(-180, 180, rand, 4),
      };
      cityRecords.push({
        slug,
        name,
        countryId: country.id,
        airportCode,
        image: pick(IMAGE_POOL, rand),
        popular,
        latitude: coords.lat,
        longitude: coords.lng,
      });
      cityMetaBySlug.set(slug, { isCapital, isResortArea });
    }
  }

  await batchCreateMany(cityRecords, 500, (batch) => prisma.city.createMany({ data: batch, skipDuplicates: true }), 'Cities');
  const allCities = await prisma.city.findMany({
    include: { country: { select: { name: true, code: true } } },
  });
  const getCityMeta = (city: { slug: string; popular: boolean }) =>
    cityMetaBySlug.get(city.slug) ?? { isCapital: city.popular, isResortArea: false };

  // Airports
  console.log('Generating airports...');
  let airportIndex = 0;
  const airportRecords: {
    iataCode: string;
    name: string;
    cityId: string;
    countryId: string;
    latitude: number;
    longitude: number;
    isInternational: boolean;
  }[] = [];

  for (const city of allCities) {
    const meta = getCityMeta(city);
    const hasAirport = !!city.airportCode || city.popular || rand() < 0.35;
    if (!hasAirport) continue;
    let iata = city.airportCode;
    if (!iata) {
      iata = generateIata(city.country.code, airportIndex++, iataUsed);
    }
    airportRecords.push({
      iataCode: iata,
      name: `${city.name} ${meta.isCapital ? 'International' : 'Regional'} Airport`,
      cityId: city.id,
      countryId: city.countryId,
      latitude: city.latitude ?? 0,
      longitude: city.longitude ?? 0,
      isInternational: meta.isCapital || city.popular,
    });
  }

  await batchCreateMany(airportRecords, 500, (batch) => prisma.airport.createMany({ data: batch, skipDuplicates: true }), 'Airports');
  await prisma.$executeRaw`
    UPDATE "City" c SET "airportCode" = a."iataCode"
    FROM "Airport" a WHERE a."cityId" = c.id AND c."airportCode" IS NULL
  `;
  const allCitiesWithAirport = await prisma.city.findMany({
    include: { country: { select: { name: true, code: true } } },
  });
  const allAirports = await prisma.airport.findMany({ include: { city: true, country: true } });

  // Resorts
  console.log('Generating resorts...');
  const resortCandidates = allCitiesWithAirport.filter((c) => {
    const meta = getCityMeta(c);
    return meta.isResortArea || meta.isCapital || c.popular || rand() < 0.08;
  });
  const resortTarget = Math.max(550, Math.min(700, resortCandidates.length));
  const resortCities = pickN(resortCandidates, resortTarget, rand);

  const resortRecords = resortCities.map((city) => {
    const meta = getCityMeta(city);
    const resortKind = meta.isResortArea ? pick(RESORT_TYPES, rand) : pick(['city', 'spa', 'business'], rand);
    const beachType =
      resortKind === 'beach' || resortKind === 'island'
        ? pick(BEACH_TYPES.filter((b) => b !== 'None'), rand)
        : resortKind === 'lake' || resortKind === 'thermal'
          ? pick(['Lagoon', 'Pebble', 'Rocky'], rand)
          : 'None';
    const name = `${city.name} ${resortKind.charAt(0).toUpperCase() + resortKind.slice(1)} Resort`;
    return {
      cityId: city.id,
      name,
      beachType,
      description: `Premium ${resortKind} resort in ${city.name}, ${city.country.name}. ${beachType !== 'None' ? `${beachType} coastline with` : 'Featuring'} world-class service and amenities.`,
      images: pickN(IMAGE_POOL, randInt(2, 5, rand), rand),
      rating: randFloat(3.8, 5.0, rand),
    };
  });

  await batchCreateMany(resortRecords, 200, (batch) => prisma.resort.createMany({ data: batch, skipDuplicates: true }), 'Resorts');
  const allResorts = await prisma.resort.findMany();

  // Hotels
  console.log('Generating hotels...');
  const hotelRecords: {
    cityId: string;
    resortId?: string;
    name: string;
    stars: number;
    rating: number;
    reviewsCount: number;
    amenities: string[];
    mealType: string;
    roomTypes: string[];
    images: string[];
    coordinates: { lat: number; lng: number };
    pricePerNight: number;
  }[] = [];

  const resortsByCity = new Map<string, typeof allResorts>();
  for (const r of allResorts) {
    const list = resortsByCity.get(r.cityId) || [];
    list.push(r);
    resortsByCity.set(r.cityId, list);
  }

  for (const city of allCitiesWithAirport) {
    const meta = getCityMeta(city);
    const hotelCount = meta.isCapital ? randInt(5, 9, rand) : meta.isResortArea ? randInt(3, 6, rand) : randInt(1, 3, rand);
    const cityResorts = resortsByCity.get(city.id) || [];
    for (let h = 0; h < hotelCount; h++) {
      const brand = pick(HOTEL_BRANDS, rand);
      const suffix = pick(HOTEL_SUFFIXES, rand);
      const name = `${brand} ${city.name} ${suffix}`;
      const resort = cityResorts.length ? cityResorts[h % cityResorts.length] : undefined;
      hotelRecords.push({
        cityId: city.id,
        ...(resort ? { resortId: resort.id } : {}),
        name,
        stars: randInt(2, 5, rand),
        rating: randFloat(3.5, 5.0, rand),
        reviewsCount: randInt(10, 3000, rand),
        amenities: pickN(AMENITIES, randInt(3, 7, rand), rand),
        mealType: pick(MEAL_PLANS, rand),
        roomTypes: pickN(ROOM_TYPES, randInt(2, 4, rand), rand),
        images: pickN(IMAGE_POOL, randInt(1, 4, rand), rand),
        coordinates: { lat: city.latitude ?? 0, lng: city.longitude ?? 0 },
        pricePerNight: randFloat(45, 650, rand, 0),
      });
    }
  }

  let hotelFillGuard = 0;
  while (hotelRecords.length < 10000 && allCitiesWithAirport.length && hotelFillGuard < 80000) {
    hotelFillGuard += 1;
    const city = pick(allCitiesWithAirport, rand);
    const meta = getCityMeta(city);
    const cityResorts = resortsByCity.get(city.id) || [];
    const brand = pick(HOTEL_BRANDS, rand);
    const suffix = pick(HOTEL_SUFFIXES, rand);
    const resort = cityResorts.length ? pick(cityResorts, rand) : undefined;
    hotelRecords.push({
      cityId: city.id,
      ...(resort ? { resortId: resort.id } : {}),
      name: `${brand} ${city.name} ${suffix} ${hotelRecords.length + 1}`,
      stars: randInt(2, 5, rand),
      rating: randFloat(3.5, 5.0, rand),
      reviewsCount: randInt(10, 3000, rand),
      amenities: pickN(AMENITIES, randInt(3, 7, rand), rand),
      mealType: pick(MEAL_PLANS, rand),
      roomTypes: pickN(ROOM_TYPES, randInt(2, 4, rand), rand),
      images: pickN(IMAGE_POOL, randInt(1, 4, rand), rand),
      coordinates: { lat: city.latitude ?? 0, lng: city.longitude ?? 0 },
      pricePerNight: randFloat(45, 650, rand, 0),
    });
  }

  await batchCreateMany(hotelRecords, 500, (batch) => prisma.hotel.createMany({ data: batch, skipDuplicates: true }), 'Hotels');
  const allHotels = await prisma.hotel.findMany({ select: { id: true, cityId: true, images: true } });
  const hotelsByCity = new Map<string, typeof allHotels>();
  for (const hotel of allHotels) {
    const list = hotelsByCity.get(hotel.cityId) || [];
    list.push(hotel);
    hotelsByCity.set(hotel.cityId, list);
  }

  // Featured destinations (top cities)
  console.log('Generating destinations...');
  const destSlugUsed = new Set<string>();
  const topCities = [...allCitiesWithAirport].filter((c) => c.popular).slice(0, 60);
  const destinationRecords = topCities.map((city, i) => ({
    slug: uniqueSlug(`${city.name}-${city.country.code}`, destSlugUsed),
    name: city.name,
    country: city.country.name,
    description: `Discover ${city.name} — one of the most popular destinations in ${city.country.name}.`,
    heroImage: city.image,
    images: pickN(IMAGE_POOL, 3, rand),
    categories: pickN(VACATION_CATEGORIES.map((c) => c.name), randInt(1, 3, rand), rand),
    rating: randFloat(4.0, 5.0, rand),
    reviewCount: randInt(100, 5000, rand),
    latitude: city.latitude,
    longitude: city.longitude,
    featured: i < 12,
    cityId: city.id,
  }));

  await batchCreateMany(destinationRecords, 50, (batch) => prisma.destination.createMany({ data: batch, skipDuplicates: true }), 'Destinations');

  // Tours
  console.log('Generating tours...');
  const tourRecords: {
    countryId: string;
    cityId: string;
    hotelId: string;
    title: string;
    description: string;
    duration: number;
    departureDate: Date;
    returnDate: Date;
    price: number;
    oldPrice?: number;
    hotTour: boolean;
    allInclusive: boolean;
    availableSeats: number;
    airline: string;
    images: string[];
  }[] = [];

  const addTour = (city: (typeof allCitiesWithAirport)[0], hotel: (typeof allHotels)[0], images: string[], title: string) => {
    const duration = randInt(3, 14, rand);
    const departureDate = new Date();
    departureDate.setDate(departureDate.getDate() + randInt(7, 180, rand));
    const returnDate = new Date(departureDate);
    returnDate.setDate(returnDate.getDate() + duration);
    const price = randFloat(199, 4999, rand, 0);
    const hotTour = rand() < 0.18;
    const allInclusive = rand() < 0.55;
    tourRecords.push({
      countryId: city.countryId,
      cityId: city.id,
      hotelId: hotel.id,
      title,
      description: `${title} — ${allInclusive ? 'All inclusive package' : 'Flexible travel package'} with flights and hotel stay in ${city.name}, ${city.country.name}.`,
      duration,
      departureDate,
      returnDate,
      price,
      ...(hotTour ? { oldPrice: Math.round(price * (1 + randInt(10, 35, rand) / 100)) } : {}),
      hotTour,
      allInclusive,
      availableSeats: randInt(4, 40, rand),
      airline: pick(AIRLINES, rand),
      images: images.length ? images : pickN(IMAGE_POOL, randInt(1, 3, rand), rand),
    });
  };

  for (const resort of allResorts) {
    const city = allCitiesWithAirport.find((c) => c.id === resort.cityId)!;
    const cityHotels = hotelsByCity.get(city.id);
    if (!cityHotels?.length) continue;
    const hotel = pick(cityHotels, rand);
    const title = `${pick(TOUR_PREFIXES, rand)} ${city.name} ${pick(TOUR_SUFFIXES, rand)}`;
    addTour(city, hotel, resort.images, title);
  }

  const majorCities = allCitiesWithAirport.filter((c) => c.popular || getCityMeta(c).isCapital);
  for (const city of majorCities) {
    if (tourRecords.length >= 3500) break;
    const cityHotels = hotelsByCity.get(city.id);
    if (!cityHotels?.length) continue;
    const extra = randInt(1, 2, rand);
    for (let e = 0; e < extra; e++) {
      const hotel = pick(cityHotels, rand);
      const title = `${pick(TOUR_PREFIXES, rand)} ${city.name} ${pick(TOUR_SUFFIXES, rand)}`;
      addTour(city, hotel, hotel.images.length ? hotel.images : pickN(IMAGE_POOL, 2, rand), `${title}${e ? ` ${e + 1}` : ''}`);
    }
  }

  const citiesWithHotels = allCitiesWithAirport.filter((c) => hotelsByCity.get(c.id)?.length);
  let fillGuard = 0;
  while (tourRecords.length < 3500 && citiesWithHotels.length && fillGuard < 60000) {
    fillGuard += 1;
    const city = pick(citiesWithHotels, rand);
    const cityHotels = hotelsByCity.get(city.id);
    if (!cityHotels?.length) continue;
    const hotel = pick(cityHotels, rand);
    const title = `${pick(TOUR_PREFIXES, rand)} ${city.name} ${pick(TOUR_SUFFIXES, rand)}`;
    addTour(city, hotel, hotel.images.length ? hotel.images : pickN(IMAGE_POOL, 2, rand), `${title} #${tourRecords.length + 1}`);
  }

  await batchCreateMany(tourRecords, 200, (batch) => prisma.tour.createMany({ data: batch, skipDuplicates: true }), 'Tours');
  const allTours = await prisma.tour.findMany();

  // Flights
  console.log('Generating flights...');
  const intlAirports = allAirports.filter((a) => a.isInternational);
  const flightRecords: {
    airline: string;
    flightNumber: string;
    origin: string;
    originCode: string;
    destination: string;
    destinationCode: string;
    originAirportId: string;
    destinationAirportId: string;
    departureTime: Date;
    arrivalTime: Date;
    duration: number;
    price: number;
    class: string;
    stops: number;
    amenities: string[];
    aircraft: string;
    image: string;
    rating: number;
    availableSeats: number;
  }[] = [];

  const aircraft = ['B737-800', 'A320neo', 'B787-9', 'A350-900', 'B777-300ER', 'A330-300', 'E195-E2'];
  const flightTarget = 6000;
  const usedRoutes = new Set<string>();

  while (flightRecords.length < flightTarget) {
    const origin = pick(intlAirports, rand);
    let dest = pick(intlAirports, rand);
    let attempts = 0;
    while ((dest.id === origin.id || origin.countryId === dest.countryId) && attempts < 20) {
      dest = pick(intlAirports, rand);
      attempts++;
    }
    const routeKey = `${origin.iataCode}-${dest.iataCode}`;
    if (usedRoutes.has(routeKey) && rand() > 0.25) continue;
    usedRoutes.add(routeKey);

    const airline = rand() < 0.35 ? pick([...PRIORITY_AIRLINES], rand) : pick(AIRLINES, rand);
    const flightNum = `${airline.split(' ').map((w) => w[0]).join('').slice(0, 2)}${randInt(100, 999, rand)}`;
    const duration = randInt(90, 840, rand);
    const daysAhead = randInt(1, 90, rand);
    const dep = new Date();
    dep.setDate(dep.getDate() + daysAhead);
    dep.setHours(randInt(5, 22, rand), randInt(0, 59, rand), 0, 0);
    const arr = new Date(dep.getTime() + duration * 60_000);

    flightRecords.push({
      airline,
      flightNumber: flightNum,
      origin: origin.city?.name || origin.name,
      originCode: origin.iataCode,
      destination: dest.city?.name || dest.name,
      destinationCode: dest.iataCode,
      originAirportId: origin.id,
      destinationAirportId: dest.id,
      departureTime: dep,
      arrivalTime: arr,
      duration,
      price: randFloat(89, 2899, rand, 0),
      class: pick(['Economy', 'Premium Economy', 'Business'], rand),
      stops: rand() < 0.75 ? 0 : randInt(1, 2, rand),
      amenities: pickN(['Wi-Fi', 'Meals', 'Entertainment', 'Extra Legroom', 'Lounge'], randInt(1, 4, rand), rand),
      aircraft: pick(aircraft, rand),
      image: pick(IMAGE_POOL, rand),
      rating: randFloat(3.8, 5.0, rand),
      availableSeats: randInt(20, 180, rand),
    });
  }

  await batchCreateMany(flightRecords, 500, (batch) => prisma.flight.createMany({ data: batch, skipDuplicates: true }), 'Flights');

  // Hot tours
  console.log('Generating hot tours...');
  const hotTourCandidates = allTours.filter((t) => t.hotTour);
  const hotCount = Math.min(250, hotTourCandidates.length);
  const hotTours = pickN(hotTourCandidates, hotCount, rand);
  const now = new Date();
  const hotRecords = hotTours.map((tour, i) => {
    const originalPrice = tour.oldPrice ?? tour.price;
    const discountedPrice = tour.price;
    const discount = originalPrice > discountedPrice
      ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
      : randInt(15, 45, rand);
    const validFrom = new Date(now);
    validFrom.setDate(validFrom.getDate() - randInt(0, 5, rand));
    const isLastMinute = i < Math.floor(hotCount * 0.4);
    const validUntil = new Date(now);
    validUntil.setDate(validUntil.getDate() + (isLastMinute ? randInt(1, 7, rand) : randInt(8, 45, rand)));
    const city = allCitiesWithAirport.find((c) => c.id === tour.cityId);
    return {
      tourId: tour.id,
      originalPrice,
      discountedPrice,
      discountPercent: discount,
      validFrom,
      validUntil,
      departureCity: city?.name || 'Almaty',
      nights: tour.duration,
      mealPlan: pick(MEAL_PLANS, rand),
      lastMinute: isLastMinute,
      seatsLeft: randInt(1, 12, rand),
      isActive: true,
      featured: i < 24,
    };
  });

  await batchCreateMany(hotRecords, 100, (batch) => prisma.hotTour.createMany({ data: batch, skipDuplicates: true }), 'Hot tours');

  // Curated realistic brands & destinations
  await seedRealisticContent(prisma, cityMetaBySlug);

  // Hotel & tour reviews
  console.log('Generating reviews...');
  await seedReviews(allHotels, tourRecords.length ? await prisma.tour.findMany({ take: 200, select: { id: true } }) : []);

  // Search locations from cities, countries, and popular hotels
  console.log('Syncing search locations...');
  const searchRecords: { name: string; country: string; type: string; slug?: string; cityId?: string }[] = [];

  for (const c of allCitiesWithAirport.filter((c) => c.popular || c.airportCode)) {
    searchRecords.push({
      name: c.name,
      country: c.country.name,
      type: 'city',
      slug: c.slug,
      cityId: c.id,
    });
  }

  const searchCountryRows = await prisma.country.findMany({ select: { name: true, slug: true }, take: 300 });
  for (const country of searchCountryRows) {
    searchRecords.push({ name: country.name, country: country.name, type: 'country', slug: country.slug });
  }

  const topHotels = await prisma.hotel.findMany({
    orderBy: { rating: 'desc' },
    take: 500,
    select: { name: true, city: { select: { name: true, country: { select: { name: true } } } } },
  });
  for (const h of topHotels) {
    searchRecords.push({ name: h.name, country: h.city.country.name, type: 'hotel' });
  }

  await batchCreateMany(searchRecords.slice(0, 5000), 500, (batch) => prisma.searchLocation.createMany({ data: batch, skipDuplicates: true }), 'Search locations');

  const stats = {
    countries: await prisma.country.count(),
    cities: await prisma.city.count(),
    airports: await prisma.airport.count(),
    resorts: await prisma.resort.count(),
    hotels: await prisma.hotel.count(),
    tours: await prisma.tour.count(),
    flights: await prisma.flight.count(),
    hotTours: await prisma.hotTour.count({ where: { isActive: true } }),
    vacationCategories: await prisma.vacationCategory.count(),
    destinations: await prisma.destination.count(),
  };

  console.log('\n✅ Travel database seeded:');
  console.log(stats);
  return stats;
}

const REVIEW_PROS = [
  'Great location', 'Clean rooms', 'Friendly staff', 'Excellent breakfast', 'Beautiful view',
  'Comfortable beds', 'Good value', 'Fast check-in', 'Quiet atmosphere', 'Amazing pool',
];
const REVIEW_CONS = [
  'Small bathroom', 'Slow Wi-Fi', 'Limited parking', 'Noisy at night', 'Dated decor',
  'Far from center', 'Small pool', 'Long elevator wait', 'Weak AC', 'Limited restaurant hours',
];
const REVIEW_TITLES = [
  'Wonderful stay', 'Exceeded expectations', 'Good but not perfect', 'Perfect vacation',
  'Would come again', 'Solid choice', 'Mixed experience', 'Highly recommended', 'Nice hotel',
];
const REVIEW_COMMENTS = [
  'We had a fantastic time. The staff went above and beyond to make our stay comfortable.',
  'Rooms were spacious and well maintained. Location made it easy to explore the city.',
  'Overall a good experience. A few minor issues but nothing that ruined our trip.',
  'Perfect for families. Kids loved the pool and the breakfast buffet was excellent.',
  'Great value for money. Would definitely book again on our next visit.',
  'Beautiful property with stunning views. Minor delays at check-in but worth it.',
];
const TRAVELER_LOCATIONS = [
  'London, UK', 'Berlin, Germany', 'Paris, France', 'New York, USA', 'Toronto, Canada',
  'Sydney, Australia', 'Almaty, Kazakhstan', 'Istanbul, Turkey', 'Dubai, UAE', 'Tokyo, Japan',
];
const REVIEWER_NAMES = [
  ['Emma', 'Wilson'], ['Liam', 'Brown'], ['Sophia', 'Garcia'], ['Noah', 'Martinez'], ['Olivia', 'Lee'],
  ['James', 'Taylor'], ['Ava', 'Anderson'], ['Mason', 'Thomas'], ['Isabella', 'Moore'], ['Ethan', 'Jackson'],
  ['Mia', 'White'], ['Lucas', 'Harris'], ['Charlotte', 'Clark'], ['Alexander', 'Lewis'], ['Amelia', 'Walker'],
];

async function seedReviews(
  hotels: { id: string; images: string[] }[],
  tours: { id: string }[],
) {
  const password = await bcrypt.hash('Reviewer123!', 10);
  const reviewUsers: string[] = [];

  for (let i = 0; i < REVIEWER_NAMES.length; i++) {
    const [firstName, lastName] = REVIEWER_NAMES[i];
    const email = `reviewer${i + 1}@merutour.local`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password,
        firstName,
        lastName,
        emailVerified: true,
        role: 'USER',
      },
    });
    reviewUsers.push(user.id);
  }

  const hotelSample = hotels.filter((_, i) => i % 16 === 0).slice(0, 1200);
  const reviewRecords: {
    userId: string;
    hotelId?: string;
    tourId?: string;
    rating: number;
    title: string;
    comment: string;
    pros: string[];
    cons: string[];
    images: string[];
    location: string;
    verified: boolean;
  }[] = [];

  for (const hotel of hotelSample) {
    const count = randInt(3, 7, rand);
    for (let r = 0; r < count; r++) {
      const rating = randInt(3, 5, rand) + (rand() > 0.7 ? 0 : 0);
      reviewRecords.push({
        userId: pick(reviewUsers, rand),
        hotelId: hotel.id,
        rating: Math.min(5, rating),
        title: pick(REVIEW_TITLES, rand),
        comment: pick(REVIEW_COMMENTS, rand),
        pros: pickN(REVIEW_PROS, randInt(2, 4, rand), rand),
        cons: rating >= 5 && rand() > 0.5 ? [] : pickN(REVIEW_CONS, randInt(1, 2, rand), rand),
        images: pickN(hotel.images.length ? hotel.images : IMAGE_POOL, randInt(0, 3, rand), rand),
        location: pick(TRAVELER_LOCATIONS, rand),
        verified: rand() > 0.25,
      });
    }
  }

  for (const tour of tours.slice(0, 80)) {
    const count = randInt(2, 5, rand);
    for (let r = 0; r < count; r++) {
      reviewRecords.push({
        userId: pick(reviewUsers, rand),
        tourId: tour.id,
        rating: randInt(3, 5, rand),
        title: pick(REVIEW_TITLES, rand),
        comment: pick(REVIEW_COMMENTS, rand),
        pros: pickN(REVIEW_PROS, randInt(2, 3, rand), rand),
        cons: rand() > 0.6 ? pickN(REVIEW_CONS, 1, rand) : [],
        images: pickN(IMAGE_POOL, randInt(0, 2, rand), rand),
        location: pick(TRAVELER_LOCATIONS, rand),
        verified: rand() > 0.3,
      });
    }
  }

  await batchCreateMany(reviewRecords, 500, (batch) => prisma.review.createMany({ data: batch, skipDuplicates: true }), 'Reviews');
}

if (require.main === module) {
  seedTravelDatabase()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
