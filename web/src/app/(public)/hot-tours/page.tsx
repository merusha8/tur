"use client";



import { Suspense, useState } from "react";

import { useSearchParams, useRouter } from "next/navigation";

import { useQuery } from "@tanstack/react-query";

import Link from "next/link";

import { hotToursApi } from "@/lib/api";

import { PageTransition } from "@/components/shared/page-transition";

import { HotTourCard, HotTourCardSkeleton } from "@/components/shared/hot-tour-card";

import { SearchAutocomplete } from "@/components/shared/search-autocomplete";

import { Button } from "@/components/ui/button";

import { Card, CardContent } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { formatPrice } from "@/lib/utils";

import { PaginationBar } from "@/components/shared/pagination-bar";

import { hotToursPath } from "@/lib/search-params";

import { Flame, Zap } from "lucide-react";

import type { HotToursResponse } from "@/types";



function HotToursContent() {

  const params = useSearchParams();

  const router = useRouter();

  const [filters, setFilters] = useState({

    search: params.get("search") || "",

    lastMinute: params.get("lastMinute") === "true",

    minPrice: +(params.get("minPrice") || 0),

    maxPrice: +(params.get("maxPrice") || 0),

    mealPlan: params.get("mealPlan") || "",

    sort: params.get("sort") || "discount",

    page: +(params.get("page") || 1),

  });



  const { data: filterMeta } = useQuery({

    queryKey: ["hot-tour-filters"],

    queryFn: async () => (await hotToursApi.getFilters()).data as {

      activeCount: number;

      priceRange: { min: number; max: number };

      mealPlans: string[];

      sortOptions: { value: string; label: string }[];

    },

  });



  const priceMin = filterMeta?.priceRange.min ?? 0;

  const priceMax = filterMeta?.priceRange.max ?? 5000;

  const maxPrice = filters.maxPrice || priceMax;



  const { data, isLoading, isError } = useQuery({

    queryKey: ["hot-tours", filters],

    queryFn: async () => {

      const res = await hotToursApi.getAll({

        search: filters.search || undefined,

        lastMinute: filters.lastMinute ? "true" : undefined,

        minPrice: filters.minPrice || undefined,

        maxPrice: maxPrice || undefined,

        mealPlan: filters.mealPlan || undefined,

        sort: filters.sort,

        page: filters.page,

        limit: 12,

      });

      return res.data as HotToursResponse;

    },

  });



  const deals = data?.data ?? [];

  const totalPages = data?.totalPages ?? 1;

  const goToPage = (page: number) => {
    const next = { ...filters, page };
    setFilters(next);
    router.push(hotToursPath(next));
  };



  return (

    <PageTransition>

      <section className="bg-gradient-to-br from-red-600 via-orange-500 to-amber-500 py-16 text-white">

        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">

          <div className="flex items-center gap-3">

            <Flame className="h-10 w-10" />

            <div>

              <h1 className="text-4xl font-bold md:text-5xl">Hot Tours</h1>

              <p className="mt-2 text-white/90">

                {filterMeta ? `${filterMeta.activeCount} active deals` : "Last minute deals with limited seats"}

              </p>

            </div>

          </div>

        </div>

      </section>



      <div className="mx-auto max-w-[1200px] px-6 py-12 lg:px-8">

        <div className="mb-8 grid gap-6 lg:grid-cols-4">

          <aside className="space-y-4 lg:col-span-1">

            <Card className="rounded-[24px]"><CardContent className="space-y-4 p-5">

              <h3 className="font-bold">Filters</h3>

              <Input

                placeholder="Search deals..."

                value={filters.search}

                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}

              />

              <select

                className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm"

                value={filters.mealPlan}

                onChange={(e) => setFilters({ ...filters, mealPlan: e.target.value, page: 1 })}

              >

                <option value="">All meal plans</option>

                {(filterMeta?.mealPlans ?? []).map((m) => <option key={m} value={m}>{m}</option>)}

              </select>

              <div>

                <label className="text-sm font-medium">Max price: {formatPrice(maxPrice)}</label>

                <input

                  type="range"

                  min={priceMin}

                  max={priceMax}

                  step={50}

                  value={maxPrice}

                  onChange={(e) => setFilters({ ...filters, maxPrice: +e.target.value, page: 1 })}

                  className="mt-2 w-full"

                />

              </div>

            </CardContent></Card>

          </aside>



          <div className="lg:col-span-3">

            <div className="mb-6 max-w-md">

              <SearchAutocomplete placeholder="Search destinations, tours..." />

            </div>



            <div className="mb-8 flex flex-wrap items-center gap-4">

              <Button

                variant={!filters.lastMinute ? "default" : "outline"}

                onClick={() => setFilters({ ...filters, lastMinute: false, page: 1 })}

              >

                All deals

              </Button>

              <Button

                variant={filters.lastMinute ? "default" : "outline"}

                className={filters.lastMinute ? "bg-red-600 hover:bg-red-700" : ""}

                onClick={() => setFilters({ ...filters, lastMinute: true, page: 1 })}

              >

                <Zap className="mr-2 h-4 w-4" /> Last minute

              </Button>

              <select

                className="ml-auto h-11 rounded-xl border border-gray-200 px-3 text-sm"

                value={filters.sort}

                onChange={(e) => setFilters({ ...filters, sort: e.target.value, page: 1 })}

              >

                {(filterMeta?.sortOptions ?? [

                  { value: "discount", label: "Biggest discount" },

                  { value: "urgency", label: "Ending soon" },

                  { value: "seats", label: "Fewest seats" },

                ]).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}

              </select>

            </div>



            {isError && <p className="text-red-500">Failed to load hot tours.</p>}



            {isLoading ? (

              <div className="grid gap-6 md:grid-cols-2">

                {Array.from({ length: 6 }).map((_, i) => <HotTourCardSkeleton key={i} />)}

              </div>

            ) : deals.length === 0 ? (

              <Card className="rounded-[24px]"><CardContent className="py-16 text-center text-gray-500">No active deals match your filters.</CardContent></Card>

            ) : (

              <div className="grid gap-6 md:grid-cols-2">

                {deals.map((deal) => (

                  <HotTourCard key={deal.id} deal={deal} />

                ))}

              </div>

            )}



            {totalPages > 1 && (
              <PaginationBar page={filters.page} totalPages={totalPages} onPageChange={goToPage} className="mt-10" />
            )}



            <p className="mt-8 text-center text-sm text-gray-500">

              All prices per person. <Link href="/tours" className="text-[#8DD3BB] hover:underline">Browse all tours</Link>

            </p>

          </div>

        </div>

      </div>

    </PageTransition>

  );

}



export default function HotToursPage() {

  return (

    <Suspense fallback={<div className="py-20 text-center text-gray-400">Loading hot tours...</div>}>

      <HotToursContent />

    </Suspense>

  );

}

