"use client";

import Link from "next/link";
import { RemoteImage } from "@/components/ui/remote-image";
import { Star, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, cn } from "@/lib/utils";
import { FALLBACK_TRAVEL_IMAGE } from "@/lib/image-utils";
import type { Hotel } from "@/types";

interface HotelCardProps {
  hotel: Hotel;
  className?: string;
}

export function HotelCard({ hotel, className }: HotelCardProps) {
  const image = hotel.images[0] || FALLBACK_TRAVEL_IMAGE;

  return (
    <Link href={`/hotels/${hotel.id}`} className={cn("group block", className)}>
      <Card className="overflow-hidden rounded-[24px] transition-all hover:-translate-y-1 hover:shadow-lg">
        <div className="relative h-44 overflow-hidden">
          <RemoteImage src={image} alt={hotel.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-[#112211]">
            {"★".repeat(hotel.stars)}
          </div>
        </div>
        <CardContent className="p-5">
          <h3 className="font-bold leading-snug text-[#112211]">{hotel.name}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="h-3.5 w-3.5" />
            {hotel.city?.name}{hotel.city?.country?.name ? `, ${hotel.city.country.name}` : ""}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{hotel.rating.toFixed(1)}</span>
              <span className="text-gray-400">({hotel.reviewsCount})</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-[#112211]">{formatPrice(hotel.pricePerNight)}</p>
              <p className="text-xs text-gray-500">/ night</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function HotelCardSkeleton() {
  return <div className="h-72 animate-pulse rounded-[24px] bg-gray-200" />;
}
