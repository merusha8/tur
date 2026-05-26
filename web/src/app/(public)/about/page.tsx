"use client";

import { useQuery } from "@tanstack/react-query";
import { PageTransition, FadeIn } from "@/components/shared/page-transition";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Globe, Users, Award, Heart, AlertCircle } from "lucide-react";
import { publicApi } from "@/lib/api";

const STAT_ICONS = [
  { key: "destinations" as const, icon: Globe, label: "Destinations" },
  { key: "travelers" as const, icon: Users, label: "Registered Travelers" },
  { key: "confirmedBookings" as const, icon: Award, label: "Confirmed Bookings" },
  { key: "averageRating" as const, icon: Heart, label: "Average Rating" },
];

export default function AboutPage() {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["public-stats"],
    queryFn: async () => (await publicApi.getStats()).data as Record<string, number>,
  });

  const { data: contactInfo } = useQuery({
    queryKey: ["contact-info"],
    queryFn: async () => (await publicApi.getContactInfo()).data as { mission: string; whyChoose: string[] },
  });

  return (
    <PageTransition>
      <section className="bg-[#8DD3BB]/10 py-20">
        <div className="mx-auto max-w-[1200px] px-6 text-center lg:px-8">
          <h1 className="text-4xl font-bold text-[#112211] md:text-5xl">About Meru Tour</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            {contactInfo?.mission || "Premium travel booking platform."}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 py-16 lg:px-8">
        {isError ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <p className="text-gray-500">Could not load statistics from the server.</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STAT_ICONS.map((s, i) => (
              <FadeIn key={s.key} delay={i * 0.1}>
                <div className="rounded-[24px] border border-gray-100 bg-white p-6 text-center shadow-sm">
                  <s.icon className="mx-auto h-8 w-8 text-[#8DD3BB]" />
                  <p className="mt-4 text-3xl font-bold">{isLoading ? "—" : stats?.[s.key] ?? 0}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        )}

        <div className="mt-16 grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold">Our Mission</h2>
            <p className="mt-4 leading-relaxed text-gray-600">{contactInfo?.mission}</p>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Why Choose Us</h2>
            <ul className="mt-4 space-y-3 text-gray-600">
              {(contactInfo?.whyChoose ?? []).map((item) => (
                <li key={item}>✓ {item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link href="/destinations"><Button size="lg">Explore Destinations</Button></Link>
        </div>
      </section>
    </PageTransition>
  );
}
