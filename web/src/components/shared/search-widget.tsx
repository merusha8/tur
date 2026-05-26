"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchAutocomplete } from "@/components/shared/search-autocomplete";
import { TourPackageSearchForm } from "@/components/shared/tour-package-search-form";
import { useSearchStore, tourSearchToParams } from "@/stores/search-store";
import { Plane, Hotel, Palmtree } from "lucide-react";
import { toast } from "sonner";
import type { SearchResult } from "@/types";

function pickFlightDestination(result: SearchResult): string {
  if (result.airportCode) return result.airportCode.toUpperCase();
  if (result.countryCode) return result.countryCode.toUpperCase();
  return result.label.slice(0, 3).toUpperCase();
}

export function SearchWidget({ className = "" }: { className?: string }) {
  const router = useRouter();
  const { flightSearch, hotelSearch, setFlightSearch, setHotelSearch, setTourSearch } = useSearchStore();

  const searchFlights = () => {
    if (!flightSearch.origin.trim() || !flightSearch.destination.trim()) {
      toast.error("Enter origin and destination airport codes");
      return;
    }
    const params = new URLSearchParams({
      origin: flightSearch.origin.toUpperCase(),
      destination: flightSearch.destination.toUpperCase(),
      passengers: String(flightSearch.passengers),
    });
    if (flightSearch.departDate) params.set("departureDate", flightSearch.departDate);
    if (flightSearch.returnDate) params.set("returnDate", flightSearch.returnDate);
    if (flightSearch.travelClass) params.set("travelClass", flightSearch.travelClass.toUpperCase().replace(" ", "_"));
    router.push(`/flights/results?${params}`);
  };

  const searchHotels = () => {
    if (!hotelSearch.city.trim()) {
      toast.error("Choose a city or hotel destination");
      return;
    }
    const params = new URLSearchParams({ city: hotelSearch.city, guests: String(hotelSearch.guests) });
    if (hotelSearch.checkIn) params.set("checkIn", hotelSearch.checkIn);
    if (hotelSearch.checkOut) params.set("checkOut", hotelSearch.checkOut);
    router.push(`/hotels/results?${params}`);
  };

  const handleFlightDestination = (result: SearchResult) => {
    setFlightSearch({ destination: pickFlightDestination(result) });
  };

  const handleHotelDestination = (result: SearchResult) => {
    const cityLabel = result.type === "hotel" ? (result.subtitle?.split("·")[0]?.trim() || result.country || result.label) : result.label;
    setHotelSearch({ city: cityLabel });
  };

  return (
    <div className={`rounded-[24px] bg-white p-6 shadow-[0_8px_40px_rgba(17,34,17,0.12)] md:p-8 ${className}`}>
      <Tabs defaultValue="tours">
        <TabsList className="mb-6">
          <TabsTrigger value="tours"><Palmtree className="mr-2 h-4 w-4" /> Tour Packages</TabsTrigger>
          <TabsTrigger value="flights"><Plane className="mr-2 h-4 w-4" /> Flights</TabsTrigger>
          <TabsTrigger value="stays"><Hotel className="mr-2 h-4 w-4" /> Hotels</TabsTrigger>
        </TabsList>

        <TabsContent value="tours">
          <TourPackageSearchForm
            onSubmit={(s) => {
              setTourSearch(s);
              router.push(`/tours/results?${tourSearchToParams(s).toString()}`);
            }}
            submitLabel="Search tours"
          />
        </TabsContent>

        <TabsContent value="flights">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label className="mb-2 block">Where to?</Label>
              <SearchAutocomplete
                placeholder="Search destinations, cities..."
                navigateOnSelect={false}
                onSelect={handleFlightDestination}
              />
            </div>
            <div>
              <Label>From (IATA)</Label>
              <Input placeholder="ALA" className="mt-2 uppercase" value={flightSearch.origin} onChange={(e) => setFlightSearch({ origin: e.target.value.toUpperCase() })} />
            </div>
            <div>
              <Label>To (IATA)</Label>
              <Input placeholder="IST" className="mt-2 uppercase" value={flightSearch.destination} onChange={(e) => setFlightSearch({ destination: e.target.value.toUpperCase() })} />
              {flightSearch.destination && (
                <p className="mt-2 text-sm text-gray-500">Destination: {flightSearch.destination}</p>
              )}
            </div>
            <div>
              <Label>Depart - Return</Label>
              <div className="mt-2 flex gap-2">
                <Input type="date" value={flightSearch.departDate} onChange={(e) => setFlightSearch({ departDate: e.target.value })} />
                {flightSearch.trip === "roundtrip" && (
                  <Input type="date" value={flightSearch.returnDate} onChange={(e) => setFlightSearch({ returnDate: e.target.value })} />
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              className="text-sm font-medium text-[#8DD3BB] hover:underline"
              onClick={() => toast.info("Promo codes will be available at checkout")}
            >
              + Add Promo Code
            </button>
            <Button onClick={searchFlights} size="lg">Show Flights</Button>
          </div>
        </TabsContent>

        <TabsContent value="stays">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label className="mb-2 block">Where to?</Label>
              <SearchAutocomplete
                placeholder="Search cities, hotels, resorts..."
                navigateOnSelect={false}
                onSelect={handleHotelDestination}
              />
              {hotelSearch.city && (
                <p className="mt-2 text-sm text-gray-500">Selected: {hotelSearch.city}</p>
              )}
            </div>
            <div>
              <Label>Check-in - Check-out</Label>
              <div className="mt-2 flex gap-2">
                <Input type="date" value={hotelSearch.checkIn} onChange={(e) => setHotelSearch({ checkIn: e.target.value })} />
                <Input type="date" value={hotelSearch.checkOut} onChange={(e) => setHotelSearch({ checkOut: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Guests</Label>
              <Input className="mt-2" type="number" min={1} value={hotelSearch.guests} onChange={(e) => setHotelSearch({ guests: +e.target.value })} />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={searchHotels} size="lg">Show Stays</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
