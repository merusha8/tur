"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { flightsApi, favoritesApi } from "@/lib/api";
import { PageTransition } from "@/components/shared/page-transition";
import { DetailPageSkeleton, NotFoundState, PageErrorState } from "@/components/shared/query-states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDuration, formatDate } from "@/lib/utils";
import { useBookingStore } from "@/stores/booking-store";
import { useSearchStore } from "@/stores/search-store";
import { useStartCheckout } from "@/hooks/use-start-checkout";
import { Star, Shield, Luggage, Heart } from "lucide-react";
import { toast } from "sonner";
import type { FlightOffer } from "@/types";

export default function FlightDetailPage() {
  const { id: rawId } = useParams<{ id: string }>();
  const id = decodeURIComponent(rawId);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSelectedFlight } = useBookingStore();
  const flightSearch = useSearchStore((s) => s.flightSearch);
  const passengers = +(searchParams.get("passengers") || flightSearch.passengers || 1);

  const { data: flight, isLoading, isError, refetch } = useQuery({
    queryKey: ["flight", id],
    queryFn: async () => (await flightsApi.getOne(id)).data as FlightOffer,
    retry: 1,
  });

  const checkout = useStartCheckout();

  const favoriteMutation = useMutation({
    mutationFn: () => favoritesApi.toggle({ flightId: id }),
    onSuccess: (res) => toast.success(res.data.favorited ? "Added to favorites" : "Removed from favorites"),
    onError: () => { toast.error("Login required"); router.push("/auth/login"); },
  });

  const totalPrice = flight ? flight.price * passengers : 0;

  const handleBook = () => {
    if (!flight) return;
    setSelectedFlight(flight.id, totalPrice);
    checkout.mutate({
      type: "FLIGHT",
      flightId: flight.id,
      totalPrice,
      passengers,
    });
  };

  if (isLoading) return <DetailPageSkeleton />;
  if (isError) {
    return (
      <PageErrorState
        message="Could not load this flight offer."
        onRetry={() => refetch()}
        backHref="/flights"
        backLabel="Search flights"
      />
    );
  }
  if (!flight) return <NotFoundState title="Flight not found" backHref="/flights" backLabel="Search flights" />;

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {flight.image && (
              <Image src={flight.image} alt={flight.airline} width={900} height={400} className="w-full rounded-2xl object-cover" />
            )}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold">{flight.airline} {flight.aircraft || flight.flightNumber}</h1>
                  <div className="mt-2 flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{flight.rating}</span>
                    <span className="text-gray-400">· {flight.class || "Economy"}</span>
                    {flight.source && flight.source !== "database" && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium capitalize text-blue-700">{flight.source}</span>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => favoriteMutation.mutate()} disabled={favoriteMutation.isPending}>
                  <Heart className="mr-2 h-4 w-4" /> Save
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader><CardTitle>Itinerary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border-l-4 border-[#8DD3BB] pl-4">
                  <div>
                    <p className="font-bold">{flight.origin} ({flight.originCode})</p>
                    <p className="text-sm text-gray-500">{formatDate(flight.departureTime)} · {new Date(flight.departureTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 pl-4">Duration: {formatDuration(flight.duration)}</p>
                <div className="flex items-center justify-between border-l-4 border-[#8DD3BB] pl-4">
                  <div>
                    <p className="font-bold">{flight.destination} ({flight.destinationCode})</p>
                    <p className="text-sm text-gray-500">{formatDate(flight.arrivalTime)} · {new Date(flight.arrivalTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card><CardContent className="flex items-start gap-3 p-4"><Shield className="h-5 w-5 text-[#8DD3BB]" /><div><p className="font-bold">Refund Policy</p><p className="text-sm text-gray-500">Free cancellation up to 24 hours before departure.</p></div></CardContent></Card>
              <Card><CardContent className="flex items-start gap-3 p-4"><Luggage className="h-5 w-5 text-[#8DD3BB]" /><div><p className="font-bold">Baggage</p><p className="text-sm text-gray-500">1 carry-on + 1 checked bag included.</p></div></CardContent></Card>
            </div>
          </div>

          <div>
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <p className="text-3xl font-bold">{formatPrice(flight.price)}</p>
                <p className="text-sm text-gray-500">per passenger</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {(flight.amenities ?? []).map((a) => (<li key={a} className="text-gray-600">✓ {a}</li>))}
                </ul>
                <Button className="mt-6 w-full" size="lg" onClick={handleBook} disabled={checkout.isPending}>
                  {checkout.isPending ? "Booking..." : "Continue to checkout"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
