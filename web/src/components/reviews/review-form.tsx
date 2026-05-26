"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { reviewsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";

export function ReviewForm({
  hotelId,
  tourId,
  onSuccess,
}: {
  hotelId?: string;
  tourId?: string;
  onSuccess?: () => void;
}) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [prosText, setProsText] = useState("");
  const [consText, setConsText] = useState("");
  const [location, setLocation] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      reviewsApi.create({
        hotelId,
        tourId,
        rating,
        title: title || undefined,
        comment,
        pros: prosText.split("\n").map((s) => s.trim()).filter(Boolean),
        cons: consText.split("\n").map((s) => s.trim()).filter(Boolean),
        location: location || undefined,
      }),
    onSuccess: () => {
      toast.success("Review submitted!");
      setTitle("");
      setComment("");
      setProsText("");
      setConsText("");
      setLocation("");
      setRating(5);
      onSuccess?.();
    },
    onError: () => {
      if (!isAuthenticated()) {
        toast.error("Please login to leave a review");
        router.push("/auth/login");
      } else {
        toast.error("Failed to submit review");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Please write a comment");
      return;
    }
    if (!isAuthenticated()) {
      toast.error("Please login to leave a review");
      router.push("/auth/login");
      return;
    }
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-dashed border-[#8DD3BB]/50 bg-[#8DD3BB]/5 p-4 space-y-3">
      <p className="font-semibold text-sm">Write a review</p>

      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <button key={i} type="button" onClick={() => setRating(i + 1)} aria-label={`Rate ${i + 1} stars`}>
            <Star className={cn("h-6 w-6 transition-colors", i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-300")} />
          </button>
        ))}
      </div>

      <Input placeholder="Review title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea
        className="min-h-[80px] w-full rounded-xl border px-3 py-2 text-sm"
        placeholder="Share your experience..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        required
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <textarea
          className="min-h-[60px] w-full rounded-xl border px-3 py-2 text-sm"
          placeholder="Pros (one per line)"
          value={prosText}
          onChange={(e) => setProsText(e.target.value)}
        />
        <textarea
          className="min-h-[60px] w-full rounded-xl border px-3 py-2 text-sm"
          placeholder="Cons (one per line)"
          value={consText}
          onChange={(e) => setConsText(e.target.value)}
        />
      </div>
      <Input placeholder="Your location (e.g. London, UK)" value={location} onChange={(e) => setLocation(e.target.value)} />

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Submitting..." : "Submit review"}
      </Button>
    </form>
  );
}
