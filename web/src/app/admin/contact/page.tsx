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
import { MessageSquare, Trash2 } from "lucide-react";

type Inquiry = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
};

export default function AdminContactPage() {
  const qc = useQueryClient();
  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ["admin-contact"],
    queryFn: async () => (await adminApi.contactInquiries()).data as Inquiry[],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteContactInquiry(id),
    onSuccess: () => {
      toast.success("Inquiry deleted");
      qc.invalidateQueries({ queryKey: ["admin-contact"] });
    },
  });

  return (
    <PageTransition>
      <h1 className="text-2xl font-bold">Contact inquiries</h1>
      <p className="mt-1 text-gray-500">{inquiries.length} messages</p>
      {isLoading ? (
        <AdminListSkeleton count={3} />
      ) : inquiries.length === 0 ? (
        <EmptyState icon={MessageSquare} className="mt-6" title="No inquiries yet" description="Messages from the contact form will appear here." />
      ) : (
        <div className="mt-6 space-y-4">
          {inquiries.map((i) => (
            <Card key={i.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold">{i.subject}</p>
                    <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{i.message}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      {i.firstName} {i.lastName} · {i.email} · {formatDate(i.createdAt)}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-red-500 shrink-0" onClick={() => deleteMutation.mutate(i.id)}>
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
