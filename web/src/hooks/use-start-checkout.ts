"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { bookingsApi } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

type BookingPayload = {
  type: "FLIGHT" | "HOTEL" | "TOUR";
  flightId?: string;
  hotelId?: string;
  tourId?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  passengers?: number;
  totalPrice: number;
};

export function useStartCheckout() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  return useMutation({
    mutationFn: async (payload: BookingPayload) => {
      const res = await bookingsApi.create(payload);
      return res.data as { id: string; reference: string };
    },
    onSuccess: (booking) => {
      router.push(`/checkout/${booking.id}`);
    },
    onError: () => {
      if (!isAuthenticated()) {
        toast.error("Please login to book");
        router.push("/auth/login");
      } else {
        toast.error("Could not create booking");
      }
    },
  });
}
