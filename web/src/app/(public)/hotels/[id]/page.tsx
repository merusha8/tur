"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { hotelsApi, favoritesApi } from "@/lib/api";
import { PageTransition } from "@/components/shared/page-transition";
import { DetailPageSkeleton, NotFoundState, PageErrorState } from "@/components/shared/query-states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useBookingStore } from "@/stores/booking-store";
import { useStartCheckout } from "@/hooks/use-start-checkout";
import { Star, MapPin, Heart, Wifi, Waves, Dumbbell, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { Hotel } from "@/types";
import { HotelLocationSection } from "@/components/hotels/hotel-location-section";
import { HotelGallery } from "@/components/hotels/hotel-gallery";
import { ReviewsSection } from "@/components/reviews/reviews-section";

const amenityIcons: Record<string, typeof Wifi> = { "Wi-Fi": Wifi, Pool: Waves, Gym: Dumbbell };

export default function HotelDetailPage() {
  const { id: rawId } = useParams<{ id: string }>();
  const id = decodeURIComponent(rawId);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setSelectedHotel } = useBookingStore();

  const checkIn = searchParams.get("checkIn") || new Date().toISOString().slice(0, 10);
  const checkOut = searchParams.get("checkOut") || new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const guests = +(searchParams.get("guests") || 2);
  const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));

  const { data: hotel, isLoading, isError, refetch } = useQuery({
    queryKey: ["hotel", id],
    queryFn: async () => (await hotelsApi.getOne(id)).data as Hotel,
    retry: 1,
  });

  const totalPrice = hotel?.totalPrice ?? (hotel ? hotel.pricePerNight * nights : 0);

  const checkout = useStartCheckout();

  const handleBook = () => {
    if (!hotel) return;
    setSelectedHotel(hotel.id, totalPrice);
    checkout.mutate({
      type: "HOTEL",
      hotelId: hotel.id,
      totalPrice,
      guests,
      checkIn,
      checkOut,
    });
  };

  const favoriteMutation = useMutation({
    mutationFn: () => favoritesApi.toggle({ hotelId: id }),
    onSuccess: (res) => toast.success(res.data.favorited ? "Added to favorites" : "Removed from favorites"),
    onError: () => { toast.error("Login required or offer expired"); router.push("/auth/login"); },
  });

  if (isLoading) return <DetailPageSkeleton />;
  if (isError) {
    return (
      <PageErrorState
        message="Could not load this hotel. The offer may have expired."
        onRetry={() => refetch()}
        backHref="/hotels"
        backLabel="Browse hotels"
      />
    );
  }
  if (!hotel) return <NotFoundState title="Hotel not found" backHref="/hotels" backLabel="Browse hotels" />;

  const locationLabel = [hotel.city?.name, hotel.city?.country?.name].filter(Boolean).join(", ");
  const isExternal = hotel.source && hotel.source !== "database";
  const offerExpiresMs = hotel.offerExpiresAt ? new Date(hotel.offerExpiresAt).getTime() - Date.now() : null;
  const offerExpiringSoon = offerExpiresMs != null && offerExpiresMs > 0 && offerExpiresMs < 6 * 60 * 60 * 1000;

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {isExternal && hotel.offerExpiresAt && (
          <div className={`mb-6 rounded-2xl p-4 text-sm ${offerExpiringSoon ? "bg-amber-50 text-amber-900" : "bg-blue-50 text-blue-900"}`}>
            {offerExpiringSoon ? (
              <>Price locked for a limited time — complete booking soon. Offer refreshes when you view this page.</>
            ) : (
              <>Live price from {hotel.source}. Viewing this page keeps the offer available for 24 hours.</>
            )}
          </div>
        )}
        <HotelGallery images={hotel.images} alt={hotel.name} />

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold">{hotel.name}</h1>
                <p className="flex items-center gap-1 text-gray-500"><MapPin className="h-4 w-4" /> {locationLabel}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold">{hotel.rating}</span>
                  <span className="text-gray-400">({hotel.reviewsCount} reviews · {hotel.stars} stars)</span>
                  {hotel.source && hotel.source !== "database" && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium capitalize text-blue-700">{hotel.source}</span>
                  )}
                </div>
              </div>
              <Button variant="outline" size="icon" onClick={() => favoriteMutation.mutate()} disabled={favoriteMutation.isPending}>
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            <Card><CardHeader><CardTitle>Meal plan & rooms</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-600"><span className="font-medium">Meal type:</span> {hotel.mealType}</p>
                <div className="flex flex-wrap gap-2">
                  {hotel.roomTypes.map((r) => (
                    <span key={r} className="rounded-full bg-[#8DD3BB]/20 px-3 py-1 text-sm">{r}</span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card><CardHeader><CardTitle>Amenities</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {hotel.amenities.map((a) => {
                  const Icon = amenityIcons[a] || Star;
                  return (<div key={a} className="flex items-center gap-2 text-sm"><Icon className="h-4 w-4 text-[#8DD3BB]" /> {a}</div>);
                })}
              </CardContent>
            </Card>

            {!id.startsWith("booking:") && !id.startsWith("expedia:") && (
              <ReviewsSection hotelId={id} showForm />
            )}

            <HotelLocationSection hotelId={id} hotelName={hotel.name} />
          </div>

          <Card className="sticky top-24 h-fit">
            <CardContent className="p-6">
              <p className="text-3xl font-bold">{formatPrice(hotel.pricePerNight)}</p>
              <p className="text-sm text-gray-500">per night · {nights} nights · {guests} guests</p>
              <p className="mt-4 text-xl font-bold">Total: {formatPrice(totalPrice)}</p>
              {hotel.deepLinkUrl && (
                <a href={hotel.deepLinkUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:underline">
                  View on provider <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <Button className="mt-6 w-full" size="lg" onClick={handleBook} disabled={checkout.isPending}>
                {checkout.isPending ? "Booking..." : "Continue to checkout"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
