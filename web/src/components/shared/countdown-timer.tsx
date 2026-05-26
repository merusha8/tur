"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  targetDate: string;
  className?: string;
  compact?: boolean;
}

function getTimeLeft(target: number) {
  const diff = Math.max(0, target - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { diff, days, hours, minutes, seconds };
}

export function CountdownTimer({ targetDate, className, compact }: CountdownTimerProps) {
  const target = new Date(targetDate).getTime();
  const [left, setLeft] = useState(() => getTimeLeft(target));

  useEffect(() => {
    const id = setInterval(() => setLeft(getTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (left.diff <= 0) {
    return <span className={cn("text-sm font-semibold text-red-600", className)}>Offer expired</span>;
  }

  const parts = compact
    ? [
        left.days > 0 ? `${left.days}d` : null,
        `${String(left.hours).padStart(2, "0")}h`,
        `${String(left.minutes).padStart(2, "0")}m`,
        `${String(left.seconds).padStart(2, "0")}s`,
      ].filter(Boolean)
    : [
        left.days > 0 ? { v: left.days, l: "d" } : null,
        { v: left.hours, l: "h" },
        { v: left.minutes, l: "m" },
        { v: left.seconds, l: "s" },
      ].filter(Boolean);

  if (compact) {
    return (
      <span className={cn("font-mono text-sm font-bold tabular-nums text-red-600", className)}>
        {parts.join(" ")}
      </span>
    );
  }

  return (
    <div className={cn("flex gap-1.5", className)}>
      {(parts as { v: number; l: string }[]).map((p, i) => (
        <div key={i} className="flex min-w-[44px] flex-col items-center rounded-lg bg-red-600 px-2 py-1.5 text-white">
          <span className="text-lg font-bold leading-none tabular-nums">{String(p.v).padStart(2, "0")}</span>
          <span className="text-[10px] uppercase opacity-80">{p.l}</span>
        </div>
      ))}
    </div>
  );
}
