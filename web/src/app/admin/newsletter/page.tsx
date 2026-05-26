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
import { Mail, Trash2 } from "lucide-react";

type Subscription = { id: string; email: string; active: boolean; createdAt: string };

export default function AdminNewsletterPage() {
  const qc = useQueryClient();
  const { data: subs = [], isLoading } = useQuery({
    queryKey: ["admin-newsletter"],
    queryFn: async () => (await adminApi.newsletter()).data as Subscription[],
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => adminApi.updateNewsletter(id, { active }),
    onSuccess: () => {
      toast.success("Subscription updated");
      qc.invalidateQueries({ queryKey: ["admin-newsletter"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteNewsletter(id),
    onSuccess: () => {
      toast.success("Subscription removed");
      qc.invalidateQueries({ queryKey: ["admin-newsletter"] });
    },
  });

  return (
    <PageTransition>
      <h1 className="text-2xl font-bold">Newsletter subscribers</h1>
      <p className="mt-1 text-gray-500">{subs.length} emails</p>
      {isLoading ? (
        <AdminListSkeleton count={4} />
      ) : subs.length === 0 ? (
        <EmptyState icon={Mail} className="mt-6" title="No subscribers yet" description="Newsletter sign-ups from the homepage footer will appear here." />
      ) : (
        <div className="mt-6 space-y-3">
          {subs.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{s.email}</p>
                  <p className="text-xs text-gray-400">Subscribed {formatDate(s.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant={s.active ? "default" : "outline"} onClick={() => toggleMutation.mutate({ id: s.id, active: !s.active })}>
                    {s.active ? "Active" : "Inactive"}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteMutation.mutate(s.id)}>
                    <Trash2 className="h-4 w-4" />
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
