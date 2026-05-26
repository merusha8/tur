"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import type { HotelSearchFilters } from "@/types";

export interface HotelFilterState {
  minPrice: number;
  maxPrice: number;
  minStars: number;
  minRating: number;
  mealType: string;
  allInclusive: boolean;
  beach: boolean;
  beachType: string;
  wifi: boolean;
  pool: boolean;
  familyFriendly: boolean;
  luxury: boolean;
  transferIncluded: boolean;
  sort: string;
}

interface Props {
  filters: HotelFilterState;
  meta?: HotelSearchFilters;
  onChange: (patch: Partial<HotelFilterState>) => void;
  onApply: () => void;
  onReset: () => void;
}

function FilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 accent-[#8DD3BB]"
      />
      {label}
    </label>
  );
}

export function HotelSearchFiltersPanel({ filters, meta, onChange, onApply, onReset }: Props) {
  const priceMax = meta?.priceRange.max ?? 2000;
  const priceMin = meta?.priceRange.min ?? 50;

  return (
    <Card>
      <CardContent className="space-y-5 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">Filters</h3>
          <button type="button" onClick={onReset} className="text-xs text-[#8DD3BB] hover:underline">
            Reset
          </button>
        </div>

        <div>
          <label className="text-sm font-medium">Sort</label>
          <select
            className="mt-1 h-10 w-full rounded-xl border px-3 text-sm"
            value={filters.sort}
            onChange={(e) => onChange({ sort: e.target.value })}
          >
            {(meta?.sortOptions ?? [
              { value: "rating", label: "Best rating" },
              { value: "price_asc", label: "Price: low to high" },
              { value: "price_desc", label: "Price: high to low" },
              { value: "stars", label: "Stars" },
            ]).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">
            Price: {formatPrice(filters.minPrice)} – {formatPrice(filters.maxPrice)}/night
          </label>
          <div className="mt-2 space-y-2">
            <input
              type="range"
              min={priceMin}
              max={priceMax}
              value={filters.maxPrice}
              onChange={(e) => onChange({ maxPrice: +e.target.value })}
              className="w-full"
            />
            <input
              type="range"
              min={priceMin}
              max={priceMax}
              value={filters.minPrice}
              onChange={(e) => onChange({ minPrice: Math.min(+e.target.value, filters.maxPrice) })}
              className="w-full"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Stars (min)</label>
          <select
            className="mt-1 h-10 w-full rounded-xl border px-3 text-sm"
            value={filters.minStars}
            onChange={(e) => onChange({ minStars: +e.target.value })}
          >
            <option value={0}>Any</option>
            {(meta?.starOptions ?? [2, 3, 4, 5]).map((s) => (
              <option key={s} value={s}>{s}+ stars</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Rating (min)</label>
          <select
            className="mt-1 h-10 w-full rounded-xl border px-3 text-sm"
            value={filters.minRating}
            onChange={(e) => onChange({ minRating: +e.target.value })}
          >
            <option value={0}>Any</option>
            <option value={3}>3.0+</option>
            <option value={3.5}>3.5+</option>
            <option value={4}>4.0+</option>
            <option value={4.5}>4.5+</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Meal plan</label>
          <select
            className="mt-1 h-10 w-full rounded-xl border px-3 text-sm"
            value={filters.mealType}
            onChange={(e) => onChange({ mealType: e.target.value, allInclusive: false })}
          >
            <option value="">Any</option>
            {(meta?.mealTypes ?? []).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2 border-t pt-3">
          <FilterCheckbox label="All inclusive" checked={filters.allInclusive} onChange={(v) => onChange({ allInclusive: v, mealType: v ? "" : filters.mealType })} />
          <FilterCheckbox label="Beach access" checked={filters.beach} onChange={(v) => onChange({ beach: v })} />
          <FilterCheckbox label="Wi-Fi" checked={filters.wifi} onChange={(v) => onChange({ wifi: v })} />
          <FilterCheckbox label="Pool" checked={filters.pool} onChange={(v) => onChange({ pool: v })} />
          <FilterCheckbox label="Family friendly" checked={filters.familyFriendly} onChange={(v) => onChange({ familyFriendly: v })} />
          <FilterCheckbox label="Luxury" checked={filters.luxury} onChange={(v) => onChange({ luxury: v })} />
          <FilterCheckbox label="Transfer included" checked={filters.transferIncluded} onChange={(v) => onChange({ transferIncluded: v })} />
        </div>

        {filters.beach && (
          <div>
            <label className="text-sm font-medium">Beach type</label>
            <select
              className="mt-1 h-10 w-full rounded-xl border px-3 text-sm"
              value={filters.beachType}
              onChange={(e) => onChange({ beachType: e.target.value })}
            >
              <option value="">Any beach</option>
              {(meta?.beachTypes ?? []).map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        )}

        <Button className="w-full" onClick={onApply}>Apply filters</Button>
      </CardContent>
    </Card>
  );
}

export function paramsToHotelFilters(params: URLSearchParams, defaults?: HotelSearchFilters): HotelFilterState {
  const priceMax = defaults?.priceRange.max ?? 2000;
  return {
    minPrice: +(params.get("minPrice") || defaults?.priceRange.min || 50),
    maxPrice: +(params.get("maxPrice") || priceMax),
    minStars: +(params.get("minStars") || 0),
    minRating: +(params.get("minRating") || 0),
    mealType: params.get("mealType") || "",
    allInclusive: params.get("allInclusive") === "true",
    beach: params.get("beach") === "true",
    beachType: params.get("beachType") || "",
    wifi: params.get("wifi") === "true",
    pool: params.get("pool") === "true",
    familyFriendly: params.get("familyFriendly") === "true",
    luxury: params.get("luxury") === "true",
    transferIncluded: params.get("transferIncluded") === "true",
    sort: params.get("sort") || "rating",
  };
}

export function hotelFiltersToParams(
  base: URLSearchParams,
  filters: HotelFilterState,
  page = 1,
): URLSearchParams {
  const p = new URLSearchParams(base.toString());
  p.set("page", String(page));
  p.set("sort", filters.sort);

  if (filters.minPrice > 50) p.set("minPrice", String(filters.minPrice));
  else p.delete("minPrice");
  if (filters.maxPrice < 2000) p.set("maxPrice", String(filters.maxPrice));
  else p.delete("maxPrice");

  if (filters.minStars) p.set("minStars", String(filters.minStars));
  else p.delete("minStars");
  if (filters.minRating) p.set("minRating", String(filters.minRating));
  else p.delete("minRating");
  if (filters.mealType) p.set("mealType", filters.mealType);
  else p.delete("mealType");

  const boolKeys: (keyof HotelFilterState)[] = [
    "allInclusive", "beach", "wifi", "pool", "familyFriendly", "luxury", "transferIncluded",
  ];
  boolKeys.forEach((key) => {
    if (filters[key]) p.set(key, "true");
    else p.delete(key);
  });

  if (filters.beachType) p.set("beachType", filters.beachType);
  else p.delete("beachType");

  return p;
}
