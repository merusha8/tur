"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { flightsApi } from "@/lib/api";
import { PageTransition } from "@/components/shared/page-transition";
import { InlineError } from "@/components/shared/query-states";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice, formatDuration, formatDate } from "@/lib/utils";
import { Plane, Wifi, Utensils, Clock, Globe } from "lucide-react";
import type { FlightOffer, FlightsSearchResponse } from "@/types";

const SOURCE_BADGE = {
  amadeus: { label: "Amadeus", className: "bg-blue-100 text-blue-700" },
  skyscanner: { label: "Skyscanner", className: "bg-sky-100 text-sky-700" },
  database: { label: "Meru Tour", className: "bg-gray-100 text-gray-600" },
};

export default function FlightResultsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-16 text-center text-gray-500">Loading flight results...</div>}>
      <FlightResultsContent />
    </Suspense>
  );
}

function FlightResultsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [maxPrice, setMaxPrice] = useState(+(params.get("maxPrice") || 3000));
  const [airline, setAirline] = useState(params.get("airline") || "");
  const [sort, setSort] = useState(params.get("sort") || "price_asc");
  const [page, setPage] = useState(+(params.get("page") || 1));

  const origin = params.get("origin") || "";
  const destination = params.get("destination") || "";
  const departureDate = params.get("departureDate") || "";
  const returnDate = params.get("returnDate") || "";

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["flights-search", params.toString(), maxPrice, airline, sort, page],
    queryFn: async () => {
      const res = await flightsApi.search({
        origin: origin || undefined,
        destination: destination || undefined,
        departureDate: departureDate || undefined,
        returnDate: returnDate || undefined,
        adults: params.get("passengers") || params.get("adults") || 1,
        children: params.get("children") || 0,
        travelClass: params.get("travelClass") || undefined,
        maxPrice,
        airline: airline || undefined,
        nonStop: params.get("nonStop") === "true" ? "true" : undefined,
        sort,
        page,
        limit: 15,
      });
      return res.data as FlightsSearchResponse;
    },
  });

  const flights = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const providers = data?.providers;
  const sources = data?.sources;

  const goToPage = (p: number) => {
    setPage(p);
    const q = new URLSearchParams(params.toString());
    q.set("page", String(p));
    router.push(`/flights/results?${q.toString()}`);
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Search results for</p>
          <h1 className="text-2xl font-bold">
            {origin || "Any"} → {destination || "Anywhere"}
            {departureDate ? ` · ${formatDate(departureDate)}` : ""}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            {providers?.amadeus && (
              <span className="rounded-full bg-blue-50 px-2 py-1 font-medium text-blue-700">
                Amadeus {sources?.amadeus ? `(${sources.amadeus})` : "✓"}
              </span>
            )}
            {providers?.skyscanner && (
              <span className="rounded-full bg-sky-50 px-2 py-1 font-medium text-sky-700">
                Skyscanner {sources?.skyscanner ? `(${sources.skyscanner})` : "✓"}
              </span>
            )}
            <span className="rounded-full bg-gray-50 px-2 py-1 text-gray-600">
              Database {sources?.database ? `(${sources.database})` : ""}
            </span>
            {!providers?.amadeus && !providers?.skyscanner && (
              <span className="flex items-center gap-1 text-amber-600">
                <Globe className="h-3 w-3" /> Add API keys in .env for live prices
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          <aside className="space-y-6">
            <Card><CardContent className="space-y-4 p-4">
              <h3 className="font-bold">Filters</h3>
              <div>
                <label className="text-sm font-medium">Max Price: {formatPrice(maxPrice)}</label>
                <input type="range" min={100} max={5000} value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} className="mt-2 w-full" />
              </div>
              <Input placeholder="Airline" value={airline} onChange={(e) => setAirline(e.target.value)} />
              <div>
                <label className="text-sm font-medium">Sort</label>
                <select className="mt-1 h-10 w-full rounded-xl border px-3 text-sm" value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="duration">Shortest</option>
                  <option value="departure">Departure time</option>
                </select>
              </div>
            </CardContent></Card>
          </aside>

          <div className="lg:col-span-3 space-y-4">
            {isError && (
              <InlineError message="Failed to load flights. Check that the API is running and try again." />
            )}
            {isError && (
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => refetch()}>Retry search</Button>
              </div>
            )}
            {isLoading && (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-36 animate-pulse rounded-2xl bg-gray-100" />
                ))}
              </div>
            )}
            {!isLoading && !isError && flights.length === 0 && (
              <Card><CardContent className="p-8 text-center text-gray-500">
                No flights found. Add IATA codes (e.g. ALA, IST), dates, and configure API keys.
              </CardContent></Card>
            )}
            {!isLoading && !isError && flights.map((flight) => (
              <FlightCard key={flight.id} flight={flight} />
            ))}
            {!isLoading && !isError && totalPages > 1 && (
              <PaginationBar page={page} totalPages={totalPages} onPageChange={goToPage} />
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function FlightCard({ flight }: { flight: FlightOffer }) {
  const badge = flight.source ? SOURCE_BADGE[flight.source] : null;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
        {flight.image && (
          <Image src={flight.image} alt={flight.airline} width={120} height={80} className="rounded-lg object-cover" />
        )}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Plane className="h-4 w-4 text-[#8DD3BB]" />
            <span className="font-bold">{flight.airline}</span>
            <span className="text-sm text-gray-400">{flight.flightNumber}</span>
            {badge && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${badge.className}`}>
                {badge.label}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-4">
            <div><p className="font-bold">{new Date(flight.departureTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p><p className="text-sm text-gray-500">{flight.originCode}</p></div>
            <div className="flex flex-col items-center text-xs text-gray-400"><Clock className="h-3 w-3" />{formatDuration(flight.duration)}<span>{flight.stops === 0 ? "Non-stop" : `${flight.stops} stop`}</span></div>
            <div><p className="font-bold">{new Date(flight.arrivalTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p><p className="text-sm text-gray-500">{flight.destinationCode}</p></div>
          </div>
          <div className="mt-2 flex gap-3 text-xs text-gray-500">
            {flight.amenities?.includes("Wi-Fi") && <span className="flex items-center gap-1"><Wifi className="h-3 w-3" /> Wi-Fi</span>}
            {flight.amenities?.includes("Meals") && <span className="flex items-center gap-1"><Utensils className="h-3 w-3" /> Meals</span>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-red-500">{formatPrice(flight.price)}</p>
          <p className="text-xs text-gray-400">{formatDate(flight.departureTime)}</p>
          <Link href={`/flights/${encodeURIComponent(flight.id)}`}><Button className="mt-2">View Deals</Button></Link>
        </div>
      </CardContent>
    </Card>
  );
}
