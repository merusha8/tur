import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';



type QuickLink = { label: string; href: string };



type SearchResultItem = {

  id: string;

  type: 'country' | 'city' | 'hotel' | 'resort' | 'tour';

  label: string;

  subtitle?: string;

  country?: string;

  countryCode?: string;

  airportCode?: string;

  image?: string;

  stars?: number;

  flag?: string;

  href: string;

  quickLinks: QuickLink[];

};



@Injectable()

export class SearchService {

  constructor(private prisma: PrismaService) {}



  async search(q: string) {

    if (!q || q.length < 1) return { results: [] as SearchResultItem[] };



    const term = q.trim();



    const [indexed, countries, cities, hotels, resorts, tours] = await Promise.all([

      this.prisma.searchLocation.findMany({

        where: {

          OR: [

            { name: { contains: term, mode: 'insensitive' } },

            { country: { contains: term, mode: 'insensitive' } },

          ],

        },

        take: 6,

        orderBy: { name: 'asc' },

      }),

      this.prisma.country.findMany({

        where: {

          OR: [

            { name: { contains: term, mode: 'insensitive' } },

            { code: { contains: term, mode: 'insensitive' } },

          ],

        },

        take: 4,

        select: {

          id: true,

          name: true,

          slug: true,

          code: true,

          flag: true,

          cities: {

            where: { popular: true },

            take: 1,

            select: { image: true },

          },

        },

      }),

      this.prisma.city.findMany({

        where: {

          OR: [

            { name: { contains: term, mode: 'insensitive' } },

            { slug: { contains: term, mode: 'insensitive' } },

            { country: { name: { contains: term, mode: 'insensitive' } } },

          ],

        },

        take: 5,

        select: {

          id: true,

          name: true,

          slug: true,

          image: true,

          popular: true,

          airportCode: true,

          countryId: true,

          country: { select: { name: true, code: true, flag: true } },

        },

      }),

      this.prisma.hotel.findMany({

        where: {

          OR: [

            { name: { contains: term, mode: 'insensitive' } },

            { city: { name: { contains: term, mode: 'insensitive' } } },

            { city: { country: { name: { contains: term, mode: 'insensitive' } } } },

          ],

        },

        take: 5,

        select: {

          id: true,

          name: true,

          stars: true,

          images: true,

          cityId: true,

          city: { select: { name: true, country: { select: { name: true, code: true } } } },

        },

      }),

      this.prisma.resort.findMany({

        where: {

          OR: [

            { name: { contains: term, mode: 'insensitive' } },

            { description: { contains: term, mode: 'insensitive' } },

            { city: { name: { contains: term, mode: 'insensitive' } } },

          ],

        },

        take: 4,

        select: {

          id: true,

          name: true,

          beachType: true,

          images: true,

          cityId: true,

          city: { select: { name: true, country: { select: { name: true, code: true } } } },

        },

      }),

      this.prisma.tour.findMany({

        where: {

          OR: [

            { title: { contains: term, mode: 'insensitive' } },

            { city: { name: { contains: term, mode: 'insensitive' } } },

            { country: { name: { contains: term, mode: 'insensitive' } } },

          ],

        },

        take: 5,

        select: {

          id: true,

          title: true,

          images: true,

          price: true,

          hotTour: true,

          cityId: true,

          city: { select: { name: true } },

          country: { select: { name: true, code: true } },

        },

      }),

    ]);



    const indexedCityIds = indexed.filter((i) => i.cityId).map((i) => i.cityId as string);

    const indexedCities = indexedCityIds.length

      ? await this.prisma.city.findMany({

          where: { id: { in: indexedCityIds } },

          select: {

            id: true,

            name: true,

            slug: true,

            image: true,

            popular: true,

            airportCode: true,

            countryId: true,

            country: { select: { name: true, code: true, flag: true } },

          },

        })

      : [];



    const cityById = new Map(indexedCities.map((c) => [c.id, c]));

    const seenCityIds = new Set<string>();

    const seenLabels = new Set<string>();



    const indexedResults: SearchResultItem[] = indexed

      .map((row) => {

        if (row.cityId && cityById.has(row.cityId)) {

          const c = cityById.get(row.cityId)!;

          if (seenCityIds.has(c.id)) return null;

          seenCityIds.add(c.id);

          seenLabels.add(`city:${c.name.toLowerCase()}`);

          return {

            id: c.id,

            type: 'city' as const,

            label: c.name,

            subtitle: c.popular ? 'Popular destination' : row.country,

            country: c.country.name,

            countryCode: c.country.code,

            flag: c.country.flag,

            image: c.image,

            airportCode: c.airportCode || undefined,

            href: `/tours/results?cityId=${c.id}&countryId=${c.countryId}`,

            quickLinks: [

              { label: 'Tours', href: `/tours/results?cityId=${c.id}&countryId=${c.countryId}` },

              { label: 'Hotels', href: `/hotels/results?cityId=${c.id}` },

              { label: 'Hot deals', href: `/hot-tours?search=${encodeURIComponent(c.name)}` },

            ],

          };

        }

        const key = `indexed:${row.name.toLowerCase()}`;

        if (seenLabels.has(key)) return null;

        seenLabels.add(key);

        return {

          id: row.id,

          type: 'city' as const,

          label: row.name,

          subtitle: row.country,

          country: row.country,

          href: `/tours?search=${encodeURIComponent(row.name)}`,

          quickLinks: [

            { label: 'Tours', href: `/tours?search=${encodeURIComponent(row.name)}` },

            { label: 'Hotels', href: `/hotels/results?search=${encodeURIComponent(row.name)}` },

            { label: 'Hot deals', href: `/hot-tours?search=${encodeURIComponent(row.name)}` },

          ],

        };

      })

      .filter(Boolean) as SearchResultItem[];



    const results: SearchResultItem[] = [

      ...indexedResults,

      ...countries

        .filter((c) => !seenLabels.has(`country:${c.name.toLowerCase()}`))

        .map((c) => ({

          id: c.id,

          type: 'country' as const,

          label: c.name,

          country: c.name,

          countryCode: c.code,

          flag: c.flag,

          image: c.cities[0]?.image,

          href: `/tours/results?countryId=${c.id}`,

          quickLinks: [

            { label: 'Tours', href: `/tours/results?countryId=${c.id}` },

            { label: 'Hotels', href: `/hotels/results?countryCode=${c.code}` },

            { label: 'Hot deals', href: `/hot-tours?countryId=${c.id}` },

          ],

        })),

      ...cities

        .filter((c) => !seenCityIds.has(c.id))

        .map((c) => ({

          id: c.id,

          type: 'city' as const,

          label: c.name,

          subtitle: c.popular ? 'Popular destination' : undefined,

          country: c.country.name,

          countryCode: c.country.code,

          flag: c.country.flag,

          image: c.image,

          airportCode: c.airportCode || undefined,

          href: `/tours/results?cityId=${c.id}&countryId=${c.countryId}`,

          quickLinks: [

            { label: 'Tours', href: `/tours/results?cityId=${c.id}&countryId=${c.countryId}` },

            { label: 'Hotels', href: `/hotels/results?cityId=${c.id}` },

            { label: 'Hot deals', href: `/hot-tours?search=${encodeURIComponent(c.name)}` },

          ],

        })),

      ...hotels.map((h) => ({

        id: h.id,

        type: 'hotel' as const,

        label: h.name,

        subtitle: h.city.name,

        country: h.city.country.name,

        countryCode: h.city.country.code,

        image: h.images[0],

        stars: h.stars,

        href: `/hotels/${h.id}`,

        quickLinks: [

          { label: 'View hotel', href: `/hotels/${h.id}` },

          { label: 'Hotels in city', href: `/hotels/results?cityId=${h.cityId}` },

          { label: 'Tours', href: `/tours/results?cityId=${h.cityId}` },

        ],

      })),

      ...resorts.map((r) => ({

        id: r.id,

        type: 'resort' as const,

        label: r.name,

        subtitle: `${r.beachType} · ${r.city.name}`,

        country: r.city.country.name,

        countryCode: r.city.country.code,

        image: r.images[0],

        href: `/hotels/results?resortId=${r.id}`,

        quickLinks: [

          { label: 'Resort hotels', href: `/hotels/results?resortId=${r.id}` },

          { label: 'Tours', href: `/tours/results?cityId=${r.cityId}` },

          { label: 'Hot deals', href: `/hot-tours?search=${encodeURIComponent(r.city.name)}` },

        ],

      })),

      ...tours.map((t) => ({

        id: t.id,

        type: 'tour' as const,

        label: t.title,

        subtitle: t.city.name,

        country: t.country.name,

        countryCode: t.country.code,

        image: t.images[0],

        href: `/tours/${t.id}`,

        quickLinks: [

          { label: 'View tour', href: `/tours/${t.id}` },

          { label: 'More tours', href: `/tours/results?cityId=${t.cityId}` },

          ...(t.hotTour ? [{ label: 'Hot tours', href: '/hot-tours' }] : []),

        ],

      })),

    ];



    return { results: results.slice(0, 18) };

  }

}

