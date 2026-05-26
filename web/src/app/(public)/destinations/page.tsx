"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { destinationsApi } from "@/lib/api";
import { DestinationCard, DestinationCardSkeleton } from "@/components/shared/destination-card";
import { SearchAutocomplete } from "@/components/shared/search-autocomplete";
import { PageTransition } from "@/components/shared/page-transition";
import type { Destination } from "@/types";

function DestinationsContent() {
  const params = useSearchParams();
  const search = params.get("search") || "";

  const { data: destinations = [], isLoading, isError } = useQuery({
    queryKey: ["destinations", search],
    queryFn: async () => {
      const res = await destinationsApi.getAll(search ? { search } : undefined);
      return res.data as Destination[];
    },
  });

  return (
    <PageTransition>
      <div className="bg-[#FAFBFC] py-12">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-[#112211]">All Destinations</h1>
          <p className="mt-2 text-gray-500">Explore {destinations.length} amazing places worldwide</p>
          <div className="mt-8 max-w-xl">
            <SearchAutocomplete placeholder="Search destinations..." />
          </div>
          {isError && <p className="mt-4 text-red-500">Failed to load destinations.</p>}
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 9 }).map((_, i) => <DestinationCardSkeleton key={i} />)
              : destinations.length === 0
              ? <p className="col-span-full text-center text-gray-500">No destinations found.</p>
              : destinations.map((d) => (
                <DestinationCard key={d.slug} slug={d.slug} name={d.name} country={d.country} image={d.heroImage} categories={d.categories} />
              ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default function DestinationsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-400">Loading...</div>}>
      <DestinationsContent />
    </Suspense>
  );
}
