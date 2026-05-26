"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { PageTransition } from "@/components/shared/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminModal } from "@/components/admin/admin-modal";
import { formatPrice, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { AdminTableEmpty, AdminTableLoading } from "@/components/admin/admin-table-empty";
import { Pencil, Plus, Trash2 } from "lucide-react";

type Flight = {
  id: string;
  airline: string;
  flightNumber: string;
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  price: number;
  class: string;
  stops: number;
  availableSeats: number;
  amenities: string[];
  aircraft?: string | null;
};

type Airport = {
  id: string;
  name: string;
  iataCode: string;
  city?: { name: string; country?: { name: string } };
};

const emptyForm = {
  airline: "",
  flightNumber: "",
  origin: "",
  originCode: "",
  destination: "",
  destinationCode: "",
  originAirportId: "",
  destinationAirportId: "",
  departureTime: "",
  arrivalTime: "",
  duration: 120,
  price: 0,
  class: "Economy",
  stops: 0,
  availableSeats: 100,
  amenities: "Wi-Fi, Meals",
  aircraft: "",
};

export default function AdminFlightsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [airportSearch, setAirportSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [priceEdit, setPriceEdit] = useState<{ id: string; price: string } | null>(null);

  const { data: flightsResponse, isLoading } = useQuery({
    queryKey: ["admin-flights", search],
    queryFn: async () =>
      (await adminApi.flights({ search: search || undefined, limit: 100 })).data as {
        data: Flight[];
        total: number;
      },
  });

  const { data: airports = [] } = useQuery({
    queryKey: ["admin-airports", airportSearch],
    queryFn: async () => (await adminApi.airports(airportSearch || undefined)).data as Airport[],
    enabled: modalOpen,
  });

  const flights = flightsResponse?.data ?? [];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        duration: Number(form.duration),
        price: Number(form.price),
        stops: Number(form.stops),
        availableSeats: Number(form.availableSeats),
        amenities: form.amenities.split(",").map((s) => s.trim()).filter(Boolean),
        originAirportId: form.originAirportId || undefined,
        destinationAirportId: form.destinationAirportId || undefined,
        aircraft: form.aircraft || undefined,
      };
      if (editId) return adminApi.updateFlight(editId, payload);
      return adminApi.createFlight(payload);
    },
    onSuccess: () => {
      toast.success(editId ? "Flight updated" : "Flight created");
      qc.invalidateQueries({ queryKey: ["admin-flights"] });
      setModalOpen(false);
      setEditId(null);
      setForm(emptyForm);
    },
    onError: () => toast.error("Failed to save flight"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteFlight(id),
    onSuccess: () => {
      toast.success("Flight deleted");
      qc.invalidateQueries({ queryKey: ["admin-flights"] });
    },
    onError: () => toast.error("Cannot delete flight with bookings"),
  });

  const priceMutation = useMutation({
    mutationFn: ({ id, price }: { id: string; price: number }) => adminApi.updateFlight(id, { price }),
    onSuccess: () => {
      toast.success("Price updated");
      qc.invalidateQueries({ queryKey: ["admin-flights"] });
      setPriceEdit(null);
    },
    onError: () => toast.error("Failed to update price"),
  });

  const applyAirport = (airport: Airport, role: "origin" | "destination") => {
    const cityName = airport.city?.name || airport.name;
    if (role === "origin") {
      setForm({
        ...form,
        originAirportId: airport.id,
        originCode: airport.iataCode,
        origin: cityName,
      });
    } else {
      setForm({
        ...form,
        destinationAirportId: airport.id,
        destinationCode: airport.iataCode,
        destination: cityName,
      });
    }
  };

  const openEdit = (f: Flight) => {
    setEditId(f.id);
    setForm({
      airline: f.airline,
      flightNumber: f.flightNumber,
      origin: f.origin,
      originCode: f.originCode,
      destination: f.destination,
      destinationCode: f.destinationCode,
      originAirportId: "",
      destinationAirportId: "",
      departureTime: f.departureTime.slice(0, 16),
      arrivalTime: f.arrivalTime.slice(0, 16),
      duration: f.duration,
      price: f.price,
      class: f.class,
      stops: f.stops,
      availableSeats: f.availableSeats,
      amenities: f.amenities.join(", "),
      aircraft: f.aircraft || "",
    });
    setModalOpen(true);
  };

  return (
    <PageTransition>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Flights</h1>
        <Button onClick={() => { setEditId(null); setForm(emptyForm); setModalOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" /> Add flight
        </Button>
      </div>

      <div className="mt-4 max-w-xs">
        <Input placeholder="Search airline, route, flight no..." value={search} onChange={(e) => setSearch(e.target.value)} />
        {flightsResponse?.total != null && <p className="mt-1 text-xs text-gray-500">{flightsResponse.total} flights total</p>}
      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-gray-50 text-left text-gray-500"><th className="p-4">Airline</th><th className="p-4">Flight</th><th className="p-4">Route</th><th className="p-4">Departure</th><th className="p-4">Class</th><th className="p-4">Price</th><th className="p-4">Seats</th><th className="p-4">Actions</th></tr></thead>
            <tbody>
              {isLoading ? (
                <AdminTableLoading colSpan={8} />
              ) : flights.length === 0 ? (
                <AdminTableEmpty colSpan={8} message="No flights found." />
              ) : flights.map((f) => (
                  <tr key={f.id} className="border-b last:border-0">
                    <td className="p-4 font-medium">{f.airline}</td>
                    <td className="p-4">{f.flightNumber}</td>
                    <td className="p-4">{f.originCode} → {f.destinationCode}</td>
                    <td className="p-4">{formatDate(f.departureTime)}</td>
                    <td className="p-4">{f.class}</td>
                    <td className="p-4">
                      {priceEdit?.id === f.id ? (
                        <div className="flex items-center gap-1">
                          <Input className="h-8 w-24" value={priceEdit.price} onChange={(e) => setPriceEdit({ id: f.id, price: e.target.value })} />
                          <Button size="sm" onClick={() => priceMutation.mutate({ id: f.id, price: Number(priceEdit.price) })}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setPriceEdit(null)}>×</Button>
                        </div>
                      ) : (
                        <button type="button" className="group flex items-center gap-1 hover:text-[#8DD3BB]" onClick={() => setPriceEdit({ id: f.id, price: String(f.price) })}>
                          {formatPrice(f.price)} <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                        </button>
                      )}
                    </td>
                    <td className="p-4">{f.availableSeats}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(f)}>Edit</Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteMutation.mutate(f.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <AdminModal open={modalOpen} title={editId ? "Edit flight" : "Add flight"} onClose={() => setModalOpen(false)}>
        <form className="max-h-[70vh] space-y-4 overflow-y-auto pr-1" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Airline</Label><Input value={form.airline} onChange={(e) => setForm({ ...form, airline: e.target.value })} required /></div>
            <div><Label>Flight number</Label><Input value={form.flightNumber} onChange={(e) => setForm({ ...form, flightNumber: e.target.value })} required /></div>
          </div>

          <div><Label>Search airports (IATA)</Label><Input value={airportSearch} onChange={(e) => setAirportSearch(e.target.value.toUpperCase())} placeholder="DXB, IST, ALA..." /></div>
          {airports.length > 0 && (
            <div className="max-h-32 overflow-y-auto rounded-lg border text-xs">
              {airports.map((a) => (
                <div key={a.id} className="flex items-center justify-between border-b px-3 py-2 last:border-0">
                  <span>{a.iataCode} — {a.city?.name || a.name}</span>
                  <div className="flex gap-1">
                    <Button type="button" size="sm" variant="outline" onClick={() => applyAirport(a, "origin")}>Origin</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => applyAirport(a, "destination")}>Dest</Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Origin city</Label><Input value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} required /></div>
            <div><Label>Origin IATA</Label><Input value={form.originCode} onChange={(e) => setForm({ ...form, originCode: e.target.value.toUpperCase() })} maxLength={3} required /></div>
            <div><Label>Destination city</Label><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} required /></div>
            <div><Label>Destination IATA</Label><Input value={form.destinationCode} onChange={(e) => setForm({ ...form, destinationCode: e.target.value.toUpperCase() })} maxLength={3} required /></div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Departure</Label><Input type="datetime-local" value={form.departureTime} onChange={(e) => setForm({ ...form, departureTime: e.target.value })} required /></div>
            <div><Label>Arrival</Label><Input type="datetime-local" value={form.arrivalTime} onChange={(e) => setForm({ ...form, arrivalTime: e.target.value })} required /></div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div><Label>Duration (min)</Label><Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} required /></div>
            <div><Label>Price</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required /></div>
            <div><Label>Stops</Label><Input type="number" min={0} value={form.stops} onChange={(e) => setForm({ ...form, stops: Number(e.target.value) })} /></div>
            <div><Label>Seats</Label><Input type="number" min={1} value={form.availableSeats} onChange={(e) => setForm({ ...form, availableSeats: Number(e.target.value) })} /></div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Class</Label>
              <select className="mt-1 w-full rounded-lg border px-3 py-2" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })}>
                <option>Economy</option><option>Premium Economy</option><option>Business</option><option>First</option>
              </select>
            </div>
            <div><Label>Aircraft</Label><Input value={form.aircraft} onChange={(e) => setForm({ ...form, aircraft: e.target.value })} placeholder="B787-9" /></div>
          </div>

          <div><Label>Amenities (comma-separated)</Label><Input value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} /></div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : "Save flight"}</Button>
          </div>
        </form>
      </AdminModal>
    </PageTransition>
  );
}
