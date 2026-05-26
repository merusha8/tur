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
import { Plus, Trash2 } from "lucide-react";
import type { Tour } from "@/types";

type HotTour = {
  id: string;
  tourId: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
  validFrom: string;
  validUntil: string;
  departureCity: string;
  nights: number;
  mealPlan: string;
  lastMinute: boolean;
  seatsLeft: number;
  featured: boolean;
  isActive: boolean;
  tour: Tour & { city?: { name: string }; country?: { name: string } };
};

const emptyForm = {
  tourId: "",
  originalPrice: 0,
  discountedPrice: 0,
  validFrom: "",
  validUntil: "",
  departureCity: "",
  nights: 7,
  mealPlan: "All Inclusive",
  lastMinute: false,
  featured: false,
  seatsLeft: 10,
  isActive: true,
};

export default function AdminHotToursPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: hotTours = [], isLoading } = useQuery({
    queryKey: ["admin-hot-tours"],
    queryFn: async () => (await adminApi.hotTours()).data as HotTour[],
  });

  const [tourSearch, setTourSearch] = useState("");

  const { data: options } = useQuery({
    queryKey: ["admin-form-options-tours", tourSearch],
    queryFn: async () => (await adminApi.formOptions({ tourSearch: tourSearch || undefined })).data as {
      tours: (Tour & { city?: { name: string } })[];
    },
  });

  const tours = options?.tours ?? [];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        originalPrice: Number(form.originalPrice),
        discountedPrice: Number(form.discountedPrice),
        nights: Number(form.nights),
        seatsLeft: Number(form.seatsLeft),
      };
      if (editId) return adminApi.updateHotTour(editId, payload);
      return adminApi.createHotTour(payload);
    },
    onSuccess: () => {
      toast.success(editId ? "Hot tour updated" : "Hot tour created");
      qc.invalidateQueries({ queryKey: ["admin-hot-tours"] });
      qc.invalidateQueries({ queryKey: ["admin-tours"] });
      setModalOpen(false);
      setEditId(null);
      setForm(emptyForm);
    },
    onError: () => toast.error("Failed to save hot tour"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteHotTour(id),
    onSuccess: () => {
      toast.success("Hot tour removed");
      qc.invalidateQueries({ queryKey: ["admin-hot-tours"] });
      qc.invalidateQueries({ queryKey: ["admin-tours"] });
    },
    onError: () => toast.error("Failed to delete"),
  });

  const openEdit = (ht: HotTour) => {
    setEditId(ht.id);
    setForm({
      tourId: ht.tourId,
      originalPrice: ht.originalPrice,
      discountedPrice: ht.discountedPrice,
      validFrom: ht.validFrom.slice(0, 10),
      validUntil: ht.validUntil.slice(0, 10),
      departureCity: ht.departureCity,
      nights: ht.nights,
      mealPlan: ht.mealPlan,
      lastMinute: ht.lastMinute,
      featured: ht.featured,
      seatsLeft: ht.seatsLeft,
      isActive: ht.isActive,
    });
    setModalOpen(true);
  };

  const onTourSelect = (tourId: string) => {
    const tour = tours.find((t) => t.id === tourId);
    if (!tour) return setForm({ ...form, tourId });
    setForm({
      ...form,
      tourId,
      originalPrice: tour.oldPrice || tour.price,
      discountedPrice: tour.price,
      nights: tour.duration,
      departureCity: tour.city?.name || form.departureCity,
    });
  };

  return (
    <PageTransition>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Hot Tours</h1>
        <Button onClick={() => { setEditId(null); setForm(emptyForm); setModalOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" /> Add hot tour
        </Button>
      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-gray-50 text-left text-gray-500"><th className="p-4">Tour</th><th className="p-4">Prices</th><th className="p-4">Discount</th><th className="p-4">Valid until</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr></thead>
            <tbody>
              {isLoading ? (
                <AdminTableLoading colSpan={6} />
              ) : hotTours.length === 0 ? (
                <AdminTableEmpty colSpan={6} message="No hot tours yet." />
              ) : hotTours.map((ht) => (
                  <tr key={ht.id} className="border-b last:border-0">
                    <td className="p-4 font-medium">{ht.tour?.title}{ht.featured ? " ⭐" : ""}{ht.lastMinute ? " ⚡" : ""}</td>
                    <td className="p-4"><span className="text-gray-400 line-through">{formatPrice(ht.originalPrice)}</span> → {formatPrice(ht.discountedPrice)}</td>
                    <td className="p-4">-{ht.discountPercent}%</td>
                    <td className="p-4">{formatDate(ht.validUntil)}</td>
                    <td className="p-4"><span className={`rounded-full px-2 py-0.5 text-xs ${ht.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{ht.isActive ? "Active" : "Inactive"}</span></td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(ht)}>Edit</Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => confirm("Remove hot tour?") && deleteMutation.mutate(ht.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <AdminModal open={modalOpen} title={editId ? "Edit hot tour" : "Add hot tour"} onClose={() => setModalOpen(false)}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}>
          <div><Label>Tour</Label>
            <Input className="mb-2" placeholder="Search tours..." value={tourSearch} onChange={(e) => setTourSearch(e.target.value)} />
            <select className="mt-1 w-full rounded-lg border px-3 py-2" value={form.tourId} onChange={(e) => onTourSelect(e.target.value)} required disabled={!!editId}>
              <option value="">Select tour</option>
              {tours.map((t) => <option key={t.id} value={t.id}>{t.title} — {t.city?.name}</option>)}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Original price</Label><Input type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) })} required /></div>
            <div><Label>Discounted price</Label><Input type="number" value={form.discountedPrice} onChange={(e) => setForm({ ...form, discountedPrice: Number(e.target.value) })} required /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Valid from</Label><Input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} required /></div>
            <div><Label>Valid until</Label><Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} required /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><Label>Departure city</Label><Input value={form.departureCity} onChange={(e) => setForm({ ...form, departureCity: e.target.value })} required /></div>
            <div><Label>Nights</Label><Input type="number" value={form.nights} onChange={(e) => setForm({ ...form, nights: Number(e.target.value) })} required /></div>
            <div><Label>Seats left</Label><Input type="number" value={form.seatsLeft} onChange={(e) => setForm({ ...form, seatsLeft: Number(e.target.value) })} /></div>
          </div>
          <div><Label>Meal plan</Label><Input value={form.mealPlan} onChange={(e) => setForm({ ...form, mealPlan: e.target.value })} /></div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.lastMinute} onChange={(e) => setForm({ ...form, lastMinute: e.target.checked })} /> Last minute</label>
            {editId && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </form>
      </AdminModal>
    </PageTransition>
  );
}
