"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { bookingsApi, paymentsApi } from "@/lib/api";
import { PageTransition } from "@/components/shared/page-transition";
import { DetailPageSkeleton, NotFoundState, PageErrorState } from "@/components/shared/query-states";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

type Booking = {
  id: string;
  reference: string;
  type: string;
  status: string;
  totalPrice: number;
  guests?: number;
  passengers?: number;
  tour?: { title: string };
  flight?: { airline: string; origin: string; destination: string };
  hotel?: { name: string; city?: { name: string } };
};

function ConfirmDevButton({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const confirm = useMutation({
    mutationFn: () => paymentsApi.confirm(bookingId),
    onSuccess: () => {
      toast.success("Booking confirmed");
      onDone();
    },
    onError: () => toast.error("Could not confirm booking"),
  });

  return (
    <Button className="w-full" size="lg" onClick={() => confirm.mutate()} disabled={confirm.isPending}>
      {confirm.isPending ? "Confirming..." : "Confirm booking (development)"}
    </Button>
  );
}

function CheckoutForm({ bookingId, amount }: { bookingId: string; amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [paying, setPaying] = useState(false);

  const confirm = useMutation({
    mutationFn: () => paymentsApi.confirm(bookingId),
    onSuccess: () => {
      toast.success("Payment confirmed!");
      router.push("/account/bookings");
    },
    onError: () => toast.error("Payment confirmation failed"),
  });

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    const { error } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    setPaying(false);
    if (error) {
      toast.error(error.message || "Payment failed");
      return;
    }
    confirm.mutate();
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <PaymentElement />
      <Button type="submit" className="w-full" size="lg" disabled={!stripe || paying || confirm.isPending}>
        {paying ? "Processing..." : `Pay ${formatPrice(amount)}`}
      </Button>
    </form>
  );
}

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(null);

  const { data: booking, isLoading, isError, refetch } = useQuery({
    queryKey: ["checkout-booking", id],
    queryFn: async () => (await bookingsApi.getOne(id)).data as Booking,
    retry: 1,
  });

  useEffect(() => {
    if (!booking || booking.status === "CONFIRMED") return;
    paymentsApi.createIntent(booking.id, booking.totalPrice).then((res) => {
      setClientSecret(res.data.clientSecret ?? null);
      setStripeConfigured(res.data.stripeConfigured ?? false);
    }).catch(() => toast.error("Failed to initialize payment"));
  }, [booking]);

  if (isLoading) return <DetailPageSkeleton />;

  if (isError) {
    return (
      <PageErrorState
        message="Could not load this booking. It may have expired or you may not have access."
        onRetry={() => refetch()}
        backHref="/account/bookings"
        backLabel="My bookings"
      />
    );
  }

  if (!booking) {
    return (
      <NotFoundState
        title="Booking not found"
        message="This checkout link is invalid or the booking was removed."
        backHref="/account/bookings"
        backLabel="My bookings"
      />
    );
  }

  if (booking.status === "CONFIRMED") {
    return (
      <PageTransition>
        <Card className="mx-auto mt-12 max-w-lg rounded-2xl">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold">Already confirmed</h1>
            <p className="mt-2 text-gray-500">Booking {booking.reference} is paid.</p>
            <Button className="mt-6" onClick={() => router.push("/account/bookings")}>View bookings</Button>
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  const title =
    booking.tour?.title ||
    (booking.flight ? `${booking.flight.airline}: ${booking.flight.origin} → ${booking.flight.destination}` : "") ||
    booking.hotel?.name ||
    booking.type;

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold text-[#112211]">Checkout</h1>
        <p className="mt-1 text-gray-500">Reference {booking.reference}</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card className="rounded-2xl">
            <CardContent className="space-y-3 p-6">
              <h2 className="font-bold">Booking summary</h2>
              <p className="text-sm text-gray-600">{title}</p>
              <p className="text-sm text-gray-500">Type: {booking.type}</p>
              <p className="text-3xl font-bold">{formatPrice(booking.totalPrice)}</p>
              <p className="text-xs text-gray-400">Status: {booking.status}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <h2 className="mb-4 font-bold">Payment</h2>
              {stripeConfigured === false && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                    Stripe is not configured. In local development you can confirm the booking without payment.
                  </div>
                  <ConfirmDevButton bookingId={booking.id} onDone={() => router.push("/account/bookings")} />
                </div>
              )}
              {stripeConfigured && clientSecret && stripePromise && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm bookingId={booking.id} amount={booking.totalPrice} />
                </Elements>
              )}
              {stripeConfigured && !clientSecret && (
                <p className="text-sm text-gray-500">Initializing secure payment...</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
