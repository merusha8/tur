import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("meru_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("meru_token");
      document.cookie = "meru_token=; path=/; max-age=0; SameSite=Lax";
      document.cookie = "meru_role=; path=/; max-age=0; SameSite=Lax";
      const path = window.location.pathname;
      if (!path.startsWith("/auth")) {
        window.location.href = `/auth/login?redirect=${encodeURIComponent(path)}`;
      }
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  login: (data: { email: string; password: string; rememberMe?: boolean }) => api.post("/auth/login", data),
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) =>
    api.post("/auth/register", data),
  verify: (data: { email: string; code: string }) => api.post("/auth/verify", data),
  resendVerification: (email: string) => api.post("/auth/resend-verification", { email }),
  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
  resetPassword: (data: { email: string; code: string; password: string }) => api.post("/auth/reset-password", data),
};

export const flightsApi = {
  getAll: (params?: Record<string, string | number | undefined>) => api.get("/flights", { params }),
  search: (params?: Record<string, string | number | undefined>) => api.get("/flights/search", { params }),
  getProviders: () => api.get("/flights/providers"),
  getOne: (id: string) => api.get(`/flights/${id}`),
};

export const hotelsApi = {
  getAll: (params?: Record<string, string | number | undefined>) => api.get("/hotels", { params }),
  search: (params?: Record<string, string | number | undefined>) => api.get("/hotels/search", { params }),
  getSearchFilters: () => api.get("/hotels/search-filters"),
  getProviders: () => api.get("/hotels/providers"),
  getOne: (id: string) => api.get(`/hotels/${encodeURIComponent(id)}`),
  getLocation: (id: string) => api.get(`/hotels/${encodeURIComponent(id)}/location`),
};

export const bookingsApi = {
  getAll: (type?: string) => api.get("/bookings", { params: type ? { type } : {} }),
  getOne: (id: string) => api.get(`/bookings/${id}`),
  create: (data: Record<string, unknown>) => api.post("/bookings", data),
  cancel: (id: string) => api.patch(`/bookings/${id}/cancel`),
};

export const paymentsApi = {
  getConfig: () => api.get("/payments/config"),
  createIntent: (bookingId: string, amount: number) => api.post("/payments/intent", { bookingId, amount }),
  confirm: (bookingId: string) => api.post("/payments/confirm", { bookingId }),
  getMethods: () => api.get("/payments/methods"),
  addMethod: (data: { brand: string; last4: string; expMonth: number; expYear: number }) =>
    api.post("/payments/methods", data),
  deleteMethod: (id: string) => api.delete(`/payments/methods/${id}`),
};

export const usersApi = {
  getProfile: () => api.get("/users/me"),
  updateProfile: (data: Record<string, string>) => api.patch("/users/me", data),
};

export const favoritesApi = {
  getAll: () => api.get("/favorites"),
  toggle: (data: { flightId?: string; hotelId?: string; tourId?: string }) => api.post("/favorites/toggle", data),
};

export const reviewsApi = {
  getAll: (params: {
    flightId?: string;
    hotelId?: string;
    tourId?: string;
    destinationId?: string;
    featured?: boolean;
    rating?: number;
    verified?: boolean;
    sort?: string;
    page?: number;
    limit?: number;
  }) => api.get("/reviews", { params }),
  create: (data: {
    flightId?: string;
    hotelId?: string;
    tourId?: string;
    destinationId?: string;
    rating: number;
    title?: string;
    comment: string;
    pros?: string[];
    cons?: string[];
    images?: string[];
    location?: string;
  }) => api.post("/reviews", data),
};

export const notificationsApi = {
  getAll: () => api.get("/notifications"),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),
};

