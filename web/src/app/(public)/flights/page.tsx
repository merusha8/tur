"use client";

import { SearchWidget } from "@/components/shared/search-widget";
import { PageTransition } from "@/components/shared/page-transition";
import { PageHero } from "@/components/shared/page-hero";

export default function FlightsPage() {
  return (
    <PageTransition>
      <section className="relative">
        <PageHero href="/flights" fallbackTitle="Find Your Perfect Flight" />
        <div className="mx-auto -mt-16 max-w-5xl px-4 pb-12">
          <SearchWidget />
        </div>
      </section>
    </PageTransition>
  );
}
