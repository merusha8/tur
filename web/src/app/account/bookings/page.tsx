"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingsApi } from "@/lib/api";
import { PageTransition } from "@/components/shared/page-transition";
import { EmptyState } from "@/components/shared/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/lib/utils";
import { Plane, Hotel, Palmtree } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Booking {
  id: string;
  type: string;
  status: string;
  reference: string;
  totalPrice: number;
  createdAt: string;
  flight?: { id: string; airline: string; originCode: string; destinationCode: string; departureTime: string };
  hotel?: { id: string; name: string; city?: { name: string } };
  tour?: { id: string; title: string; departureDate: string; duration: number };
  checkIn?: string;
  checkOut?: string;
}

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => (await bookingsApi.getAll()).data as Booking[],
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.cancel(id),
    onSuccess: () => {
      toast.success("Booking cancelled");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: () => toast.error("Could not cancel booking"),
  });

  const flights = bookings.filter((b) => b.type === "FLIGHT");
  const stays = bookings.filter((b) => b.type === "HOTEL");
  const tours = bookings.filter((b) => b.type === "TOUR");

  const ticketHref = (b: Booking) => {
    if (b.status === "PENDING" || b.status === "AWAITING_PAYMENT") return `/checkout/${b.id}`;
    if (b.type === "FLIGHT" && b.flight) return `/flights/${b.flight.id}`;
    if (b.type === "HOTEL" && b.hotel) return `/hotels/${b.hotel.id}`;
    if (b.type === "TOUR" && b.tour) return `/tours/${b.tour.id}`;
    return `/checkout/${b.id}`;
  };

  const renderBooking = (b: Booking) => {
    const canCancel = b.status !== "CANCELLED" && b.status !== "CONFIRMED";
    const ticketLabel = b.status === "PENDING" || b.status === "AWAITING_PAYMENT" ? "Pay now" : "Show ticket";

    return (
      <Card key={b.id} className="mb-4">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            {b.type === "FLIGHT" && <Plane className="h-8 w-8 text-[#8DD3BB]" />}
            {b.type === "HOTEL" && <Hotel className="h-8 w-8 text-[#8DD3BB]" />}
            {b.type === "TOUR" && <Palmtree className="h-8 w-8 text-[#8DD3BB]" />}
            <div>
              {b.flight && (
                <>
                  <p className="font-bold">{b.flight.airline}</p>
                  <p className="text-sm text-gray-500">{b.flight.originCode} → {b.flight.destinationCode} · {formatDate(b.flight.departureTime)}</p>
                </>
              )}
              {b.hotel && (
                <>
                  <p className="font-bold">{b.hotel.name}</p>
                  <p className="text-sm text-gray-500">{b.hotel.city?.name} · {b.checkIn && formatDate(b.checkIn)} - {b.checkOut && formatDate(b.checkOut)}</p>
                </>
              )}
              {b.tour && (
                <>
                  <p className="font-bold">{b.tour.title}</p>
                  <p className="text-sm text-gray-500">Departure {formatDate(b.tour.departureDate)} · {b.tour.duration} nights</p>
                </>
              )}
              <p className="text-xs text-gray-400">Ref: {b.reference} · {b.status}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="font-bold">{formatPrice(b.totalPrice)}</p>
            <Link href={ticketHref(b)}>
              <Button variant="outline" size="sm">{ticketLabel}</Button>
            </Link>
            {canCancel && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500"
                onClick={() => cancelMutation.mutate(b.id)}
                disabled={cancelMutation.isPending}
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <PageTransition>
      <h2 className="text-2xl font-bold">Tickets/Bookings</h2>
      {isLoading ? (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="flights" className="mt-6">
          <TabsList>
            <TabsTrigger value="flights">Flights ({flights.length})</TabsTrigger>
            <TabsTrigger value="stays">Stays ({stays.length})</TabsTrigger>
            <TabsTrigger value="tours">Tours ({tours.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="flights">
            {flights.length ? flights.map(renderBooking) : (
              <EmptyState icon={Plane} title="No flight bookings" description="Search flights and book your next trip." actionLabel="Search flights" actionHref="/flights" />
            )}
          </TabsContent>
          <TabsContent value="stays">
            {stays.length ? stays.map(renderBooking) : (
              <EmptyState icon={Hotel} title="No hotel bookings" description="Find stays for your next vacation." actionLabel="Browse hotels" actionHref="/hotels" />
            )}
          </TabsContent>
          <TabsContent value="tours">
            {tours.length ? tours.map(renderBooking) : (
              <EmptyState icon={Palmtree} title="No tour bookings" description="Explore curated packages and hot deals." actionLabel="Browse tours" actionHref="/tours" />
            )}
          </TabsContent>
        </Tabs>
      )}
    </PageTransition>
  );
}
