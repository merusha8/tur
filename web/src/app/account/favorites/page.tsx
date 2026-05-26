"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { favoritesApi } from "@/lib/api";
import { PageTransition } from "@/components/shared/page-transition";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { FALLBACK_TRAVEL_IMAGE } from "@/lib/image-utils";
import { Heart, Palmtree } from "lucide-react";
import { toast } from "sonner";

type Favorite = {
  id: string;
  flight?: { id: string; airline: string; price: number; image?: string };
  hotel?: { id: string; name: string; pricePerNight: number; images: string[]; city?: { name: string } };
  tour?: { id: string; title: string; price: number; images: string[]; city?: { name: string }; country?: { name: string } };
};

export default function FavoritesPage() {
  const queryClient = useQueryClient();
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => (await favoritesApi.getAll()).data as Favorite[],
  });

  const removeMutation = useMutation({
    mutationFn: (fav: Favorite) => {
      if (fav.flight) return favoritesApi.toggle({ flightId: fav.flight.id });
      if (fav.hotel) return favoritesApi.toggle({ hotelId: fav.hotel.id });
      if (fav.tour) return favoritesApi.toggle({ tourId: fav.tour.id });
      return Promise.reject(new Error("Unknown favorite"));
    },
    onSuccess: () => {
      toast.success("Removed from favorites");
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: () => toast.error("Could not remove favorite"),
  });

  return (
    <PageTransition>
      <h2 className="text-2xl font-bold">Favourites</h2>
      {isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          className="mt-6"
          title="No favorites yet"
          description="Save flights, hotels, and tours while browsing to find them here."
          actionLabel="Explore tours"
          actionHref="/tours"
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {favorites.map((fav) => (
            <Card key={fav.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {fav.flight && (
                      <Link href={`/flights/${fav.flight.id}`} className="flex gap-4">
                        {fav.flight.image && <Image src={fav.flight.image} alt="" width={80} height={60} className="rounded-lg object-cover" unoptimized />}
                        <div><p className="font-bold">{fav.flight.airline}</p><p className="text-sm text-gray-500">{formatPrice(fav.flight.price)}</p></div>
                      </Link>
                    )}
                    {fav.hotel && (
                      <Link href={`/hotels/${fav.hotel.id}`} className="flex gap-4">
                        <Image src={fav.hotel.images[0] || FALLBACK_TRAVEL_IMAGE} alt="" width={80} height={60} className="rounded-lg object-cover" unoptimized />
                        <div><p className="font-bold">{fav.hotel.name}</p><p className="text-sm text-gray-500">{fav.hotel.city?.name} · {formatPrice(fav.hotel.pricePerNight)}/night</p></div>
                      </Link>
                    )}
                    {fav.tour && (
                      <Link href={`/tours/${fav.tour.id}`} className="flex gap-4">
                        <Image src={fav.tour.images[0] || FALLBACK_TRAVEL_IMAGE} alt="" width={80} height={60} className="rounded-lg object-cover" unoptimized />
                        <div className="flex items-start gap-2">
                          <Palmtree className="mt-1 h-4 w-4 text-[#8DD3BB]" />
                          <div>
                            <p className="font-bold">{fav.tour.title}</p>
                            <p className="text-sm text-gray-500">{fav.tour.city?.name}{fav.tour.country?.name ? `, ${fav.tour.country.name}` : ""} · {formatPrice(fav.tour.price)}</p>
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-red-400 hover:text-red-600"
                    onClick={() => removeMutation.mutate(fav)}
                    disabled={removeMutation.isPending}
                    aria-label="Remove from favorites"
                  >
                    <Heart className="h-5 w-5 fill-current" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
