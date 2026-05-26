"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";
import type { PromoBanner } from "@/types";

interface PageHeroProps {
  href: string;
  fallbackTitle: string;
}

export function PageHero({ href, fallbackTitle }: PageHeroProps) {
  const { data: banner, isLoading } = useQuery({
    queryKey: ["page-banner", href],
    queryFn: async () => {
      const res = await publicApi.getBanner(href);
      return res.data as PromoBanner | null;
    },
  });

  return (
    <div className="relative h-72">
      {banner?.image && (
        <Image src={banner.image} alt={banner.title} fill className="object-cover" priority />
      )}
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 flex items-center justify-center">
        <h1 className="text-4xl font-bold text-white">
          {isLoading ? "Loading..." : banner?.title || fallbackTitle}
        </h1>
      </div>
    </div>
  );
}
