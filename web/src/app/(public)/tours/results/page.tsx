"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toursApi, countriesApi, citiesApi } from "@/lib/api";
import { PageTransition } from "@/components/shared/page-transition";
import { TourPackageSearchForm } from "@/components/shared/tour-package-search-form";
import { TourCard, TourCardSkeleton } from "@/components/tours/tour-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { PaginationBar } from "@/components/shared/pagination-bar";
import {
  paramsToTourSearch,
  tourSearchToParams,
  useSearchStore,
  type TourPackageSearch,
} from "@/stores/search-store";
import { SlidersHorizontal } from "lucide-react";
import type { Tour, ToursResponse } from "@/types";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function TourResultsContent() {
  const urlParams = useSearchParams();
  const router = useRouter();
  const { setTourSearch } = useSearchStore();

  const search = useMemo(() => paramsToTourSearch(urlParams), [urlParams]);
  const textSearch = urlParams.get("search") || "";

  useEffect(() => {
    setTourSearch(search);
  }, [search, setTourSearch]);
  const [sort, setSort] = useState(urlParams.get("sort") || "departure");
  const [page, setPage] = useState(+(urlParams.get("page") || 1));
  const [sidebarMeal, setSidebarMeal] = useState(search.mealType);
  const [sidebarStars, setSidebarStars] = useState(search.minStars);
  const [sidebarBudget, setSidebarBudget] = useState(search.maxBudget);
  const [sidebarAllInc, setSidebarAllInc] = useState(search.allInclusive);
  const [sidebarHot, setSidebarHot] = useState(urlParams.get("hotTour") === "true");

  const pushParams = useCallback(
    (nextSearch: TourPackageSearch, extra: Record<string, string | number> = {}) => {
      const p = tourSearchToParams(nextSearch, { sort, page: 1, ...extra });
      if (textSearch) p.set("search", textSearch);
      router.push(`/tours/results?${p.toString()}`);
      setPage(1);
    },
    [router, sort, textSearch],
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tour-search", urlParams.toString(), sort, page],
    queryFn: async () => {
      const res = await toursApi.getAll({
        search: textSearch || undefined,
        countryId: search.countryId || undefined,
        cityId: search.cityId || undefined,
        dateFrom: search.dateFrom || undefined,
        dateTo: search.dateTo || undefined,
        adults: search.adults,
        children: search.children,
        mealType: search.mealType || undefined,
        minStars: search.minStars || undefined,
        maxPrice: search.maxBudget || undefined,
        allInclusive: search.allInclusive ? "true" : undefined,
        hotTour: urlParams.get("hotTour") === "true" ? "true" : undefined,
        sort,
        page,
        limit: 9,
      });
      return res.data as ToursResponse;
    },
  });

  const { data: countryName } = useQuery({
    queryKey: ["country-name", search.countryId],
    queryFn: async () => {
      if (!search.countryId) return null;
      const res = await countriesApi.getAll({ limit: 250 });
      const list = (res.data as { data: { id: string; name: string }[] }).data;
      return list.find((c) => c.id === search.countryId)?.name ?? null;
    },
    enabled: !!search.countryId,
  });

  const { data: cityName } = useQuery({
    queryKey: ["city-name", search.cityId],
    queryFn: async () => {
      if (!search.cityId) return null;
      const res = await citiesApi.getAll({ countryId: search.countryId, limit: 100 });
      const list = (res.data as { data: { id: string; name: string }[] }).data;
      return list.find((c) => c.id === search.cityId)?.name ?? null;
    },
    enabled: !!search.cityId,
  });

  const { data: filterMeta } = useQuery({
    queryKey: ["tour-search-filters"],
    queryFn: async () => (await toursApi.getSearchFilters()).data as {
      mealTypes: string[];
      starOptions: number[];
      priceRange: { min: number; max: number };
      sortOptions: { value: string; label: string }[];
    },
  });

  const tours = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleMainSearch = (s: TourPackageSearch) => {
    setTourSearch(s);
    pushParams(s);
  };

  const applySidebarFilters = () => {
    pushParams(
      {
        ...search,
        mealType: sidebarMeal,
        minStars: sidebarStars,
        maxBudget: sidebarBudget,
        allInclusive: sidebarAllInc,
      },
      { hotTour: sidebarHot ? "true" : "", sort },
    );
  };

  const changeSort = (value: string) => {
    setSort(value);
    const p = tourSearchToParams(search, { sort: value, page: 1, hotTour: sidebarHot ? "true" : "" });
    if (textSearch) p.set("search", textSearch);
    router.push(`/tours/results?${p.toString()}`);
    setPage(1);
  };

  const goToPage = (p: number) => {
    setPage(p);
    const params = tourSearchToParams(search, { sort, page: p, hotTour: sidebarHot ? "true" : "" });
    if (textSearch) params.set("search", textSearch);
    router.push(`/tours/results?${params.toString()}`);
  };

  const destinationLabel = [textSearch && `"${textSearch}"`, cityName, countryName].filter(Boolean).join(" · ") || "All destinations";

  return (
    <PageTransition>
      <div className="border-b bg-white py-6 shadow-sm">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <TourPackageSearchForm compact onSubmit={handleMainSearch} submitLabel="Update search" />
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-6 py-8 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#112211]">Tour packages</h1>
          <p className="mt-1 text-gray-500">
            {destinationLabel} · {search.adults} adult{search.adults !== 1 ? "s" : ""}
            {search.children > 0 ? `, ${search.children} child${search.children !== 1 ? "ren" : ""}` : ""}
            {search.dateFrom ? ` · from ${formatDate(search.dateFrom)}` : ""}
            {isLoading ? "" : ` · ${data?.total ?? 0} results`}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          <aside className="space-y-4">
            <Card className="rounded-[24px]">
              <CardContent className="space-y-5 p-5">
                <div className="flex items-center gap-2 font-bold">
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                </div>

                <div>
                  <label className="text-sm font-medium">Meal type</label>
                  <select className="mt-1 h-10 w-full rounded-xl border px-3 text-sm" value={sidebarMeal}
                    onChange={(e) => setSidebarMeal(e.target.value)}>
                    <option value="">Any</option>
                    {(filterMeta?.mealTypes ?? []).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Hotel stars</label>
                  <select className="mt-1 h-10 w-full rounded-xl border px-3 text-sm"
                    value={sidebarStars || ""} onChange={(e) => setSidebarStars(+e.target.value)}>
                    <option value="">Any</option>
                    {(filterMeta?.starOptions ?? [3, 4, 5]).map((s) => (
                      <option key={s} value={s}>{s}+ stars</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Budget: {formatPrice(sidebarBudget)}</label>
                  <input type="range" min={100} max={filterMeta?.priceRange.max ?? 5000} step={50}
                    value={sidebarBudget} onChange={(e) => setSidebarBudget(+e.target.value)} className="mt-2 w-full" />
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={sidebarAllInc} onChange={(e) => setSidebarAllInc(e.target.checked)} />
                  All inclusive
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={sidebarHot} onChange={(e) => setSidebarHot(e.target.checked)} />
                  Hot tours only
                </label>

                <Button className="w-full" onClick={applySidebarFilters}>Apply filters</Button>
              </CardContent>
            </Card>
          </aside>

          <div className="lg:col-span-3">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <select className="h-10 rounded-xl border border-gray-200 px-3 text-sm" value={sort}
                onChange={(e) => changeSort(e.target.value)}>
                {(filterMeta?.sortOptions ?? [
                  { value: "departure", label: "Departure date" },
                  { value: "price_asc", label: "Price: Low to High" },
                  { value: "price_desc", label: "Price: High to Low" },
                ]).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {isError && <p className="text-red-500">Failed to load results. Check API connection.</p>}

            {isLoading ? (
              <div className="grid gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <TourCardSkeleton key={i} variant="list" />
                ))}
              </div>
            ) : tours.length === 0 ? (
              <Card className="rounded-[24px]">
                <CardContent className="py-16 text-center text-gray-500">
                  No tours match your criteria. Try changing dates or filters.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-5">
                {tours.map((t: Tour & { totalPrice?: number }) => (
                  <TourCard
                    key={t.id}
                    tour={t}
                    variant="list"
                    totalPrice={t.totalPrice}
                    travelersLabel={`${search.adults + search.children} travelers`}
                  />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <PaginationBar page={page} totalPages={totalPages} onPageChange={goToPage} className="mt-8" />
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default function TourResultsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-400">Loading search results...</div>}>
      <TourResultsContent />
    </Suspense>
  );
}
