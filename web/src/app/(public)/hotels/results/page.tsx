"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { hotelsApi } from "@/lib/api";
import { PageTransition } from "@/components/shared/page-transition";
import { InlineError } from "@/components/shared/query-states";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/lib/utils";
import { Star, MapPin, Globe, Waves, Wifi, UtensilsCrossed } from "lucide-react";
import type { Hotel, HotelsSearchResponse, HotelSearchFilters as HotelFiltersMeta } from "@/types";
import {
  HotelSearchFiltersPanel,
  paramsToHotelFilters,
  hotelFiltersToParams,
  type HotelFilterState,
} from "@/components/hotels/hotel-search-filters";

const SOURCE_BADGE = {
  booking: { label: "Booking.com", className: "bg-blue-100 text-blue-700" },
  expedia: { label: "Expedia", className: "bg-yellow-100 text-yellow-800" },
  database: { label: "Meru Tour", className: "bg-gray-100 text-gray-600" },
};

export default function HotelResultsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-16 text-center text-gray-500">Loading hotel results...</div>}>
      <HotelResultsContent />
    </Suspense>
  );
}

function HotelResultsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [page, setPage] = useState(+(params.get("page") || 1));

  const { data: filterMeta } = useQuery({
    queryKey: ["hotel-search-filters"],
    queryFn: async () => (await hotelsApi.getSearchFilters()).data as HotelFiltersMeta,
  });

  const appliedFilters = useMemo(
    () => paramsToHotelFilters(params, filterMeta),
    [params, filterMeta],
  );

  const [draftFilters, setDraftFilters] = useState<HotelFilterState>(appliedFilters);

  useEffect(() => {
    setDraftFilters(appliedFilters);
  }, [appliedFilters]);

  const city = params.get("city") || "";
  const cityId = params.get("cityId") || "";
  const checkIn = params.get("checkIn") || "";
  const checkOut = params.get("checkOut") || "";
  const guests = params.get("guests") || "2";

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["hotels-search", params.toString()],
    queryFn: async () => {
      const res = await hotelsApi.search({
        city: city || undefined,
        cityId: cityId || undefined,
        countryCode: params.get("countryCode") || undefined,
        resortId: params.get("resortId") || undefined,
        checkIn: checkIn || undefined,
        checkOut: checkOut || undefined,
        guests,
        minPrice: params.get("minPrice") || undefined,
        maxPrice: params.get("maxPrice") || undefined,
        minStars: params.get("minStars") || undefined,
        minRating: params.get("minRating") || undefined,
        mealType: params.get("mealType") || undefined,
        allInclusive: params.get("allInclusive") === "true" ? "true" : undefined,
        beach: params.get("beach") === "true" ? "true" : undefined,
        beachType: params.get("beachType") || undefined,
        wifi: params.get("wifi") === "true" ? "true" : undefined,
        pool: params.get("pool") === "true" ? "true" : undefined,
        familyFriendly: params.get("familyFriendly") === "true" ? "true" : undefined,
        luxury: params.get("luxury") === "true" ? "true" : undefined,
        transferIncluded: params.get("transferIncluded") === "true" ? "true" : undefined,
        sort: params.get("sort") || "rating",
        page: params.get("page") || 1,
        limit: 15,
      });
      return res.data as HotelsSearchResponse;
    },
  });

  const applyFilters = useCallback(() => {
    const q = hotelFiltersToParams(params, draftFilters, 1);
    setPage(1);
    router.push(`/hotels/results?${q.toString()}`);
  }, [params, draftFilters, router]);

  const resetFilters = useCallback(() => {
    const defaults = paramsToHotelFilters(new URLSearchParams(), filterMeta);
    setDraftFilters(defaults);
    const q = hotelFiltersToParams(params, defaults, 1);
    router.push(`/hotels/results?${q.toString()}`);
  }, [params, filterMeta, router]);

  const hotels = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const providers = data?.providers;
  const sources = data?.sources;

  const goToPage = (p: number) => {
    setPage(p);
    const q = hotelFiltersToParams(params, appliedFilters, p);
    router.push(`/hotels/results?${q.toString()}`);
  };

  const detailHref = (hotel: Hotel) => {
    const q = new URLSearchParams();
    if (checkIn) q.set("checkIn", checkIn);
    if (checkOut) q.set("checkOut", checkOut);
    if (guests) q.set("guests", guests);
    const qs = q.toString();
    return `/hotels/${encodeURIComponent(hotel.id)}${qs ? `?${qs}` : ""}`;
  };

  const activeFilterCount = [
    appliedFilters.minStars,
    appliedFilters.minRating,
    appliedFilters.mealType,
    appliedFilters.allInclusive,
    appliedFilters.beach,
    appliedFilters.wifi,
    appliedFilters.pool,
    appliedFilters.familyFriendly,
    appliedFilters.luxury,
    appliedFilters.transferIncluded,
    appliedFilters.maxPrice < (filterMeta?.priceRange.max ?? 2000),
  ].filter(Boolean).length;

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Hotels in</p>
          <h1 className="text-2xl font-bold">
            {city || cityId || params.get("countryCode") || "All Destinations"}
            {checkIn && checkOut ? ` · ${formatDate(checkIn)} – ${formatDate(checkOut)}` : ""}
          </h1>
          {activeFilterCount > 0 && (
            <p className="mt-1 text-sm text-[#8DD3BB]">{activeFilterCount} filter(s) active · {data?.total ?? 0} results</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            {providers?.booking && (
              <span className="rounded-full bg-blue-50 px-2 py-1 font-medium text-blue-700">
                Booking.com {sources?.booking ? `(${sources.booking})` : "✓"}
              </span>
            )}
            {providers?.expedia && (
              <span className="rounded-full bg-yellow-50 px-2 py-1 font-medium text-yellow-800">
                Expedia {sources?.expedia ? `(${sources.expedia})` : "✓"}
              </span>
            )}
            <span className="rounded-full bg-gray-50 px-2 py-1 text-gray-600">
              Database {sources?.database ? `(${sources.database})` : ""}
            </span>
            {!providers?.booking && !providers?.expedia && (
              <span className="flex items-center gap-1 text-amber-600">
                <Globe className="h-3 w-3" /> Add API keys in .env for live prices
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          <aside>
            <HotelSearchFiltersPanel
              filters={draftFilters}
              meta={filterMeta}
              onChange={(patch) => setDraftFilters((f) => ({ ...f, ...patch }))}
              onApply={applyFilters}
              onReset={resetFilters}
            />
          </aside>

          <div className="lg:col-span-3 space-y-4">
            {isError && (
              <InlineError message="Failed to load hotels. Check that the API is running and try again." />
            )}
            {isError && (
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => refetch()}>Retry search</Button>
              </div>
            )}
            {isLoading && (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-100" />
                ))}
              </div>
            )}
            {!isLoading && !isError && hotels.length === 0 && (
              <Card><CardContent className="p-8 text-center text-gray-500">No hotels match your filters.</CardContent></Card>
            )}
            {!isLoading && !isError && hotels.map((hotel) => {
              const badge = hotel.source ? SOURCE_BADGE[hotel.source] : SOURCE_BADGE.database;
              return (
                <Card key={hotel.id} className="overflow-hidden transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-col gap-4 p-0 md:flex-row">
                    {hotel.images[0] && (
                      <Image src={hotel.images[0]} alt={hotel.name} width={280} height={200} className="h-48 w-full object-cover md:h-auto md:w-72" />
                    )}
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-bold">{hotel.name}</h3>
                          {hotel.source && (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>{badge.label}</span>
                          )}
                        </div>
                        <p className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="h-3 w-3" />
                          {hotel.city?.name}
                          {hotel.city?.country?.name ? `, ${hotel.city.country.name}` : ""}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{hotel.rating}</span>
                          <span className="text-sm text-gray-400">
                            {"★".repeat(hotel.stars)} · {hotel.reviewsCount} reviews
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">
                            <UtensilsCrossed className="h-3 w-3" /> {hotel.mealType}
                          </span>
                          {hotel.resort?.beachType && hotel.resort.beachType !== "None" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700">
                              <Waves className="h-3 w-3" /> {hotel.resort.beachType}
                            </span>
                          )}
                          {hotel.amenities.includes("Wi-Fi") && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                              <Wifi className="h-3 w-3" /> Wi-Fi
                            </span>
                          )}
                          {hotel.roomTypes.slice(0, 1).map((r) => (
                            <span key={r} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{r}</span>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 flex items-end justify-between">
                        <div>
                          <p className="text-2xl font-bold">{formatPrice(hotel.pricePerNight)}</p>
                          <p className="text-xs text-gray-400">per night</p>
                          {hotel.totalPrice && hotel.nights && (
                            <p className="text-sm text-gray-500">{formatPrice(hotel.totalPrice)} total · {hotel.nights} nights</p>
                          )}
                        </div>
                        <Link href={detailHref(hotel)}><Button>View Deals</Button></Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {!isLoading && !isError && totalPages > 1 && (
              <PaginationBar page={page} totalPages={totalPages} onPageChange={goToPage} />
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
