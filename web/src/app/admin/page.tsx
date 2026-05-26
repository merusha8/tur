"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { PageTransition } from "@/components/shared/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice, formatDate } from "@/lib/utils";
import { Users, CalendarCheck, Hotel, DollarSign, Palmtree, Flame } from "lucide-react";
import { AdminTableEmpty } from "@/components/admin/admin-table-empty";

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => (await adminApi.analytics()).data,
  });

  const stats = data?.overview;

  const statCards = [
    { label: "Total Users", value: stats?.users, icon: Users, color: "bg-blue-500" },
    { label: "Bookings", value: stats?.bookings, icon: CalendarCheck, color: "bg-[#8DD3BB]" },
    { label: "Tours", value: stats?.tours, icon: Palmtree, color: "bg-teal-500" },
    { label: "Hot Tours", value: stats?.hotToursActive, icon: Flame, color: "bg-red-500" },
    { label: "Hotels", value: stats?.hotels, icon: Hotel, color: "bg-orange-500" },
    { label: "Revenue", value: stats ? formatPrice(stats.revenue) : "—", icon: DollarSign, color: "bg-green-500" },
  ];

  const maxRevenue = Math.max(...(data?.revenueByMonth || []).map((m: { revenue: number }) => m.revenue), 1);

  return (
    <PageTransition>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-gray-500">Analytics overview for Meru Tour</p>

      {isLoading ? <p className="mt-8">Loading analytics...</p> : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {statCards.map((s) => (
              <Card key={s.label}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`rounded-xl ${s.color} p-3 text-white`}><s.icon className="h-5 w-5" /></div>
                  <div><p className="text-sm text-gray-500">{s.label}</p><p className="text-2xl font-bold">{s.value ?? 0}</p></div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Revenue (last 6 months)</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(data?.revenueByMonth || []).map((m: { month: string; revenue: number; bookings: number }) => (
                    <div key={m.month}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{m.month}</span>
                        <span className="font-medium">{formatPrice(m.revenue)} · {m.bookings} payments</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100">
                        <div className="h-2 rounded-full bg-[#8DD3BB]" style={{ width: `${(m.revenue / maxRevenue) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                  {!data?.revenueByMonth?.length && <p className="text-sm text-gray-500">No payment data yet</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Bookings breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-500">By type</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(data?.bookingsByType || {}).map(([type, count]) => (
                      <span key={type} className="rounded-full bg-gray-100 px-3 py-1 text-sm">{type}: {count as number}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-500">By status</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(data?.bookingsByStatus || {}).map(([status, count]) => (
                      <span key={status} className="rounded-full bg-green-50 px-3 py-1 text-sm text-green-800">{status}: {count as number}</span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8">
            <CardHeader><CardTitle>Recent Bookings</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-gray-500"><th className="pb-3 pr-4">Reference</th><th className="pb-3 pr-4">User</th><th className="pb-3 pr-4">Type</th><th className="pb-3 pr-4">Status</th><th className="pb-3 pr-4">Amount</th><th className="pb-3">Date</th></tr></thead>
                  <tbody>
                    {(data?.recentBookings || []).length === 0 ? (
                      <AdminTableEmpty colSpan={6} message="No bookings yet." />
                    ) : (data?.recentBookings || []).map((b: { id: string; reference: string; type: string; status: string; totalPrice: number; createdAt: string; user: { firstName: string; lastName: string } }) => (
                      <tr key={b.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">{b.reference}</td>
                        <td className="py-3 pr-4">{b.user.firstName} {b.user.lastName}</td>
                        <td className="py-3 pr-4">{b.type}</td>
                        <td className="py-3 pr-4">{b.status}</td>
                        <td className="py-3 pr-4">{formatPrice(b.totalPrice)}</td>
                        <td className="py-3">{formatDate(b.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </PageTransition>
  );
}
