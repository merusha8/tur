"use client";

import Link from "next/link";
import { RemoteImage } from "@/components/ui/remote-image";
import {
  Flame,
  MapPin,
  Moon,
  UtensilsCrossed,
  PlaneTakeoff,
  Zap,
  Users,
  Star,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { CountdownTimer } from "@/components/shared/countdown-timer";
import { formatPrice, cn } from "@/lib/utils";
import { FALLBACK_TRAVEL_IMAGE } from "@/lib/image-utils";
import { getAirlineMeta } from "@/lib/airlines";
import type { HotTourDeal, Tour } from "@/types";

export type TourCardHotDeal = Pick<
  HotTourDeal,
  | "originalPrice"
  | "discountedPrice"
  | "discountPercent"
  | "validUntil"
  | "departureCity"
  | "nights"
  | "mealPlan"
  | "lastMinute"
  | "seatsLeft"
>;

export interface TourCardProps {
  tour: Tour;
  variant?: "grid" | "list" | "compact";
  hotDeal?: TourCardHotDeal | null;
  departureCity?: string;
  totalPrice?: number;
  travelersLabel?: string;
  showCountdown?: boolean;
  className?: string;
  ctaLabel?: string;
}

function formatTourDate(value?: string) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function HotelStars({ count }: { count?: number }) {
  if (!count) return null;
  return (
    <div className="flex items-center gap-0.5" aria-label={`${count} stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < count ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200",
          )}
        />
      ))}
    </div>
  );
}

function AirlineBadge({ airline, size = "md" }: { airline: string; size?: "sm" | "md" }) {
  const meta = getAirlineMeta(airline);
  const box = size === "sm" ? "h-8 w-16" : "h-10 w-20";

  if (meta.logo) {
    return (
      <div className={cn("relative shrink-0 overflow-hidden rounded-lg border bg-white px-2 py-1", box)}>
        <RemoteImage src={meta.logo} alt={airline} fill className="object-contain p-1" sizes="80px" />
      </div>
    );
  }

  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-lg px-2 text-xs font-bold text-white", box)}
      style={{ backgroundColor: meta.color }}
    >
      {meta.code}
    </div>
  );
}

function useTourCardModel(tour: Tour, hotDeal?: TourCardHotDeal | null, departureCity?: string) {
  const image = tour.images[0] || tour.hotel?.images?.[0] || FALLBACK_TRAVEL_IMAGE;
  const isHot = tour.hotTour || !!hotDeal;
  const oldPrice = hotDeal?.originalPrice ?? (tour.oldPrice && tour.oldPrice > tour.price ? tour.oldPrice : undefined);
  const price = hotDeal?.discountedPrice ?? tour.price;
  const discountPercent =
    hotDeal?.discountPercent ??
    (oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : undefined);
  const nights = hotDeal?.nights ?? tour.duration;
  const mealPlan =
    hotDeal?.mealPlan ?? tour.hotel?.mealType ?? (tour.allInclusive ? "All Inclusive" : "Breakfast Only");
  const departFrom = hotDeal?.departureCity ?? departureCity ?? "Almaty";
  const departDate = formatTourDate(tour.departureDate);
  const hotelName = tour.hotel?.name;
  const hotelStars = tour.hotel?.stars;
  const urgent = hotDeal?.lastMinute || (hotDeal?.seatsLeft != null && hotDeal.seatsLeft <= 4);

  return {
    image,
    isHot,
    oldPrice,
    price,
    discountPercent,
    nights,
    mealPlan,
    departFrom,
    departDate,
    hotelName,
    hotelStars,
    urgent,
  };
}

export function TourCard({
  tour,
  variant = "grid",
  hotDeal,
  departureCity,
  totalPrice,
  travelersLabel,
  showCountdown = !!hotDeal,
  className,
  ctaLabel,
}: TourCardProps) {
  const href = `/tours/${tour.id}`;
  const m = useTourCardModel(tour, hotDeal, departureCity);
  const buttonLabel = ctaLabel ?? (m.isHot ? "Grab deal" : "Select tour");

  if (variant === "compact") {
    return (
      <Link href={href} className={cn("group block", className)}>
        <Card className={cn("overflow-hidden rounded-2xl border-2 transition-shadow hover:shadow-lg", m.isHot ? "border-red-200" : "border-gray-100")}>
          <CardContent className="flex gap-4 p-4">
            <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl">
              <RemoteImage src={m.image} alt={tour.title} fill className="object-cover" sizes="112px" />
              {m.isHot && m.discountPercent != null && (
                <span className="absolute left-1 top-1 rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  -{m.discountPercent}%
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {m.hotelName && <p className="truncate text-xs font-semibold text-gray-500">{m.hotelName}</p>}
                  <h3 className="truncate font-bold text-[#112211]">{tour.city?.name ?? tour.title}</h3>
                </div>
                <AirlineBadge airline={tour.airline} size="sm" />
              </div>
              <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-500">
                <span>{m.nights} nights</span>
                <span>·</span>
                <span>{m.mealPlan}</span>
                {m.departDate && (
                  <>
                    <span>·</span>
                    <span>{m.departFrom} {m.departDate}</span>
                  </>
                )}
              </div>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  {m.oldPrice && <span className="text-xs text-gray-400 line-through">{formatPrice(m.oldPrice)}</span>}
                  <p className={cn("text-lg font-bold", m.isHot ? "text-red-600" : "text-[#112211]")}>{formatPrice(m.price)}</p>
                </div>
                {hotDeal?.validUntil && showCountdown && <CountdownTimer targetDate={hotDeal.validUntil} compact />}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (variant === "list") {
    return (
      <Card className={cn("overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-md", m.urgent && "ring-2 ring-red-300/50", className)}>
        <CardContent className="flex flex-col p-0 lg:flex-row">
          <div className="relative h-56 w-full shrink-0 lg:h-auto lg:w-80">
            <RemoteImage src={m.image} alt={tour.title} fill className="object-cover" sizes="320px" priority={false} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent lg:hidden" />
            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
              {m.isHot && (
                <span className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
                  <Flame className="h-3.5 w-3.5" /> Hot
                </span>
              )}
              {m.discountPercent != null && m.discountPercent > 0 && (
                <span className="rounded-lg bg-orange-500 px-2.5 py-1 text-xs font-bold text-white shadow">
                  -{m.discountPercent}%
                </span>
              )}
              {hotDeal?.lastMinute && (
                <span className="flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-bold text-white shadow">
                  <Zap className="h-3.5 w-3.5" /> Last minute
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-between p-5 lg:p-6">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {m.hotelName && (
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <HotelStars count={m.hotelStars} />
                      <span className="text-sm font-semibold text-gray-700">{m.hotelName}</span>
                    </div>
                  )}
                  <Link href={href} className="text-xl font-bold leading-snug text-[#112211] hover:text-[#8DD3BB] lg:text-2xl">
                    {tour.title}
                  </Link>
                  <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {tour.city?.name}{tour.country?.name ? `, ${tour.country.name}` : ""}
                  </p>
                </div>
                <AirlineBadge airline={tour.airline} />
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  <PlaneTakeoff className="h-4 w-4 shrink-0 text-[#8DD3BB]" />
                  <span>
                    <span className="font-medium">{m.departFrom}</span>
                    {m.departDate ? ` · ${m.departDate}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  <Moon className="h-4 w-4 shrink-0 text-[#8DD3BB]" />
                  <span><span className="font-medium">{m.nights}</span> nights</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  <UtensilsCrossed className="h-4 w-4 shrink-0 text-[#8DD3BB]" />
                  <span>{m.mealPlan}</span>
                </div>
                {hotDeal?.seatsLeft != null && hotDeal.seatsLeft <= 12 && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    <Users className="h-4 w-4 shrink-0" />
                    Only {hotDeal.seatsLeft} seats left
                  </div>
                )}
              </div>

              {showCountdown && hotDeal?.validUntil && (
                <div className="mt-4 rounded-xl bg-red-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600">Offer ends in</p>
                  <CountdownTimer targetDate={hotDeal.validUntil} className="mt-1" />
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                {m.oldPrice && (
                  <p className="text-sm text-gray-400 line-through">{formatPrice(m.oldPrice)}</p>
                )}
                <p className={cn("text-3xl font-bold", m.isHot ? "text-red-600" : "text-[#112211]")}>
                  {formatPrice(m.price)}
                  <span className="ml-1 text-sm font-normal text-gray-500">/ person</span>
                </p>
                {totalPrice && travelersLabel && (
                  <p className="text-sm text-gray-500">Total {formatPrice(totalPrice)} · {travelersLabel}</p>
                )}
              </div>
              <span className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto pointer-events-none", m.isHot && "bg-red-600 hover:bg-red-700")}>
                {buttonLabel}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // grid — HT.kz style large card
  return (
    <Link href={href} className={cn("group block h-full", className)}>
      <Card className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl",
        m.urgent ? "ring-2 ring-red-400/40" : "border-gray-100",
      )}>
        <div className="relative h-56 overflow-hidden sm:h-60">
          <RemoteImage
            src={m.image}
            alt={tour.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {m.isHot && (
              <span className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
                <Flame className="h-4 w-4" /> Hot
              </span>
            )}
            {m.discountPercent != null && m.discountPercent > 0 && (
              <span className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                -{m.discountPercent}%
              </span>
            )}
            {hotDeal?.lastMinute && (
              <span className="flex items-center gap-1 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-[#112211] shadow-lg">
                <Zap className="h-3.5 w-3.5" /> Last minute
              </span>
            )}
          </div>

          {hotDeal?.seatsLeft != null && hotDeal.seatsLeft <= 8 && (
            <div className="absolute bottom-3 left-3 rounded-lg bg-black/65 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              {hotDeal.seatsLeft} seats left
            </div>
          )}
        </div>

        <CardContent className="flex flex-1 flex-col p-5">
          {m.hotelName && (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <HotelStars count={m.hotelStars} />
              <span className="text-sm font-semibold text-gray-700 line-clamp-1">{m.hotelName}</span>
            </div>
          )}

          <h3 className="text-lg font-bold leading-snug text-[#112211] line-clamp-2 sm:text-xl">{tour.title}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {tour.city?.name}{tour.country?.name ? `, ${tour.country.name}` : ""}
          </p>

          <div className="mt-4 space-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <PlaneTakeoff className="h-4 w-4 shrink-0 text-[#8DD3BB]" />
              <span>
                Departure: <span className="font-medium">{m.departFrom}</span>
                {m.departDate ? ` · ${m.departDate}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 shrink-0 text-[#8DD3BB]" />
              <span><span className="font-medium">{m.nights}</span> nights</span>
            </div>
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4 shrink-0 text-[#8DD3BB]" />
              <span>{m.mealPlan}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              {showCountdown && hotDeal?.validUntil ? (
                <div className="rounded-xl bg-red-50 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">Ends in</p>
                  <CountdownTimer targetDate={hotDeal.validUntil} compact />
                </div>
              ) : (
                <p className="text-xs text-gray-400">Flight by {tour.airline}</p>
              )}
            </div>
            <AirlineBadge airline={tour.airline} />
          </div>

          <div className="mt-auto border-t pt-4">
            {m.oldPrice && (
              <p className="text-sm text-gray-400 line-through">{formatPrice(m.oldPrice)}</p>
            )}
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className={cn("text-2xl font-bold sm:text-3xl", m.isHot ? "text-red-600" : "text-[#112211]")}>
                  {formatPrice(m.price)}
                </p>
                <p className="text-xs text-gray-500">per person</p>
              </div>
              <span className={cn(buttonVariants({ size: "sm" }), "shrink-0 pointer-events-none", m.isHot && "bg-red-600 hover:bg-red-700")}>
                {buttonLabel}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function TourCardSkeleton({ variant = "grid" }: { variant?: "grid" | "list" | "compact" }) {
  if (variant === "list") {
    return <div className="h-56 animate-pulse rounded-2xl bg-gray-200 lg:h-64" />;
  }
  if (variant === "compact") {
    return <div className="h-28 animate-pulse rounded-2xl bg-gray-200" />;
  }
  return <div className="h-[480px] animate-pulse rounded-2xl bg-gray-200" />;
}

export function tourCardFromHotDeal(deal: HotTourDeal) {
  return {
    tour: deal.tour,
    hotDeal: deal,
    departureCity: deal.departureCity,
  };
}
