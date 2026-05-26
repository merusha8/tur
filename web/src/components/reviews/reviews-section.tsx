"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { reviewsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Star, BadgeCheck, ThumbsUp, ThumbsDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { Review, ReviewsResponse } from "@/types";
import { shouldUnoptimizeImage } from "@/lib/image-utils";
import { ReviewForm } from "./review-form";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "rating_high", label: "Highest rating" },
  { value: "rating_low", label: "Lowest rating" },
  { value: "verified", label: "Verified travelers" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

function RatingBars({ distribution, total }: { distribution: Record<number, number>; total: number }) {
  return (
    <div className="space-y-1.5">
      {[5, 4, 3, 2, 1].map((stars) => {
        const count = distribution[stars] ?? 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={stars} className="flex items-center gap-2 text-sm">
            <span className="w-3 text-gray-500">{stars}</span>
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-[#8DD3BB]" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-8 text-right text-xs text-gray-400">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function ReviewImages({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState<number | null>(null);
  if (images.length === 0) return null;

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2">
        {images.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={() => setActive(i)}
            className="relative h-16 w-20 overflow-hidden rounded-lg border border-gray-100"
          >
            <Image src={src} alt={`${alt} photo ${i + 1}`} fill sizes="80px" loading="lazy" className="object-cover" unoptimized={shouldUnoptimizeImage(src)} />
          </button>
        ))}
      </div>
      {active !== null && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          onClick={() => setActive(null)}
        >
          <button type="button" className="absolute right-4 top-4 text-white" onClick={() => setActive(null)} aria-label="Close">
            ✕
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white"
                onClick={(e) => { e.stopPropagation(); setActive((active - 1 + images.length) % images.length); }}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white"
                onClick={(e) => { e.stopPropagation(); setActive((active + 1) % images.length); }}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <div className="relative h-[70vh] w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <Image src={images[active]} alt={alt} fill sizes="100vw" className="object-contain" priority unoptimized={shouldUnoptimizeImage(images[active])} />
          </div>
        </div>
      )}
    </>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const displayImages = review.images?.length ? review.images : review.imageUrl ? [review.imageUrl] : [];
  const initials = `${review.user?.firstName?.[0] ?? "?"}${review.user?.lastName?.[0] ?? ""}`;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8DD3BB]/20 text-sm font-bold text-[#112211]">
              {review.user?.avatar ? (
                <Image src={review.user.avatar} alt="" width={40} height={40} className="rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div>
              <p className="font-semibold">
                {review.user?.firstName} {review.user?.lastName}
                {review.verified && (
                  <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    <BadgeCheck className="h-3 w-3" /> Verified traveler
                  </span>
                )}
              </p>
              {review.location && <p className="text-xs text-gray-400">{review.location}</p>}
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={cn("h-4 w-4", i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200")} />
            ))}
          </div>
        </div>

        {review.title && <h4 className="mt-3 font-semibold">{review.title}</h4>}
        <p className="mt-2 text-gray-600">{review.comment}</p>

        {(review.pros?.length ?? 0) > 0 && (
          <div className="mt-3">
            <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-green-700">
              <ThumbsUp className="h-3 w-3" /> Pros
            </p>
            <div className="flex flex-wrap gap-1.5">
              {review.pros!.map((p) => (
                <span key={p} className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs text-green-800">{p}</span>
              ))}
            </div>
          </div>
        )}

        {(review.cons?.length ?? 0) > 0 && (
          <div className="mt-3">
            <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-red-600">
              <ThumbsDown className="h-3 w-3" /> Cons
            </p>
            <div className="flex flex-wrap gap-1.5">
              {review.cons!.map((c) => (
                <span key={c} className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs text-red-700">{c}</span>
              ))}
            </div>
          </div>
        )}

        <ReviewImages images={displayImages} alt={review.title || "Review"} />

        {review.createdAt && (
          <p className="mt-3 text-xs text-gray-400">
            {new Date(review.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function ReviewsSection({
  hotelId,
  tourId,
  destinationId,
  showForm = false,
}: {
  hotelId?: string;
  tourId?: string;
  destinationId?: string;
  showForm?: boolean;
}) {
  const [sort, setSort] = useState<SortValue>("newest");
  const [page, setPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<number | undefined>();
  const queryClient = useQueryClient();

  const params = { hotelId, tourId, destinationId, sort, page, limit: 8, rating: ratingFilter };

  const { data, isLoading } = useQuery({
    queryKey: ["reviews", params],
    queryFn: async () => (await reviewsApi.getAll(params)).data as ReviewsResponse,
    enabled: !!(hotelId || tourId || destinationId),
  });

  const reviews = data?.data ?? [];
  const summary = data?.summary;
  const totalPages = data?.totalPages ?? 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guest reviews</CardTitle>
        {summary && summary.totalReviews > 0 && (
          <div className="mt-4 grid gap-6 md:grid-cols-[auto_1fr]">
            <div className="text-center md:text-left">
              <p className="text-4xl font-bold">{summary.averageRating.toFixed(1)}</p>
              <div className="mt-1 flex justify-center gap-0.5 md:justify-start">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn("h-4 w-4", i < Math.round(summary.averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200")} />
                ))}
              </div>
              <p className="mt-1 text-sm text-gray-500">{summary.totalReviews} reviews</p>
              {summary.verifiedCount > 0 && (
                <p className="mt-1 flex items-center justify-center gap-1 text-xs text-blue-600 md:justify-start">
                  <BadgeCheck className="h-3.5 w-3.5" /> {summary.verifiedCount} verified
                </p>
              )}
            </div>
            <RatingBars distribution={summary.distribution} total={summary.totalReviews} />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="h-10 rounded-xl border px-3 text-sm"
            value={sort}
            onChange={(e) => { setSort(e.target.value as SortValue); setPage(1); }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            className="h-10 rounded-xl border px-3 text-sm"
            value={ratingFilter ?? ""}
            onChange={(e) => { setRatingFilter(e.target.value ? +e.target.value : undefined); setPage(1); }}
          >
            <option value="">All ratings</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{r} stars</option>
            ))}
          </select>
        </div>

        {showForm && (hotelId || tourId) && (
          <ReviewForm
            hotelId={hotelId}
            tourId={tourId}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ["reviews"] })}
          />
        )}

        {isLoading && <p className="text-gray-500">Loading reviews...</p>}
        {!isLoading && reviews.length === 0 && (
          <p className="rounded-xl bg-gray-50 p-6 text-center text-gray-500">No reviews yet. Be the first to share your experience!</p>
        )}

        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
