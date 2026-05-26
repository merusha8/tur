"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { countriesApi, citiesApi, toursApi } from "@/lib/api";
import { useSearchStore, defaultTourSearch, type TourPackageSearch } from "@/stores/search-store";
import { cn, formatPrice } from "@/lib/utils";

interface Country {
  id: string;
  name: string;
  flag: string;
}

interface City {
  id: string;
  name: string;
  popular?: boolean;
}

interface TourSearchFilters {
  mealTypes: string[];
  starOptions: number[];
  priceRange: { min: number; max: number };
}

interface TourPackageSearchFormProps {
  compact?: boolean;
  onSubmit?: (search: TourPackageSearch) => void;
  submitLabel?: string;
  className?: string;
}

export function TourPackageSearchForm({
  compact,
  onSubmit,
  submitLabel = "Search tours",
  className,
}: TourPackageSearchFormProps) {
  const { tourSearch, setTourSearch } = useSearchStore();

  const { data: countriesData } = useQuery({
    queryKey: ["countries-all"],
    queryFn: async () => {
      const res = await countriesApi.getAll({ limit: 250 });
      const payload = res.data as { data: Country[] };
      return payload.data ?? [];
    },
  });

  const { data: cities = [] } = useQuery({
    queryKey: ["cities-by-country", tourSearch.countryId],
    queryFn: async () => {
      if (!tourSearch.countryId) return [];
      const res = await citiesApi.getAll({ countryId: tourSearch.countryId, limit: 100 });
      const payload = res.data as { data: City[] };
      return payload.data ?? [];
    },
    enabled: !!tourSearch.countryId,
  });

  const { data: filters } = useQuery({
    queryKey: ["tour-search-filters"],
    queryFn: async () => (await toursApi.getSearchFilters()).data as TourSearchFilters,
  });

  useEffect(() => {
    if (filters?.priceRange.max && defaultTourSearch.maxBudget === tourSearch.maxBudget) {
      setTourSearch({ maxBudget: Math.min(filters.priceRange.max, 5000) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.priceRange.max]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(tourSearch);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      <div className={cn("grid gap-4", compact ? "md:grid-cols-3 lg:grid-cols-5" : "md:grid-cols-2 lg:grid-cols-4")}>
        <div>
          <Label>Country</Label>
          <select
            className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm"
            value={tourSearch.countryId}
            onChange={(e) => setTourSearch({ countryId: e.target.value, cityId: "" })}
          >
            <option value="">All countries</option>
            {(countriesData ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.flag} {c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <Label>City / Resort</Label>
          <select
            className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm"
            value={tourSearch.cityId}
            onChange={(e) => setTourSearch({ cityId: e.target.value })}
            disabled={!tourSearch.countryId}
          >
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.popular ? " ★" : ""}</option>
            ))}
          </select>
        </div>

        <div>
          <Label>Departure from</Label>
          <Input type="date" className="mt-1.5" value={tourSearch.dateFrom}
            onChange={(e) => setTourSearch({ dateFrom: e.target.value })} />
        </div>

        <div>
          <Label>Departure to</Label>
          <Input type="date" className="mt-1.5" value={tourSearch.dateTo}
            onChange={(e) => setTourSearch({ dateTo: e.target.value })} />
        </div>

        <div>
          <Label>Adults</Label>
          <Input type="number" min={1} max={10} className="mt-1.5" value={tourSearch.adults}
            onChange={(e) => setTourSearch({ adults: +e.target.value })} />
        </div>

        <div>
          <Label>Children</Label>
          <Input type="number" min={0} max={8} className="mt-1.5" value={tourSearch.children}
            onChange={(e) => setTourSearch({ children: +e.target.value })} />
        </div>

        <div>
          <Label>Meal type</Label>
          <select
            className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm"
            value={tourSearch.mealType}
            onChange={(e) => setTourSearch({ mealType: e.target.value })}
          >
            <option value="">Any meal plan</option>
            {(filters?.mealTypes ?? []).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <Label>Hotel stars (min)</Label>
          <select
            className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm"
            value={tourSearch.minStars || ""}
            onChange={(e) => setTourSearch({ minStars: +e.target.value })}
          >
            <option value="">Any</option>
            {(filters?.starOptions ?? [3, 4, 5]).map((s) => (
              <option key={s} value={s}>{s}+ stars</option>
            ))}
          </select>
        </div>

        <div>
          <Label>Budget (max per person)</Label>
          <Input type="range" min={filters?.priceRange.min ?? 100} max={filters?.priceRange.max ?? 5000}
            step={50} value={tourSearch.maxBudget} className="mt-3 w-full"
            onChange={(e) => setTourSearch({ maxBudget: +e.target.value })} />
          <p className="mt-1 text-sm text-gray-500">Up to {formatPrice(tourSearch.maxBudget)}</p>
        </div>

        <div className="flex items-end">
          <label className="flex h-11 w-full items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm">
            <input type="checkbox" checked={tourSearch.allInclusive}
              onChange={(e) => setTourSearch({ allInclusive: e.target.checked })} />
            All inclusive only
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg">{submitLabel}</Button>
      </div>
    </form>
  );
}
