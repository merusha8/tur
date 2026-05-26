"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { PageTransition } from "@/components/shared/page-transition";
import { AdminTableEmpty, AdminTableLoading } from "@/components/admin/admin-table-empty";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatPrice, formatDate } from "@/lib/utils";
import { toast } from "sonner";

type Booking = {
  id: string;
  reference: string;
  type: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  user: { email: string; firstName: string; lastName: string };
  tour?: { title: string } | null;
  hotel?: { name: string; city?: { name: string } } | null;
  flight?: { airline: string; flightNumber: string } | null;
};

const STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] as const;

export default function AdminBookingsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => (await adminApi.bookings()).data as Booking[],
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateBooking(id, { status }),
    onSuccess: () => {
      toast.success("Booking status updated");
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
    },
    onError: () => toast.error("Failed to update status"),
  });

  const types = useMemo(() => [...new Set(bookings.map((b) => b.type))], [bookings]);

  const filtered = useMemo(() => bookings.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch = !q || b.reference.toLowerCase().includes(q) || b.user.email.toLowerCase().includes(q);
    const matchType = typeFilter === "ALL" || b.type === typeFilter;
    const matchStatus = statusFilter === "ALL" || b.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  }), [bookings, search, typeFilter, statusFilter]);

  const totalRevenue = filtered.reduce((s, b) => s + b.totalPrice, 0);

  return (
    <PageTransition>
      <h1 className="text-3xl font-bold">Bookings</h1>
      <p className="text-gray-500">{filtered.length} bookings · {formatPrice(totalRevenue)} total</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Input placeholder="Search reference or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <select className="rounded-lg border px-3 py-2 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="ALL">All types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="rounded-lg border px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-gray-50 text-left text-gray-500"><th className="p-4">Reference</th><th className="p-4">User</th><th className="p-4">Type</th><th className="p-4">Item</th><th className="p-4">Status</th><th className="p-4">Amount</th><th className="p-4">Date</th></tr></thead>
            <tbody>
              {isLoading ? (
                <AdminTableLoading colSpan={7} />
              ) : filtered.length === 0 ? (
                <AdminTableEmpty colSpan={7} message="No bookings match your filters." />
              ) : filtered.map((b) => (
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="p-4 font-medium">{b.reference}</td>
                    <td className="p-4"><div>{b.user.firstName} {b.user.lastName}</div><div className="text-xs text-gray-500">{b.user.email}</div></td>
                    <td className="p-4">{b.type}</td>
                    <td className="p-4 text-gray-600">
                      {b.tour?.title || b.hotel?.name || (b.flight ? `${b.flight.airline} ${b.flight.flightNumber}` : "—")}
                    </td>
                    <td className="p-4">
                      <select
                        className="rounded-lg border px-2 py-1 text-xs"
                        value={b.status}
                        onChange={(e) => statusMutation.mutate({ id: b.id, status: e.target.value })}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="p-4">{formatPrice(b.totalPrice)}</td>
                    <td className="p-4">{formatDate(b.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
