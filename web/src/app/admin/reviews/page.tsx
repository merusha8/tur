"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { PageTransition } from "@/components/shared/page-transition";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { AdminListSkeleton } from "@/components/admin/admin-table-empty";
import { Star, Trash2 } from "lucide-react";

type Review = {
  id: string;
  rating: number;
  title?: string;
  comment: string;
  verified: boolean;
  featured: boolean;
  createdAt: string;
  user: { email: string; firstName: string; lastName: string };
  hotel?: { name: string };
  tour?: { title: string };
  flight?: { airline: string };
};

export default function AdminReviewsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => (await adminApi.reviews()).data as { data: Review[] },
  });
  const reviews = data?.data ?? [];

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { verified?: boolean; featured?: boolean } }) =>
      adminApi.updateReview(id, patch),
    onSuccess: () => {
      toast.success("Review updated");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteReview(id),
    onSuccess: () => {
      toast.success("Review deleted");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
  });

  const targetLabel = (r: Review) => r.hotel?.name || r.tour?.title || r.flight?.airline || "General";

  return (
    <PageTransition>
      <h1 className="text-2xl font-bold">Reviews moderation</h1>
      <p className="mt-1 text-gray-500">{reviews.length} reviews</p>
      {isLoading ? (
        <AdminListSkeleton count={4} />
      ) : reviews.length === 0 ? (
        <EmptyState icon={Star} className="mt-6" title="No reviews yet" description="User reviews on hotels and tours will appear here for moderation." />
      ) : (
        <div className="mt-6 space-y-4">
          {reviews.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{r.title || "Review"} · {r.rating}/5</p>
                    <p className="mt-1 text-sm text-gray-600">{r.comment}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      {r.user.firstName} {r.user.lastName} ({r.user.email}) · {targetLabel(r)} · {formatDate(r.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={r.verified ? "default" : "outline"}
                      onClick={() => updateMutation.mutate({ id: r.id, patch: { verified: !r.verified } })}
                    >
                      {r.verified ? "Verified" : "Verify"}
                    </Button>
                    <Button
                      size="sm"
                      variant={r.featured ? "default" : "outline"}
                      onClick={() => updateMutation.mutate({ id: r.id, patch: { featured: !r.featured } })}
                    >
                      {r.featured ? "Featured" : "Feature"}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteMutation.mutate(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
