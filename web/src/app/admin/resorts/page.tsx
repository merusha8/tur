"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { PageTransition } from "@/components/shared/page-transition";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminModal } from "@/components/admin/admin-modal";
import { ImageUploadField } from "@/components/admin/image-upload";
import { toast } from "sonner";
import { AdminListSkeleton } from "@/components/admin/admin-table-empty";
import { Pencil, Plus, Trash2, Umbrella } from "lucide-react";

type Resort = {
  id: string;
  name: string;
  beachType: string;
  description: string;
  images: string[];
  rating: number;
  city: { id: string; name: string; country?: { name: string } };
  _count?: { hotels: number };
};

const emptyForm = { cityId: "", name: "", beachType: "Sandy", description: "", images: [] as string[], rating: 4.5 };

export default function AdminResortsPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: resorts = [], isLoading } = useQuery({
    queryKey: ["admin-resorts"],
    queryFn: async () => (await adminApi.resorts()).data as Resort[],
  });

  const { data: options } = useQuery({
    queryKey: ["admin-form-options"],
    queryFn: async () => (await adminApi.formOptions()).data as { cities: { id: string; name: string }[] },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        cityId: form.cityId,
        name: form.name,
        beachType: form.beachType,
        description: form.description,
        images: form.images,
        rating: Number(form.rating),
      };
      if (editId) return adminApi.updateResort(editId, payload);
      return adminApi.createResort(payload);
    },
    onSuccess: () => {
      toast.success(editId ? "Resort updated" : "Resort created");
      qc.invalidateQueries({ queryKey: ["admin-resorts"] });
      setModalOpen(false);
      setEditId(null);
      setForm(emptyForm);
    },
    onError: () => toast.error("Failed to save resort"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteResort(id),
    onSuccess: () => {
      toast.success("Resort deleted");
      qc.invalidateQueries({ queryKey: ["admin-resorts"] });
    },
    onError: () => toast.error("Cannot delete resort with linked hotels"),
  });

  const openEdit = (r: Resort) => {
    setEditId(r.id);
    setForm({
      cityId: r.city.id,
      name: r.name,
      beachType: r.beachType,
      description: r.description,
      images: r.images || [],
      rating: r.rating,
    });
    setModalOpen(true);
  };

  return (
    <PageTransition>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Resorts</h1>
        <Button onClick={() => { setEditId(null); setForm(emptyForm); setModalOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Add resort</Button>
      </div>
      {isLoading ? (
        <AdminListSkeleton count={4} />
      ) : resorts.length === 0 ? (
        <EmptyState icon={Umbrella} className="mt-6" title="No resorts yet" description="Create beach resorts and link them to cities and hotels." actionLabel="Add resort" onAction={() => { setEditId(null); setForm(emptyForm); setModalOpen(true); }} />
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {resorts.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{r.name}</p>
                    <p className="text-sm text-gray-500">{r.city.name}{r.city.country ? `, ${r.city.country.name}` : ""} · {r.beachType}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">{r.description}</p>
                    <p className="mt-1 text-xs text-gray-400">Rating {r.rating} · {r._count?.hotels ?? 0} hotels</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-red-500" onClick={() => deleteMutation.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit resort" : "New resort"}>
        <div className="space-y-4">
          <div>
            <Label>City</Label>
            <select className="mt-1 w-full rounded-lg border px-3 py-2" value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })}>
              <option value="">Select city</option>
              {(options?.cities ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><Label>Name</Label><Input className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Beach type</Label><Input className="mt-1" value={form.beachType} onChange={(e) => setForm({ ...form, beachType: e.target.value })} /></div>
          <div><Label>Description</Label><Input className="mt-1" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><Label>Rating</Label><Input className="mt-1" type="number" step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: +e.target.value })} /></div>
          <div><Label>Images</Label><ImageUploadField value={form.images} onChange={(images) => setForm({ ...form, images })} multiple /></div>
          <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.cityId || !form.name}>
            {saveMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </AdminModal>
    </PageTransition>
  );
}
