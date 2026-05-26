"use client";

import Link from "next/link";
import { RemoteImage } from "@/components/ui/remote-image";
import { motion } from "framer-motion";
import type { PlanTripCity } from "@/types";

export function PlanTripGrid({ cities }: { cities: PlanTripCity[] }) {
  if (!cities.length) {
    return <p className="text-center text-gray-500">Destination packages will appear here once cities are seeded.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {cities.map((city, i) => (
        <motion.div
          key={city.id}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
          whileHover={{ y: -6 }}
          className="h-full"
        >
          <Link
            href={`/tours?cityId=${city.id}`}
            className="group flex h-[280px] flex-col overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-xl"
          >
            <div className="relative min-h-[180px] flex-1 overflow-hidden">
              <RemoteImage
                src={city.image}
                alt={city.displayName}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-0 p-5 text-white">
                <h3 className="text-xl font-bold">{city.displayName}</h3>
                <p className="text-sm text-white/80">{city.country.name}</p>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm font-medium text-[#112211]">Explore packages</span>
              <span className="text-sm font-semibold text-[#8DD3BB] transition-transform group-hover:translate-x-1">→</span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

export function PlanTripGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-[280px] animate-pulse rounded-[24px] bg-gray-200" />
      ))}
    </div>
  );
}
