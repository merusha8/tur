"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { hotelsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HotelLocationMap } from "./hotel-location-map";
import { MapPin, Utensils, Waves, Plane, Landmark, Star, Globe } from "lucide-react";
import type { HotelLocationContext, NearbyPlace } from "@/types";

function PlaceList({
  title,
  icon: Icon,
  items,
  emptyText,
}: {
  title: string;
  icon: typeof MapPin;
  items: NearbyPlace[];
  emptyText: string;
}) {
  return (
    <div>
      <h4 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
        <Icon className="h-4 w-4 text-[#8DD3BB]" /> {title}
      </h4>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((place) => (
            <li key={place.id} className="flex gap-3 rounded-lg border border-gray-100 p-2">
              {place.photoUrl ? (
                <Image src={place.photoUrl} alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-lg object-cover" unoptimized />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                  <Icon className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">{place.name}</p>
                {place.address && <p className="truncate text-xs text-gray-400">{place.address}</p>}
                <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                  <span>{place.distanceKm} km</span>
                  {place.rating != null && (
                    <span className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {place.rating}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function HotelLocationSection({ hotelId, hotelName }: { hotelId: string; hotelName: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["hotel-location", hotelId],
    queryFn: async () => (await hotelsApi.getLocation(hotelId)).data as HotelLocationContext,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center p-6 text-gray-500">
          Loading location...
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const mapMarkers = [
    ...data.restaurants.slice(0, 3).map((p) => ({ lat: p.lat, lng: p.lng, title: p.name, kind: "place" as const })),
    ...data.beaches.slice(0, 2).map((p) => ({ lat: p.lat, lng: p.lng, title: p.name, kind: "place" as const })),
    ...(data.airport?.lat != null && data.airport.lng != null
      ? [{ lat: data.airport.lat, lng: data.airport.lng, title: data.airport.name, kind: "airport" as const }]
      : []),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[#8DD3BB]" /> Location & surroundings
        </CardTitle>
        {data.address && <p className="text-sm text-gray-500">{data.address}</p>}
        {!data.mapsConfigured && (
          <p className="flex items-center gap-1 text-xs text-amber-600">
            <Globe className="h-3 w-3" /> Add GOOGLE_MAPS_API_KEY on the API for nearby places
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <HotelLocationMap
          center={data.coordinates}
          hotelName={hotelName || data.hotelName}
          markers={mapMarkers}
        />

        {data.airport && (
          <div className="flex items-center gap-4 rounded-xl bg-amber-50 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <Plane className="h-6 w-6 text-amber-700" />
            </div>
            <div>
              <p className="font-semibold">
                {data.airport.name}
                {data.airport.iataCode ? ` (${data.airport.iataCode})` : ""}
              </p>
              <p className="text-sm text-gray-600">
                {data.airport.distanceKm} km from hotel
                {data.airport.durationText ? ` · ${data.airport.durationText}` : ""}
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <PlaceList
            title="Nearby places"
            icon={Landmark}
            items={data.nearbyPlaces}
            emptyText="No nearby attractions found"
          />
          <PlaceList
            title="Restaurants"
            icon={Utensils}
            items={data.restaurants}
            emptyText="No restaurants found nearby"
          />
          <PlaceList
            title="Beaches"
            icon={Waves}
            items={data.beaches}
            emptyText="No beaches found nearby"
          />
        </div>
      </CardContent>
    </Card>
  );
}
