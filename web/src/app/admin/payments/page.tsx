"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { PageTransition } from "@/components/shared/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, formatDate } from "@/lib/utils";
import { AdminTableEmpty, AdminTableLoading } from "@/components/admin/admin-table-empty";

export default function AdminPaymentsPage() {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => (await adminApi.payments()).data,
  });

  return (
    <PageTransition>
      <h1 className="text-3xl font-bold">Payments</h1>
      <Card className="mt-6">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-gray-50 text-left text-gray-500"><th className="p-4">User</th><th className="p-4">Booking</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4">Date</th></tr></thead>
            <tbody>
              {isLoading ? (
                <AdminTableLoading colSpan={5} />
              ) : payments.length === 0 ? (
                <AdminTableEmpty colSpan={5} message="No payments recorded yet." />
              ) : payments.map((p: { id: string; amount: number; status: string; createdAt: string; user: { email: string }; booking: { reference: string } }) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="p-4">{p.user.email}</td>
                    <td className="p-4 font-medium">{p.booking.reference}</td>
                    <td className="p-4">{formatPrice(p.amount)}</td>
                    <td className="p-4"><span className={`rounded-full px-2 py-0.5 text-xs ${p.status === "SUCCEEDED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{p.status}</span></td>
                    <td className="p-4">{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
