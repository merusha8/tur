"use client";

import { useEffect, useState } from "react";
import { Presentation, X } from "lucide-react";

const STORAGE_KEY = "meru_demo_banner_dismissed";

export function DemoBanner() {
  const enabled = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
  }, [enabled]);

  if (!enabled || dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="relative z-[60] border-b border-[#8DD3BB]/30 bg-[#112211] px-4 py-2.5 text-white">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-x-4 gap-y-1 pr-8 text-center text-xs sm:text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold text-[#8DD3BB]">
          <Presentation className="h-4 w-4" /> Demo presentation mode
        </span>
        <span className="text-white/90">
          User <code className="rounded bg-white/10 px-1.5 py-0.5">john@example.com</code> / <code className="rounded bg-white/10 px-1.5 py-0.5">User12345!</code>
        </span>
        <span className="hidden text-white/70 sm:inline">·</span>
        <span className="text-white/90">
          Admin <code className="rounded bg-white/10 px-1.5 py-0.5">admin@merutour.com</code> / <code className="rounded bg-white/10 px-1.5 py-0.5">Admin123!</code>
        </span>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white"
        aria-label="Dismiss demo banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
