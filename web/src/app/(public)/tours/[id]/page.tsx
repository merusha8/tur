"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { toursApi, favoritesApi } from "@/lib/api";
import { PageTransition } from "@/components/shared/page-transition";
import { DetailPageSkeleton, NotFoundState, PageErrorState } from "@/components/shared/query-states";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { FALLBACK_TRAVEL_IMAGE } from "@/lib/image-utils";
import { useStartCheckout } from "@/hooks/use-start-checkout";
import { useSearchStore } from "@/stores/search-store";
import { Clock, Users, Plane, Calendar, Tag, Heart } from "lucide-react";
import { toast } from "sonner";
import type { Tour } from "@/types";
import { ReviewsSection } from "@/components/reviews/reviews-section";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function TourDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const tourSearch = useSearchStore((s) => s.tourSearch);
  const guests = tourSearch.adults + tourSearch.children;

  const { data: tour, isLoading, isError, refetch } = useQuery({
    queryKey: ["tour", id],
    queryFn: async () => (await toursApi.getOne(id)).data as Tour,
    retry: 1,
  });

  const checkout = useStartCheckout();

  const favoriteMutation = useMutation({
    mutationFn: () => favoritesApi.toggle({ tourId: id }),
    onSuccess: (res) => toast.success(res.data.favorited ? "Added to favorites" : "Removed from favorites"),
    onError: () => { toast.error("Login required"); router.push("/auth/login"); },
  });

  const totalPrice = tour ? tour.price * guests : 0;

  const handleBook = () => {
    if (!tour) return;
    checkout.mutate({
      type: "TOUR",
      tourId: tour.id,
      totalPrice,
      guests,
    });
  };

  if (isLoading) return <DetailPageSkeleton />;
  if (isError) {
    return (
      <PageErrorState
        message="Could not load this tour package."
        onRetry={() => refetch()}
        backHref="/tours"
        backLabel="Browse tours"
      />
    );
  }
  if (!tour) return <NotFoundState title="Tour not found" backHref="/tours" backLabel="Browse tours" />;

  const heroImage = tour.images[0] || FALLBACK_TRAVEL_IMAGE;

  return (
    <PageTransition>
      <section className="relative h-[400px]">
        <Image src={heroImage} alt={tour.title} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative mx-auto flex h-full max-w-[1200px] flex-col justify-end px-6 pb-10 lg:px-8">
          <p className="text-white/80">{tour.city?.name}{tour.country?.name ? `, ${tour.country.name}` : ""}</p>
          <h1 className="mt-1 text-4xl font-bold text-white md:text-5xl">{tour.title}</h1>
          <div className="mt-3 flex items-center gap-3">
            {tour.hotTour && (
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-sm font-semibold text-white">
                <Tag className="h-4 w-4" /> Hot tour
              </span>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/90 hover:bg-white"
              onClick={() => favoriteMutation.mutate()}
              disabled={favoriteMutation.isPending}
            >
              <Heart className="mr-2 h-4 w-4" /> Save
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-6 py-12 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2 text-gray-600"><Clock className="h-5 w-5" />{tour.duration} days</div>
              <div className="flex items-center gap-2 text-gray-600"><Users className="h-5 w-5" />{tour.availableSeats} seats left</div>
              <div className="flex items-center gap-2 text-gray-600"><Plane className="h-5 w-5" />{tour.airline}</div>
              <div className="flex items-center gap-2 text-gray-600"><Calendar className="h-5 w-5" />{formatDate(tour.departureDate)} – {formatDate(tour.returnDate)}</div>
            </div>

            <div>
              <h2 className="text-2xl font-bold">Overview</h2>
              <p className="mt-4 leading-relaxed text-gray-600">{tour.description}</p>
            </div>

            {tour.hotel && (
              <Card className="rounded-[24px]">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold">Included hotel</h2>
                  <p className="mt-2 font-medium">{tour.hotel.name}</p>
                  <p className="text-sm text-gray-500">
                    {tour.hotel.stars ? `${tour.hotel.stars}★ · ` : ""}
                    {tour.hotel.mealType || (tour.allInclusive ? "All inclusive" : "Meals as per package")}
                  </p>
                </CardContent>
              </Card>
            )}

            <ReviewsSection tourId={tour.id} showForm />
          </div>

          <Card className="sticky top-24 h-fit rounded-[24px]">
            <CardContent className="p-6">
              {tour.oldPrice && tour.oldPrice > tour.price && (
                <p className="text-lg text-gray-400 line-through">{formatPrice(tour.oldPrice)}</p>
              )}
              <p className="text-3xl font-bold">{formatPrice(tour.price)}</p>
              <p className="text-sm text-gray-500">per person · {guests} traveler{guests !== 1 ? "s" : ""}</p>
              {guests > 1 && <p className="text-sm font-medium text-[#112211]">Total: {formatPrice(totalPrice)}</p>}
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p>{tour.duration} days · {tour.allInclusive ? "All inclusive" : "Standard package"}</p>
                <p>Departure: {formatDate(tour.departureDate)}</p>
                <p>Airline: {tour.airline}</p>
              </div>
              <Button className="mt-6 w-full" size="lg" onClick={handleBook} disabled={checkout.isPending || tour.availableSeats <= 0}>
                {checkout.isPending ? "Booking..." : tour.availableSeats <= 0 ? "Sold out" : "Continue to checkout"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
