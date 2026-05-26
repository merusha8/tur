"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { PageTransition } from "@/components/shared/page-transition";
import { AdminTableEmpty, AdminTableLoading } from "@/components/admin/admin-table-empty";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminModal } from "@/components/admin/admin-modal";
import { ImageUploadField } from "@/components/admin/image-upload";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Tour } from "@/types";

type FormOptions = {
  countries: { id: string; name: string }[];
  cities: { id: string; name: string; countryId: string }[];
  hotels: { id: string; name: string; cityId: string }[];
};

const emptyForm = {
  countryId: "",
  cityId: "",
  hotelId: "",
  title: "",
  description: "",
  duration: 7,
  departureDate: "",
  returnDate: "",
  price: 0,
  oldPrice: "",
  airline: "",
  allInclusive: false,
  availableSeats: 20,
  images: [] as string[],
};

export default function AdminToursPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tour | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [priceEdit, setPriceEdit] = useState<{ id: string; price: string } | null>(null);

  const [tourSearch, setTourSearch] = useState("");

  const { data: toursResponse, isLoading } = useQuery({
    queryKey: ["admin-tours", tourSearch],
    queryFn: async () => (await adminApi.tours({ search: tourSearch || undefined, limit: 100 })).data as { data: Tour[]; total: number },
  });

  const tours = toursResponse?.data ?? [];

  const { data: options } = useQuery({
    queryKey: ["admin-form-options"],
    queryFn: async () => (await adminApi.formOptions()).data as FormOptions,
  });

  const cities = useMemo(
    () => options?.cities.filter((c) => c.countryId === form.countryId) || [],
    [options, form.countryId],
  );
  const hotels = useMemo(
    () => options?.hotels.filter((h) => h.cityId === form.cityId) || [],
    [options, form.cityId],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        price: Number(form.price),
        oldPrice: form.oldPrice ? Number(form.oldPrice) : undefined,
        duration: Number(form.duration),
        availableSeats: Number(form.availableSeats),
      };
      if (editing) return adminApi.updateTour(editing.id, payload);
      return adminApi.createTour(payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Tour updated" : "Tour created");
      qc.invalidateQueries({ queryKey: ["admin-tours"] });
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: () => toast.error("Failed to save tour"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteTour(id),
    onSuccess: () => {
      toast.success("Tour deleted");
      qc.invalidateQueries({ queryKey: ["admin-tours"] });
    },
    onError: () => toast.error("Failed to delete tour"),
  });

  const priceMutation = useMutation({
    mutationFn: ({ id, price }: { id: string; price: number }) => adminApi.updateTour(id, { price }),
    onSuccess: () => {
      toast.success("Price updated");
      qc.invalidateQueries({ queryKey: ["admin-tours"] });
      setPriceEdit(null);
    },
    onError: () => toast.error("Failed to update price"),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (t: Tour) => {
    setEditing(t);
    setForm({
      countryId: t.countryId || "",
      cityId: t.cityId || "",
      hotelId: t.hotelId || "",
      title: t.title,
      description: t.description,
      duration: t.duration,
      departureDate: t.departureDate?.slice(0, 10) || "",
      returnDate: t.returnDate?.slice(0, 10) || "",
      price: t.price,
      oldPrice: t.oldPrice ? String(t.oldPrice) : "",
      airline: t.airline,
      allInclusive: t.allInclusive,
      availableSeats: t.availableSeats,
      images: t.images || [],
    });
    setModalOpen(true);
  };

  return (
    <PageTransition>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tours</h1>
        <div className="flex gap-2">
          <Link href="/tours"><Button variant="outline">View on site</Button></Link>
          <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Add tour</Button>
        </div>
      </div>

      <div className="mt-4 max-w-xs">
        <Input placeholder="Search tours..." value={tourSearch} onChange={(e) => setTourSearch(e.target.value)} />
        {toursResponse?.total != null && <p className="mt-1 text-xs text-gray-500">{toursResponse.total} tours total</p>}
      </div>

      <Card className="mt-6 rounded-[24px]">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-gray-50 text-left text-gray-500"><th className="p-4">Title</th><th className="p-4">City</th><th className="p-4">Airline</th><th className="p-4">Duration</th><th className="p-4">Price</th><th className="p-4">Actions</th></tr></thead>
            <tbody>
              {isLoading ? (
                <AdminTableLoading colSpan={6} />
              ) : tours.length === 0 ? (
                  <AdminTableEmpty colSpan={6} message="No tours found." />
                ) : tours.map((t) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="p-4 font-medium">{t.title}{t.hotTour ? " 🔥" : ""}</td>
                    <td className="p-4">{t.city?.name}</td>
                    <td className="p-4">{t.airline}</td>
                    <td className="p-4">{t.duration} days</td>
                    <td className="p-4">
                      {priceEdit?.id === t.id ? (
                        <div className="flex items-center gap-1">
                          <Input className="h-8 w-24" value={priceEdit.price} onChange={(e) => setPriceEdit({ id: t.id, price: e.target.value })} />
                          <Button size="sm" onClick={() => priceMutation.mutate({ id: t.id, price: Number(priceEdit.price) })}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setPriceEdit(null)}>×</Button>
                        </div>
                      ) : (
                        <button type="button" className="group flex items-center gap-1 hover:text-[#8DD3BB]" onClick={() => setPriceEdit({ id: t.id, price: String(t.price) })}>
                          {formatPrice(t.price)} <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                        </button>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(t)}>Edit</Button>
                        <Link href={`/tours/${t.id}`} className="text-[#8DD3BB] hover:underline self-center text-sm">View</Link>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => confirm("Delete tour?") && deleteMutation.mutate(t.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </CardContent>
      </Card>

      <AdminModal open={modalOpen} title={editing ? "Edit tour" : "Add tour"} onClose={() => setModalOpen(false)}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Country</Label>
              <select className="mt-1 w-full rounded-lg border px-3 py-2" value={form.countryId} onChange={(e) => setForm({ ...form, countryId: e.target.value, cityId: "", hotelId: "" })} required>
                <option value="">Select country</option>
                {options?.countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><Label>City</Label>
              <select className="mt-1 w-full rounded-lg border px-3 py-2" value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value, hotelId: "" })} required>
                <option value="">Select city</option>
                {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><Label>Hotel</Label>
              <select className="mt-1 w-full rounded-lg border px-3 py-2" value={form.hotelId} onChange={(e) => setForm({ ...form, hotelId: e.target.value })} required>
                <option value="">Select hotel</option>
                {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div><Label>Airline</Label><Input value={form.airline} onChange={(e) => setForm({ ...form, airline: e.target.value })} required /></div>
          </div>
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div><Label>Description</Label><textarea className="mt-1 w-full rounded-lg border px-3 py-2" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><Label>Duration (days)</Label><Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} required /></div>
            <div><Label>Price</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required /></div>
            <div><Label>Old price (optional)</Label><Input type="number" value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Departure date</Label><Input type="date" value={form.departureDate} onChange={(e) => setForm({ ...form, departureDate: e.target.value })} required /></div>
            <div><Label>Return date</Label><Input type="date" value={form.returnDate} onChange={(e) => setForm({ ...form, returnDate: e.target.value })} required /></div>
          </div>
          <div><Label>Images</Label><ImageUploadField value={form.images} onChange={(images) => setForm({ ...form, images })} multiple /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : "Save tour"}</Button>
          </div>
        </form>
      </AdminModal>
    </PageTransition>
  );
}
