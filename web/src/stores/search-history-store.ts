import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SearchHistoryState {
  recent: string[];
  addRecent: (query: string) => void;
  clearRecent: () => void;
}

export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set, get) => ({
      recent: [],
      addRecent: (query) => {
        const trimmed = query.trim();
        if (!trimmed) return;
        const filtered = get().recent.filter((r) => r.toLowerCase() !== trimmed.toLowerCase());
        set({ recent: [trimmed, ...filtered].slice(0, 8) });
      },
      clearRecent: () => set({ recent: [] }),
    }),
    { name: "meru-search-history" }
  )
);
