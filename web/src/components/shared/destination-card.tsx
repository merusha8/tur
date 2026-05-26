"use client";

import Link from "next/link";
import { RemoteImage } from "@/components/ui/remote-image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DestinationCardProps {
  slug: string;
  name: string;
  country: string;
  image: string;
  categories: string[];
  className?: string;
}

export function DestinationCard({ slug, name, country, image, categories, className }: DestinationCardProps) {
  return (
    <Link href={`/destinations/${slug}`} className={cn("block", className)}>
      <motion.div
        whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(17,34,17,0.08)" }}
        transition={{ duration: 0.2 }}
        className="flex h-[88px] w-full items-center gap-4 rounded-[24px] border border-gray-100 bg-white px-4 py-3 shadow-[0_2px_12px_rgba(17,34,17,0.04)]"
      >
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
          <RemoteImage src={image} alt={name} fill className="object-cover" sizes="64px" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold leading-tight text-[#112211]">
            {name}, {country}
          </h3>
          <p className="mt-1 truncate text-sm text-gray-500">
            {categories.join(" • ")}
          </p>
        </div>
      </motion.div>
    </Link>
  );
}

export function DestinationCardSkeleton() {
  return (
    <div className="flex h-[88px] w-full animate-pulse items-center gap-4 rounded-[24px] border border-gray-100 bg-white px-4 py-3">
      <div className="h-16 w-16 shrink-0 rounded-2xl bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-1/2 rounded bg-gray-100" />
      </div>
    </div>
  );
}
