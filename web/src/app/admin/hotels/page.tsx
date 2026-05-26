"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

type FormOptions = {
  cities: { id: string; name: string; countryId: string }[];
};

const emptyForm = {
  cityId: "",
  name: "",
  stars: 4,
  rating: 4.5,
  pricePerNight: 0,
  mealType: "All Inclusive",
  amenities: "Wi-Fi, Pool, Spa",
  images: [] as string[],
};

export default function AdminHotelsPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [priceEdit, setPriceEdit] = useState<{ id: string; price: string } | null>(null);

  const { data: hotels = [], isLoading } = useQuery({
    queryKey: ["admin-hotels"],
    queryFn: async () => (await adminApi.hotels()).data,
  });

  const { data: options } = useQuery({
    queryKey: ["admin-form-options"],
    queryFn: async () => (await adminApi.formOptions()).data as FormOptions,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        cityId: form.cityId,
        name: form.name,
        stars: Number(form.stars),
        rating: Number(form.rating),
        pricePerNight: Number(form.pricePerNight),
        mealType: form.mealType,
        amenities: form.amenities.split(",").map((s) => s.trim()).filter(Boolean),
        images: form.images,
      };
      if (editId) return adminApi.updateHotel(editId, payload);
      return adminApi.createHotel(payload);
    },
    onSuccess: () => {
      toast.success(editId ? "Hotel updated" : "Hotel created");
      qc.invalidateQueries({ queryKey: ["admin-hotels"] });
      qc.invalidateQueries({ queryKey: ["admin-form-options"] });
      setModalOpen(false);
      setEditId(null);
      setForm(emptyForm);
    },
    onError: () => toast.error("Failed to save hotel"),
  });

  const priceMutation = useMutation({
    mutationFn: ({ id, pricePerNight }: { id: string; pricePerNight: number }) =>
      adminApi.updateHotel(id, { pricePerNight }),
    onSuccess: () => {
      toast.success("Price updated");
      qc.invalidateQueries({ queryKey: ["admin-hotels"] });
      setPriceEdit(null);
    },
    onError: () => toast.error("Failed to update price"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteHotel(id),
    onSuccess: () => {
      toast.success("Hotel deleted");
      qc.invalidateQueries({ queryKey: ["admin-hotels"] });
    },
    onError: () => toast.error("Cannot delete hotel with bookings"),
  });

  const openEdit = (h: { id: string; cityId: string; name: string; stars: number; rating: number; pricePerNight: number; mealType: string; amenities: string[]; images: string[] }) => {
    setEditId(h.id);
    setForm({
      cityId: h.cityId,
      name: h.name,
      stars: h.stars,
      rating: h.rating,
      pricePerNight: h.pricePerNight,
      mealType: h.mealType,
      amenities: h.amenities.join(", "),
      images: h.images || [],
    });
    setModalOpen(true);
  };

  return (
    <PageTransition>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Hotels</h1>
        <Button onClick={() => { setEditId(null); setForm(emptyForm); setModalOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" /> Add hotel
        </Button>
      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-gray-50 text-left text-gray-500"><th className="p-4">Name</th><th className="p-4">Location</th><th className="p-4">Rating</th><th className="p-4">Price/Night</th><th className="p-4">Actions</th></tr></thead>
            <tbody>
              {isLoading ? (
                <AdminTableLoading colSpan={5} />
              ) : hotels.length === 0 ? (
                  <AdminTableEmpty colSpan={5} message="No hotels found." />
                ) : hotels.map((h: { id: string; cityId: string; name: string; city?: { name: string; country?: { name: string } }; rating: number; pricePerNight: number; reviewsCount: number; stars: number; mealType: string; amenities: string[]; images: string[] }) => (
                  <tr key={h.id} className="border-b last:border-0">
                    <td className="p-4 font-medium">{h.name}</td>
                    <td className="p-4">{h.city?.name}{h.city?.country?.name ? `, ${h.city.country.name}` : ""}</td>
                    <td className="p-4">{h.rating} ({h.stars}★)</td>
                    <td className="p-4">
                      {priceEdit?.id === h.id ? (
                        <div className="flex items-center gap-1">
                          <Input className="h-8 w-24" value={priceEdit.price} onChange={(e) => setPriceEdit({ id: h.id, price: e.target.value })} />
                          <Button size="sm" onClick={() => priceMutation.mutate({ id: h.id, pricePerNight: Number(priceEdit.price) })}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setPriceEdit(null)}>×</Button>
                        </div>
                      ) : (
                        <button type="button" className="group flex items-center gap-1 hover:text-[#8DD3BB]" onClick={() => setPriceEdit({ id: h.id, price: String(h.pricePerNight) })}>
                          {formatPrice(h.pricePerNight)} <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                        </button>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(h)}>Edit</Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteMutation.mutate(h.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </CardContent>
      </Card>

      <AdminModal open={modalOpen} title={editId ? "Edit hotel" : "Add hotel"} onClose={() => setModalOpen(false)}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}>
          <div><Label>City</Label>
            <select className="mt-1 w-full rounded-lg border px-3 py-2" value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })} required>
              <option value="">Select city</option>
              {options?.cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><Label>Stars</Label><Input type="number" min={1} max={5} value={form.stars} onChange={(e) => setForm({ ...form, stars: Number(e.target.value) })} /></div>
            <div><Label>Rating</Label><Input type="number" step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} /></div>
            <div><Label>Price per night</Label><Input type="number" value={form.pricePerNight} onChange={(e) => setForm({ ...form, pricePerNight: Number(e.target.value) })} required /></div>
          </div>
          <div><Label>Meal type</Label><Input value={form.mealType} onChange={(e) => setForm({ ...form, mealType: e.target.value })} /></div>
          <div><Label>Amenities (comma-separated)</Label><Input value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} /></div>
          <div><Label>Images</Label><ImageUploadField value={form.images} onChange={(images) => setForm({ ...form, images })} multiple /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : "Save hotel"}</Button>
          </div>
        </form>
      </AdminModal>
    </PageTransition>
  );
}
