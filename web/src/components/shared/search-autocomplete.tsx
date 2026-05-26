"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RemoteImage } from "@/components/ui/remote-image";
import { useQuery } from "@tanstack/react-query";
import { Search, Globe, MapPin, Building2, Palmtree, Umbrella, Clock, X, Star, ChevronRight } from "lucide-react";
import { searchApi } from "@/lib/api";
import { useSearchHistoryStore } from "@/stores/search-history-store";
import type { SearchResult } from "@/types";
import { cn } from "@/lib/utils";

const TYPE_META = {
  country: { icon: Globe, label: "Country", color: "text-blue-600 bg-blue-50" },
  city: { icon: MapPin, label: "City", color: "text-emerald-600 bg-emerald-50" },
  hotel: { icon: Building2, label: "Hotel", color: "text-violet-600 bg-violet-50" },
  resort: { icon: Umbrella, label: "Resort", color: "text-cyan-600 bg-cyan-50" },
  tour: { icon: Palmtree, label: "Tour", color: "text-orange-600 bg-orange-50" },
} as const;

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

interface SearchAutocompleteProps {
  placeholder?: string;
  className?: string;
  navigateOnSelect?: boolean;
  onSelect?: (result: SearchResult) => void;
}

export function SearchAutocomplete({
  placeholder = "Search countries, cities, hotels...",
  className,
  navigateOnSelect = true,
  onSelect,
}: SearchAutocompleteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, 300);
  const { recent, addRecent, clearRecent } = useSearchHistoryStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 1) return { results: [] as SearchResult[] };
      const res = await searchApi.search(debouncedQuery);
      return res.data as { results: SearchResult[] };
    },
    enabled: debouncedQuery.length >= 1,
  });

  const results = data?.results ?? [];
  const showRecent = open && query.length === 0 && recent.length > 0;
  const showResults = open && query.length > 0 && (results.length > 0 || isLoading);
  const showDropdown = showRecent || showResults;

  const selectResult = useCallback(
    (result: SearchResult) => {
      addRecent(result.label);
      setQuery("");
      setOpen(false);
      onSelect?.(result);
      if (navigateOnSelect) router.push(result.href);
    },
    [addRecent, navigateOnSelect, onSelect, router],
  );

  const followLink = (e: React.MouseEvent, href: string, label: string) => {
    e.stopPropagation();
    addRecent(label);
    setQuery("");
    setOpen(false);
    router.push(href);
  };

  const handleSubmit = () => {
    if (activeIndex >= 0 && results[activeIndex]) {
      selectResult(results[activeIndex]);
      return;
    }
    if (query.trim()) {
      addRecent(query.trim());
      router.push(`/tours/results?search=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown && e.key !== "Enter") return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIndex(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-10 text-sm text-[#112211] placeholder:text-gray-400 focus:border-[#8DD3BB] focus:outline-none focus:ring-2 focus:ring-[#8DD3BB]/30"
          autoComplete="off"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-xl">
          {showRecent && (
            <div className="border-b p-2">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <Clock className="h-3 w-3" /> Recent
                </span>
                <button type="button" onClick={clearRecent} className="text-xs text-[#8DD3BB] hover:underline">Clear</button>
              </div>
              {recent.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { addRecent(r); router.push(`/tours/results?search=${encodeURIComponent(r)}`); setOpen(false); }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-gray-50"
                >
                  <Clock className="h-4 w-4 text-gray-400" />
                  {r}
                </button>
              ))}
            </div>
          )}

          {showResults && (
            <div className="p-2">
              {isLoading && <p className="px-3 py-4 text-sm text-gray-400">Searching...</p>}
              {!isLoading && results.length === 0 && (
                <p className="px-3 py-4 text-sm text-gray-400">No results for &quot;{query}&quot;</p>
              )}
              {results.map((result, i) => {
                const meta = TYPE_META[result.type];
                const Icon = meta.icon;
                return (
                  <div
                    key={`${result.type}-${result.id}`}
                    className={cn(
                      "rounded-xl transition-colors",
                      i === activeIndex ? "bg-[#8DD3BB]/10" : "hover:bg-gray-50",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => selectResult(result)}
                      className="flex w-full items-start gap-3 px-3 py-3 text-left"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                        {result.image ? (
                          <RemoteImage src={result.image} alt="" fill className="object-cover" sizes="56px" />
                        ) : result.flag ? (
                          <div className="flex h-full w-full items-center justify-center text-2xl">{result.flag}</div>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Icon className="h-6 w-6 text-gray-300" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[#112211]">{result.label}</p>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
                              {result.country && (
                                <span className="flex items-center gap-1">
                                  {result.flag && <span>{result.flag}</span>}
                                  {result.country}
                                </span>
                              )}
                              {result.subtitle && <span>· {result.subtitle}</span>}
                            </p>
                          </div>
                          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", meta.color)}>
                            {meta.label}
                          </span>
                        </div>

                        {result.stars != null && result.stars > 0 && (
                          <div className="mt-1.5 flex items-center gap-0.5">
                            {Array.from({ length: result.stars }).map((_, si) => (
                              <Star key={si} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ))}
                            <span className="ml-1 text-xs text-gray-400">{result.stars}-star hotel</span>
                          </div>
                        )}
                      </div>

                      <ChevronRight className="mt-4 h-4 w-4 shrink-0 text-gray-300" />
                    </button>

                    {result.quickLinks && result.quickLinks.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 px-3 pb-3 pl-[4.25rem]">
                        {result.quickLinks.map((link) => (
                          <button
                            key={link.href + link.label}
                            type="button"
                            onClick={(e) => followLink(e, link.href, result.label)}
                            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-[#8DD3BB] hover:text-[#112211]"
                          >
                            {link.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
