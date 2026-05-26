"use client";

import Link from "next/link";
import { RemoteImage } from "@/components/ui/remote-image";
import { useQuery } from "@tanstack/react-query";
import { SearchWidget } from "@/components/shared/search-widget";
import { DestinationCard, DestinationCardSkeleton } from "@/components/shared/destination-card";
import { HotTourCard, HotTourCardSkeleton } from "@/components/shared/hot-tour-card";
import { HotelCard, HotelCardSkeleton } from "@/components/shared/hotel-card";
import { PageTransition, FadeIn } from "@/components/shared/page-transition";
import { Button } from "@/components/ui/button";
import { publicApi } from "@/lib/api";
import { Star, Plane, Hotel as HotelIcon, Palmtree, Flame, TrendingUp, Tag, AlertCircle } from "lucide-react";
import { PlanTripGrid, PlanTripGridSkeleton } from "@/components/shared/plan-trip-grid";
import type { HomePageData } from "@/types";

const ICON_MAP = { Plane, Hotel: HotelIcon, Palmtree } as const;

export default function HomePage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["home"],
    queryFn: async () => (await publicApi.getHome()).data as HomePageData,
    retry: 2,
  });

  if (isError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <h2 className="text-xl font-bold">Unable to load data</h2>
        <p className="text-gray-500">Make sure the API server and PostgreSQL are running.</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  const hotTours = data?.hotTours ?? [];
  const bestDeals = data?.bestDeals ?? [];
  const trending = data?.trendingDestinations ?? [];
  const popularHotels = data?.popularHotels ?? [];
  const reviews = data?.featuredReviews ?? [];
  const promoBanners = data?.promoBanners ?? [];
  const planTripCities = data?.planTripCities ?? [];
  const hero = data?.hero;

  return (
    <PageTransition>
      <section className="relative -mt-16 min-h-[90vh] pt-16">
        {hero?.image && (
          <RemoteImage src={hero.image} alt="Hero" fill className="object-cover" priority />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/50" />
        <div className="relative mx-auto flex max-w-[1200px] flex-col items-center px-6 pt-36 text-center lg:px-8">
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white md:text-[56px] md:leading-[1.1]">
            {hero?.title || (isLoading ? "Loading..." : "")}
          </h1>
          {hero?.subtitle && <p className="mt-4 text-lg text-white/85 md:text-xl">{hero.subtitle}</p>}
        </div>
        <div className="relative mx-auto -mt-6 max-w-[960px] px-6 pb-20 lg:px-8">
          <SearchWidget />
        </div>
      </section>

      {/* Hot Tours */}
      <section className="bg-gradient-to-b from-red-50 to-white py-20">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <FadeIn>
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-red-600">
                  <Flame className="h-7 w-7" />
                  <span className="text-sm font-bold uppercase tracking-wider">Limited time</span>
                </div>
                <h2 className="mt-1 text-[32px] font-bold text-[#112211]">Hot Tours</h2>
                <p className="mt-1 text-gray-500">Last minute deals · countdown timers · up to 45% off</p>
              </div>
              <Link href="/hot-tours"><Button className="bg-red-600 hover:bg-red-700">View all hot tours</Button></Link>
            </div>
          </FadeIn>
          <div className="grid gap-6 md:grid-cols-2">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <HotTourCardSkeleton key={i} />)
              : hotTours.length === 0
              ? <p className="col-span-full text-center text-gray-500">No hot tours available.</p>
              : hotTours.map((deal, i) => (
                <FadeIn key={deal.id} delay={i * 0.05}>
                  <HotTourCard deal={deal} variant={i === 0 ? "hero" : "default"} />
                </FadeIn>
              ))}
          </div>
        </div>
      </section>

      {/* Plan your perfect trip */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <FadeIn>
            <div className="mb-10 text-center">
              <h2 className="text-[32px] font-bold text-[#112211]">Plan your perfect trip</h2>
              <p className="mt-2 text-gray-500">Hand-picked destinations for unforgettable journeys</p>
            </div>
          </FadeIn>
          {isLoading ? <PlanTripGridSkeleton /> : <PlanTripGrid cities={planTripCities} />}
        </div>
      </section>

      {/* Trending Destinations */}
      <section className="bg-[#FAFBFC] py-20">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <FadeIn>
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-7 w-7 text-[#8DD3BB]" />
                <h2 className="text-[32px] font-bold tracking-tight text-[#112211]">Trending Destinations</h2>
              </div>
              <Link href="/destinations"><Button variant="outline" className="rounded-xl border-gray-200 px-6">See all places</Button></Link>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => <DestinationCardSkeleton key={i} />)
              : trending.length === 0
              ? <p className="col-span-full text-center text-gray-500">No destinations available yet.</p>
              : trending.map((d, i) => (
                <FadeIn key={d.slug} delay={i * 0.04}>
                  <DestinationCard slug={d.slug} name={d.name} country={d.country} image={d.heroImage} categories={d.categories} />
                </FadeIn>
              ))}
          </div>
        </div>
      </section>

      {/* Popular Hotels */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <FadeIn>
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <HotelIcon className="h-7 w-7 text-[#8DD3BB]" />
                <h2 className="text-[32px] font-bold text-[#112211]">Popular Hotels</h2>
              </div>
              <Link href="/hotels"><Button variant="outline">Browse hotels</Button></Link>
            </div>
          </FadeIn>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <HotelCardSkeleton key={i} />)
              : popularHotels.map((h, i) => (
                <FadeIn key={h.id} delay={i * 0.05}>
                  <HotelCard hotel={h} />
                </FadeIn>
              ))}
          </div>
        </div>
      </section>

      {/* Best Deals */}
      {bestDeals.length > 0 && (
        <section className="bg-gradient-to-r from-[#112211] to-[#1a3a2a] py-20 text-white">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
            <div className="mb-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Tag className="h-7 w-7 text-[#8DD3BB]" />
                <div>
                  <h2 className="text-[32px] font-bold">Best Deals</h2>
                  <p className="text-white/70">Highest discounts — grab them before they&apos;re gone</p>
                </div>
              </div>
              <Link href="/hot-tours?sort=discount"><Button variant="outline" className="border-white/30 text-white hover:bg-white/10">All deals</Button></Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {bestDeals.map((deal) => (
                <HotTourCard key={`best-${deal.id}`} deal={deal} variant="compact" />
              ))}
            </div>
          </div>
        </section>
      )}

      {promoBanners.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-6 py-16 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {promoBanners.map((item) => {
              const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP] || Plane;
              return (
                <FadeIn key={item.id}>
                  <Link href={item.href} className="group block overflow-hidden rounded-[24px]">
                    <div className="relative h-64 overflow-hidden">
                      <RemoteImage src={item.image} alt={item.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 p-6 text-white">
                        <Icon className="mb-3 h-7 w-7" />
                        <h3 className="text-2xl font-bold">{item.title}</h3>
                        <p className="mt-1 text-sm text-white/80">{item.description}</p>
                        <span className="mt-4 inline-block rounded-xl bg-[#8DD3BB] px-5 py-2 text-sm font-semibold text-[#112211]">{item.buttonText}</span>
                      </div>
                    </div>
                  </Link>
                </FadeIn>
              );
            })}
          </div>
        </section>
      )}

      {reviews.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-6 py-20 lg:px-8">
          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-[32px] font-bold text-[#112211]">Reviews</h2>
            <Link href="/about"><Button variant="outline">See All</Button></Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {reviews.map((r, i) => (
              <FadeIn key={r.id} delay={i * 0.1}>
                <div className="overflow-hidden rounded-[24px] border bg-white">
                  <div className="p-6">
                    <div className="flex gap-1">
                      {Array.from({ length: r.rating }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <h3 className="mt-4 text-lg font-bold">{r.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">{r.comment}</p>
                    <p className="mt-4 text-sm font-medium text-[#112211]">
                      {r.user?.firstName} {r.user?.lastName}{r.location ? ` · ${r.location}` : ""}
                    </p>
                  </div>
                  {r.imageUrl && (
                    <RemoteImage src={r.imageUrl} alt="" width={400} height={200} className="h-44 w-full object-cover" />
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </section>
      )}
    </PageTransition>
  );
}
