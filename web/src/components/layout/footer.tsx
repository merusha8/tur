"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Share2, Globe, Mail, MessageCircle } from "lucide-react";
import { publicApi } from "@/lib/api";

export function Footer() {
  const { data } = useQuery({
    queryKey: ["footer"],
    queryFn: async () => (await publicApi.getFooter()).data as {
      destinations: { name: string; slug: string }[];
      tourCategories: string[];
    },
  });

  const destinations = data?.destinations ?? [];
  const categories = data?.tourCategories ?? [];

  return (
    <footer className="bg-[#8DD3BB] text-[#112211]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-5">
          <div>
            <Link href="/" className="text-2xl font-bold">meru<span className="opacity-70">tour</span></Link>
            <div className="mt-4 flex gap-3">
              {[Share2, Globe, Mail, MessageCircle].map((Icon, i) => (
                <Link key={i} href="/contact" className="rounded-full bg-white/20 p-2 transition-colors hover:bg-white/30"><Icon className="h-4 w-4" /></Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-3 font-bold">Our Destinations</h4>
            <ul className="space-y-2 text-sm opacity-80">
              {destinations.map((d) => (
                <li key={d.slug}><Link href={`/destinations/${d.slug}`} className="hover:opacity-100">{d.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-bold">Tour Categories</h4>
            <ul className="space-y-2 text-sm opacity-80">
              {categories.map((c) => (
                <li key={c}><Link href={`/tours?category=${encodeURIComponent(c)}`} className="hover:opacity-100">{c}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-bold">Explore</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link href="/flights" className="hover:opacity-100">Flights</Link></li>
              <li><Link href="/hotels" className="hover:opacity-100">Hotels</Link></li>
              <li><Link href="/tours" className="hover:opacity-100">Tours</Link></li>
              <li><Link href="/destinations" className="hover:opacity-100">Destinations</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-bold">About Us</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link href="/about" className="hover:opacity-100">About Us</Link></li>
              <li><Link href="/contact" className="hover:opacity-100">Contact</Link></li>
              <li><Link href="/terms" className="hover:opacity-100">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:opacity-100">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-[#112211]/10 pt-6 text-center text-sm opacity-70">
          © {new Date().getFullYear()} Meru Tour. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
