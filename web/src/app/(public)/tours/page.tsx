"use client";



import { Suspense, useState } from "react";

import { useSearchParams, useRouter } from "next/navigation";

import { useQuery } from "@tanstack/react-query";

import { toursApi } from "@/lib/api";

import { PageTransition } from "@/components/shared/page-transition";

import { SearchAutocomplete } from "@/components/shared/search-autocomplete";

import { TourCard, TourCardSkeleton } from "@/components/tours/tour-card";

import { Card, CardContent } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { formatPrice } from "@/lib/utils";

import { PaginationBar } from "@/components/shared/pagination-bar";

import { toursPath } from "@/lib/search-params";

import type { ToursResponse } from "@/types";



function ToursContent() {

  const params = useSearchParams();

  const router = useRouter();

  const [filters, setFilters] = useState({

    search: params.get("search") || "",

    airline: params.get("airline") || "",

    hotTour: params.get("hotTour") === "true",

    allInclusive: params.get("allInclusive") === "true",

    familyFriendly: params.get("familyFriendly") === "true",

    mealType: params.get("mealType") || "",

    minStars: +(params.get("minStars") || 0),

    minPrice: +(params.get("minPrice") || 0),

    maxPrice: +(params.get("maxPrice") || 5000),

    sort: params.get("sort") || "",

    category: params.get("category") || "",

    page: +(params.get("page") || 1),

  });



  const { data: filterMeta } = useQuery({

    queryKey: ["tour-search-filters"],

    queryFn: async () => (await toursApi.getSearchFilters()).data as {

      mealTypes: string[];

      starOptions: number[];

      priceRange: { min: number; max: number };

    },

  });



  const priceMin = filterMeta?.priceRange.min ?? 0;

  const priceMax = filterMeta?.priceRange.max ?? 5000;



  const { data, isLoading, isError } = useQuery({

    queryKey: ["tours", filters, params.get("cityId")],

    queryFn: async () => {

      const res = await toursApi.getAll({

        category: filters.category || undefined,

        search: filters.search || undefined,

        airline: filters.airline || undefined,

        hotTour: filters.hotTour ? "true" : undefined,

        allInclusive: filters.allInclusive ? "true" : undefined,

        familyFriendly: filters.familyFriendly ? "true" : undefined,

        mealType: filters.mealType || undefined,

        minStars: filters.minStars || undefined,

        cityId: params.get("cityId") || undefined,

        minPrice: filters.minPrice || undefined,

        maxPrice: filters.maxPrice || undefined,

        page: filters.page,

        limit: 9,

        sort: filters.sort || undefined,

      });

      return res.data as ToursResponse;

    },

  });



  const { data: airlines = [] } = useQuery({

    queryKey: ["tour-airlines"],

    queryFn: async () => (await toursApi.getAirlines()).data as string[],

  });



  const tours = data?.data ?? [];

  const totalPages = data?.totalPages ?? 1;

  const goToPage = (page: number) => {
    const next = { ...filters, page };
    setFilters(next);
    router.push(toursPath(next, { cityId: params.get("cityId") }));
  };



  return (

    <PageTransition>

      <div className="bg-[#FAFBFC] py-12">

        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">

          <h1 className="text-4xl font-bold text-[#112211]">Tours & Packages</h1>

          <p className="mt-2 text-gray-500">{isLoading ? "Loading..." : `${data?.total ?? 0} curated experiences worldwide`}</p>

          {filters.category && (
            <p className="mt-2 text-sm text-[#8DD3BB]">
              Category: {filters.category.replace(/-/g, " ")}
              <button type="button" className="ml-2 underline" onClick={() => { setFilters({ ...filters, category: "", page: 1 }); router.replace("/tours"); }}>Clear</button>
            </p>
          )}



          {isError && <p className="mt-4 text-red-500">Failed to load tours. Check API connection.</p>}



          <div className="mt-8 grid gap-8 lg:grid-cols-4">

            <aside className="space-y-6">

              <Card className="rounded-[24px]"><CardContent className="space-y-5 p-5">

                <h3 className="font-bold">Filters</h3>

                <div>

                  <label className="text-sm font-medium">Search</label>

                  <Input className="mt-1" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} placeholder="Tour name..." />

                </div>

                <div>

                  <label className="text-sm font-medium">Airline</label>

                  <select className="mt-1 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm" value={filters.airline} onChange={(e) => setFilters({ ...filters, airline: e.target.value, page: 1 })}>

                    <option value="">All</option>

                    {airlines.map((a) => <option key={a} value={a}>{a}</option>)}

                  </select>

                </div>

                <div>

                  <label className="text-sm font-medium">Meal type</label>

                  <select className="mt-1 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm" value={filters.mealType} onChange={(e) => setFilters({ ...filters, mealType: e.target.value, page: 1 })}>

                    <option value="">All</option>

                    {(filterMeta?.mealTypes ?? []).map((m) => <option key={m} value={m}>{m}</option>)}

                  </select>

                </div>

                <div>

                  <label className="text-sm font-medium">Min hotel stars</label>

                  <select className="mt-1 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm" value={filters.minStars || ""} onChange={(e) => setFilters({ ...filters, minStars: +e.target.value, page: 1 })}>

                    <option value="">Any</option>

                    {(filterMeta?.starOptions ?? [3, 4, 5]).map((s) => <option key={s} value={s}>{s}+ stars</option>)}

                  </select>

                </div>

                <label className="flex items-center gap-2 text-sm">

                  <input type="checkbox" checked={filters.hotTour} onChange={(e) => setFilters({ ...filters, hotTour: e.target.checked, page: 1 })} />

                  Hot tours only

                </label>

                <label className="flex items-center gap-2 text-sm">

                  <input type="checkbox" checked={filters.allInclusive} onChange={(e) => setFilters({ ...filters, allInclusive: e.target.checked, page: 1 })} />

                  All inclusive

                </label>

                <label className="flex items-center gap-2 text-sm">

                  <input type="checkbox" checked={filters.familyFriendly} onChange={(e) => setFilters({ ...filters, familyFriendly: e.target.checked, page: 1 })} />

                  Family friendly

                </label>

                <div>

                  <label className="text-sm font-medium">Min price: {formatPrice(filters.minPrice || priceMin)}</label>

                  <input type="range" min={priceMin} max={priceMax} step={50} value={filters.minPrice || priceMin} onChange={(e) => setFilters({ ...filters, minPrice: +e.target.value, page: 1 })} className="mt-2 w-full" />

                </div>

                <div>

                  <label className="text-sm font-medium">Max price: {formatPrice(filters.maxPrice)}</label>

                  <input type="range" min={priceMin} max={priceMax} step={50} value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: +e.target.value, page: 1 })} className="mt-2 w-full" />

                </div>

                <div>

                  <label className="text-sm font-medium">Sort by</label>

                  <select className="mt-1 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value, page: 1 })}>

                    <option value="">Newest</option>

                    <option value="departure">Departure date</option>

                    <option value="price_asc">Price: Low to High</option>

                    <option value="price_desc">Price: High to Low</option>

                    <option value="stars">Hotel stars</option>

                    <option value="rating">Hotel rating</option>

                  </select>

                </div>

              </CardContent></Card>

            </aside>



            <div className="lg:col-span-3">

              <div className="mb-6 max-w-md">

                <SearchAutocomplete placeholder="Search tours, destinations..." />

              </div>



              {isLoading ? (

                <div className="grid gap-6 md:grid-cols-2">

                  {Array.from({ length: 4 }).map((_, i) => (

                    <TourCardSkeleton key={i} />

                  ))}

                </div>

              ) : tours.length === 0 ? (

                <Card className="rounded-[24px]"><CardContent className="py-16 text-center text-gray-500">No tours found. Try adjusting filters.</CardContent></Card>

              ) : (

                <div className="grid gap-6 md:grid-cols-2">

                  {tours.map((t) => (

                    <TourCard key={t.id} tour={t} variant="grid" />

                  ))}

                </div>

              )}



              {totalPages > 1 && (
                <PaginationBar page={filters.page} totalPages={totalPages} onPageChange={goToPage} className="mt-10" />
              )}

            </div>

          </div>

        </div>

      </div>

    </PageTransition>

  );

}



export default function ToursPage() {

  return (

    <Suspense fallback={<div className="py-20 text-center text-gray-400">Loading tours...</div>}>

      <ToursContent />

    </Suspense>

  );

}

