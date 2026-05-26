"use client";

import { TourCard, TourCardSkeleton, tourCardFromHotDeal } from "@/components/tours/tour-card";
import type { HotTourDeal } from "@/types";
import { cn } from "@/lib/utils";

interface HotTourCardProps {
  deal: HotTourDeal;
  variant?: "default" | "compact" | "hero";
  className?: string;
}

export function HotTourCard({ deal, variant = "default", className }: HotTourCardProps) {
  const props = tourCardFromHotDeal(deal);
  const cardVariant = variant === "compact" ? "compact" : "grid";

  return (
    <TourCard
      {...props}
      variant={cardVariant}
      showCountdown
      className={cn(variant === "hero" && "lg:col-span-1", className)}
    />
  );
}

export { TourCardSkeleton as HotTourCardSkeleton };
