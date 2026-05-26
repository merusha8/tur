"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { destinationsApi } from "@/lib/api";
import { PageTransition } from "@/components/shared/page-transition";
import { DetailPageSkeleton, NotFoundState, PageErrorState } from "@/components/shared/query-states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { Star, MapPin, ChevronDown } from "lucide-react";
import type { Destination } from "@/types";
import { ReviewsSection } from "@/components/reviews/reviews-section";
import { TourCard } from "@/components/tours/tour-card";

export default function DestinationDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const { data: destination, isLoading, isError, refetch } = useQuery({
    queryKey: ["destination", slug],
    queryFn: async () => (await destinationsApi.getOne(slug)).data as Destination,
    retry: 1,
  });

  if (isLoading) return <DetailPageSkeleton />;
  if (isError) {
    return (
      <PageErrorState
        message="Could not load this destination."
        onRetry={() => refetch()}
        backHref="/destinations"
        backLabel="All destinations"
      />
    );
  }
  if (!destination) return <NotFoundState title="Destination not found" backHref="/destinations" backLabel="All destinations" />;

  const faq = (destination.faq as { q: string; a: string }[]) || [];

  return (
    <PageTransition>
      {/* Hero */}
      <section className="relative h-[420px]">
        <Image src={destination.heroImage} alt={destination.name} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative mx-auto flex h-full max-w-[1200px] flex-col justify-end px-6 pb-12 lg:px-8">
          <div className="flex items-center gap-2 text-white/80"><MapPin className="h-4 w-4" />{destination.country}</div>
          <h1 className="mt-2 text-5xl font-bold text-white">{destination.name}</h1>
          <div className="mt-3 flex items-center gap-2 text-white">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{destination.rating.toFixed(1)}</span>
            <span className="text-white/70">({destination.reviewCount} reviews)</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-6 py-12 lg:px-8">
        {/* Gallery */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {destination.images.slice(0, 4).map((img, i) => (
            <div key={i} className={`relative overflow-hidden rounded-[24px] ${i === 0 ? "col-span-2 row-span-2 h-64 md:h-80" : "h-32 md:h-auto"}`}>
              <Image src={img} alt="" fill className="object-cover" />
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="mt-12 grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-10">
            <div>
              <h2 className="text-2xl font-bold">About {destination.name}</h2>
              <p className="mt-4 leading-relaxed text-gray-600">{destination.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {destination.categories.map((c) => (
                  <span key={c} className="rounded-full bg-[#8DD3BB]/20 px-3 py-1 text-sm font-medium text-[#112211]">{c}</span>
                ))}
              </div>
            </div>

            {/* Tours */}
            {destination.tours && destination.tours.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold">Available Tours</h2>
                <div className="mt-6 space-y-5">
                  {destination.tours.map((t) => (
                    <TourCard key={t.id} tour={t} variant="list" />
                  ))}
                </div>
              </div>
            )}

            {/* Hotels */}
            {destination.hotels && destination.hotels.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold">Hotels in {destination.name}</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {destination.hotels.map((h) => (
                    <Link key={h.id} href={`/hotels/${h.id}`}>
                      <Card className="rounded-[24px] transition-shadow hover:shadow-md">
                        <CardContent className="p-4">
                          <h3 className="font-bold">{h.name}</h3>
                          <p className="text-sm text-gray-500">{formatPrice(h.pricePerNight)}/night</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            <Card className="rounded-[24px]"><CardContent className="flex h-56 items-center justify-center bg-gray-50 text-gray-400">
              <MapPin className="mr-2 h-5 w-5" /> Map — {destination.name}, {destination.country}
            </CardContent></Card>

            <ReviewsSection destinationId={destination.id} />

            {/* FAQ */}
            {faq.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold">FAQ</h2>
                <div className="mt-6 space-y-3">
                  {faq.map((item, i) => (
                    <div key={i} className="rounded-[24px] border border-gray-100 bg-white">
                      <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between p-5 text-left font-medium">
                        {item.q}<ChevronDown className={`h-4 w-4 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                      </button>
                      {openFaq === i && <p className="border-t px-5 pb-5 pt-3 text-sm text-gray-600">{item.a}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <Card className="sticky top-24 rounded-[24px]">
              <CardContent className="p-6">
                <h3 className="font-bold">Plan your trip</h3>
                <p className="mt-2 text-sm text-gray-500">Find flights, hotels, and tours to {destination.name}</p>
                <div className="mt-4 space-y-2">
                  <Link href={`/flights/results?destination=${destination.name}`}><Button variant="outline" className="w-full">Search Flights</Button></Link>
                  <Link href={`/hotels/results?city=${destination.name}`}><Button variant="outline" className="w-full">Find Hotels</Button></Link>
                  <Link href={`/tours?cityId=${destination.city?.id || ""}`}><Button className="w-full">Browse Tours</Button></Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
