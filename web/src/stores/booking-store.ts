import { create } from "zustand";

interface BookingState {
  selectedFlightId: string | null;
  selectedHotelId: string | null;
  bookingId: string | null;
  totalPrice: number;
  setSelectedFlight: (id: string, price: number) => void;
  setSelectedHotel: (id: string, price: number) => void;
  setBookingId: (id: string) => void;
  reset: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedFlightId: null,
  selectedHotelId: null,
  bookingId: null,
  totalPrice: 0,
  setSelectedFlight: (id, price) => set({ selectedFlightId: id, totalPrice: price }),
  setSelectedHotel: (id, price) => set({ selectedHotelId: id, totalPrice: price }),
  setBookingId: (id) => set({ bookingId: id }),
  reset: () => set({ selectedFlightId: null, selectedHotelId: null, bookingId: null, totalPrice: 0 }),
}));