export const adminApi = {
  dashboard: () => api.get("/admin/dashboard"),
  analytics: () => api.get("/admin/analytics"),
  formOptions: (params?: { citySearch?: string; hotelSearch?: string; tourSearch?: string }) =>
    api.get("/admin/form-options", { params }),
  uploadImage: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/admin/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
  },
  users: () => api.get("/admin/users"),
  bookings: () => api.get("/admin/bookings"),
  flights: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get("/admin/flights", { params }),
  createFlight: (data: Record<string, unknown>) => api.post("/admin/flights", data),
  updateFlight: (id: string, data: Record<string, unknown>) => api.patch(`/admin/flights/${id}`, data),
  deleteFlight: (id: string) => api.delete(`/admin/flights/${id}`),
  airports: (search?: string) => api.get("/admin/airports", { params: search ? { search } : {} }),
  hotels: () => api.get("/admin/hotels"),
  createHotel: (data: Record<string, unknown>) => api.post("/admin/hotels", data),
  updateHotel: (id: string, data: Record<string, unknown>) => api.patch(`/admin/hotels/${id}`, data),
  deleteHotel: (id: string) => api.delete(`/admin/hotels/${id}`),
  countries: () => api.get("/admin/countries"),
  createCountry: (data: Record<string, unknown>) => api.post("/admin/countries", data),
  updateCountry: (id: string, data: Record<string, unknown>) => api.patch(`/admin/countries/${id}`, data),
  deleteCountry: (id: string) => api.delete(`/admin/countries/${id}`),
  cities: (countryId?: string) => api.get("/admin/cities", { params: countryId ? { countryId } : {} }),
  createCity: (data: Record<string, unknown>) => api.post("/admin/cities", data),
  updateCity: (id: string, data: Record<string, unknown>) => api.patch(`/admin/cities/${id}`, data),
  deleteCity: (id: string) => api.delete(`/admin/cities/${id}`),
  updateUser: (id: string, data: { role: "USER" | "ADMIN" }) => api.patch(`/admin/users/${id}`, data),
  banUser: (id: string, banned: boolean) => api.patch(`/admin/users/${id}/ban`, { banned }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  updateBooking: (id: string, data: { status: string }) => api.patch(`/admin/bookings/${id}`, data),
  destinations: () => api.get("/admin/destinations"),
  createDestination: (data: Record<string, unknown>) => api.post("/admin/destinations", data),
  updateDestination: (id: string, data: Record<string, unknown>) => api.patch(`/admin/destinations/${id}`, data),
  deleteDestination: (id: string) => api.delete(`/admin/destinations/${id}`),
  tours: (params?: { search?: string; page?: number; limit?: number }) => api.get("/admin/tours", { params }),
  createTour: (data: Record<string, unknown>) => api.post("/admin/tours", data),
  updateTour: (id: string, data: Record<string, unknown>) => api.patch(`/admin/tours/${id}`, data),
  deleteTour: (id: string) => api.delete(`/admin/tours/${id}`),
  hotTours: () => api.get("/admin/hot-tours"),
  createHotTour: (data: Record<string, unknown>) => api.post("/admin/hot-tours", data),
  updateHotTour: (id: string, data: Record<string, unknown>) => api.patch(`/admin/hot-tours/${id}`, data),
  deleteHotTour: (id: string) => api.delete(`/admin/hot-tours/${id}`),
  payments: () => api.get("/admin/payments"),
  reviews: (params?: { verified?: string; featured?: string; page?: number }) =>
    api.get("/admin/reviews", { params }),
  updateReview: (id: string, data: { verified?: boolean; featured?: boolean }) =>
    api.patch(`/admin/reviews/${id}`, data),
  deleteReview: (id: string) => api.delete(`/admin/reviews/${id}`),
  newsletter: () => api.get("/admin/newsletter"),
  updateNewsletter: (id: string, data: { active: boolean }) => api.patch(`/admin/newsletter/${id}`, data),
  deleteNewsletter: (id: string) => api.delete(`/admin/newsletter/${id}`),
  contactInquiries: () => api.get("/admin/contact"),
  deleteContactInquiry: (id: string) => api.delete(`/admin/contact/${id}`),
  resorts: () => api.get("/admin/resorts"),
  createResort: (data: Record<string, unknown>) => api.post("/admin/resorts", data),
  updateResort: (id: string, data: Record<string, unknown>) => api.patch(`/admin/resorts/${id}`, data),
  deleteResort: (id: string) => api.delete(`/admin/resorts/${id}`),
};

export const destinationsApi = {
  getAll: (params?: { featured?: boolean; search?: string }) =>
    api.get("/destinations", { params: { ...(params?.featured ? { featured: "true" } : {}), ...(params?.search ? { search: params.search } : {}) } }),
  getOne: (slug: string) => api.get(`/destinations/${slug}`),
};

export const publicApi = {
  getHome: () => api.get("/public/home"),
  getStats: () => api.get("/public/stats"),
  getContactInfo: () => api.get("/public/contact-info"),
  getFooter: () => api.get("/public/footer"),
  getBanner: (href: string) => api.get("/public/banner", { params: { href } }),
  submitContact: (data: { firstName: string; lastName: string; email: string; subject: string; message: string }) =>
    api.post("/public/contact", data),
  subscribeNewsletter: (email: string) => api.post("/public/newsletter", { email }),
};

export const countriesApi = {
  getAll: (params?: Record<string, string | number | undefined>) => api.get("/countries", { params }),
  getOne: (slug: string) => api.get(`/countries/${slug}`),
};

export const citiesApi = {
  getAll: (params?: Record<string, string | number | undefined>) => api.get("/cities", { params }),
  getOne: (slug: string) => api.get(`/cities/${slug}`),
};

export const airportsApi = {
  getAll: (params?: Record<string, string | number | undefined>) => api.get("/airports", { params }),
  getOne: (iata: string) => api.get(`/airports/${iata}`),
};

export const resortsApi = {
  getAll: (params?: Record<string, string | number | undefined>) => api.get("/resorts", { params }),
  getBeachTypes: () => api.get("/resorts/beach-types"),
  getOne: (id: string) => api.get(`/resorts/${id}`),
};

export const hotToursApi = {
  getAll: (params?: Record<string, string | number | undefined>) => api.get("/hot-tours", { params }),
  getFilters: () => api.get("/hot-tours/filters"),
  getOne: (id: string) => api.get(`/hot-tours/${id}`),
};

export const vacationCategoriesApi = {
  getAll: () => api.get("/vacation-categories"),
  getOne: (slug: string) => api.get(`/vacation-categories/${slug}`),
};

export const toursApi = {
  getAll: (params?: Record<string, string | number | undefined>) => api.get("/tours", { params }),
  getOne: (id: string) => api.get(`/tours/${id}`),
  getAirlines: () => api.get("/tours/airlines"),
  getSearchFilters: () => api.get("/tours/search-filters"),
};

export const searchApi = {
  search: (q: string) => api.get("/search", { params: { q } }),
};
