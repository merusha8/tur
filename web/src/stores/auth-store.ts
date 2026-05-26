import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string, rememberMe?: boolean) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token, rememberMe = true) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("meru_token", token);
          const maxAge = rememberMe ? 30 * 24 * 3600 : 24 * 3600;
          document.cookie = `meru_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
          document.cookie = `meru_role=${user.role}; path=/; max-age=${maxAge}; SameSite=Lax`;
        }
        set({ user, token });
      },
      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("meru_token");
          document.cookie = "meru_token=; path=/; max-age=0; SameSite=Lax";
          document.cookie = "meru_role=; path=/; max-age=0; SameSite=Lax";
        }
        set({ user: null, token: null });
      },
      isAuthenticated: () => !!get().token,
      isAdmin: () => get().user?.role === "ADMIN",
    }),
    { name: "meru-auth", onRehydrateStorage: () => (state) => {
      if (state?.token && typeof window !== "undefined") {
        localStorage.setItem("meru_token", state.token);
        document.cookie = `meru_token=${state.token}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
        if (state.user?.role) {
          document.cookie = `meru_role=${state.user.role}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
        }
      }
    } },
  )
);
