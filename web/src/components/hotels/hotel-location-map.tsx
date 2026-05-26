"use client";

import { useEffect, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

type MapMarker = {
  lat: number;
  lng: number;
  title: string;
  kind: "hotel" | "place" | "airport";
};

interface HotelLocationMapProps {
  center: { lat: number; lng: number };
  hotelName: string;
  markers?: MapMarker[];
  className?: string;
}

let mapsOptionsSet = false;

export function HotelLocationMap({ center, hotelName, markers = [], className = "" }: HotelLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const markersKey = markers.map((m) => `${m.lat},${m.lng},${m.title}`).join("|");

  useEffect(() => {
    if (!apiKey || !mapRef.current || (center.lat === 0 && center.lng === 0)) return;

    let cancelled = false;

    if (!mapsOptionsSet) {
      setOptions({ key: apiKey, v: "weekly" });
      mapsOptionsSet = true;
    }

    Promise.all([importLibrary("maps"), importLibrary("marker")])
      .then(([mapsLib, markerLib]) => {
        if (cancelled || !mapRef.current) return;

        const map = new mapsLib.Map(mapRef.current, {
          center,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        new markerLib.Marker({
          map,
          position: center,
          title: hotelName,
        });

        markers.forEach((m) => {
          new markerLib.Marker({
            map,
            position: { lat: m.lat, lng: m.lng },
            title: m.title,
          });
        });
      })
      .catch(() => setError("Failed to load Google Maps"));

    return () => {
      cancelled = true;
    };
  }, [apiKey, center.lat, center.lng, hotelName, markersKey, markers]);

  if (!apiKey) {
    return (
      <div className={`flex h-72 items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500 ${className}`}>
        Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the map
      </div>
    );
  }

  if (center.lat === 0 && center.lng === 0) {
    return (
      <div className={`flex h-72 items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500 ${className}`}>
        Location coordinates unavailable
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex h-72 items-center justify-center rounded-xl bg-gray-100 text-sm text-red-500 ${className}`}>
        {error}
      </div>
    );
  }

  return <div ref={mapRef} className={`h-72 w-full rounded-xl ${className}`} />;
}
