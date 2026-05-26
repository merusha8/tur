"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { PageTransition } from "@/components/shared/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminModal } from "@/components/admin/admin-modal";
import { ImageUploadField } from "@/components/admin/image-upload";
import { toast } from "sonner";
import { AdminTableEmpty, AdminTableLoading } from "@/components/admin/admin-table-empty";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Destination } from "@/types";

const emptyForm = {
  name: "",
  country: "",
  description: "",
  heroImage: [] as string[],
  categories: "",
  rating: 4.5,
  reviewCount: 0,
  featured: false,
  cityId: "",
};

type FormOptions = {
  cities: { id: string; name: string; countryId: string }[];
  countries: { id: string; name: string }[];
};

export default function AdminDestinationsPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: destinations = [], isLoading } = useQuery({
    queryKey: ["admin-destinations"],
    queryFn: async () => (await adminApi.destinations()).data as Destination[],
  });

  const { data: options } = useQuery({
    queryKey: ["admin-form-options"],
    queryFn: async () => (await adminApi.formOptions()).data as FormOptions,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        country: form.country,
        description: form.description,
        heroImage: form.heroImage[0] || "",
        images: form.heroImage,
        categories: form.categories.split(",").map((s) => s.trim()).filter(Boolean),
        rating: Number(form.rating),
        reviewCount: Number(form.reviewCount),
        featured: form.featured,
        cityId: form.cityId || undefined,
      };
      if (editId) return adminApi.updateDestination(editId, payload);
      return adminApi.createDestination(payload);
    },
    onSuccess: () => {
      toast.success(editId ? "Destination updated" : "Destination created");
      qc.invalidateQueries({ queryKey: ["admin-destinations"] });
      setModalOpen(false);
      setEditId(null);
      setForm(emptyForm);
    },
    onError: () => toast.error("Failed to save destination"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteDestination(id),
    onSuccess: () => {
      toast.success("Destination deleted");
      qc.invalidateQueries({ queryKey: ["admin-destinations"] });
    },
    onError: () => toast.error("Failed to delete destination"),
  });

  const openEdit = (d: Destination) => {
    setEditId(d.id);
    setForm({
      name: d.name,
      country: d.country,
      description: d.description || "",
      heroImage: d.heroImage ? [d.heroImage] : [],
      categories: (d.categories || []).join(", "),
      rating: d.rating,
      reviewCount: d.reviewCount,
      featured: d.featured ?? false,
      cityId: "",
    });
    setModalOpen(true);
  };

  return (
    <PageTransition>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Destinations</h1>
        <div className="flex gap-2">
          <Link href="/destinations"><Button variant="outline">View on site</Button></Link>
          <Button onClick={() => { setEditId(null); setForm(emptyForm); setModalOpen(true); }}>
            <Plus className="mr-1 h-4 w-4" /> Add destination
          </Button>
        </div>
      </div>
      <Card className="mt-6 rounded-[24px]">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-gray-50 text-left text-gray-500"><th className="p-4">Name</th><th className="p-4">Country</th><th className="p-4">Rating</th><th className="p-4">Featured</th><th className="p-4">Actions</th></tr></thead>
            <tbody>
              {isLoading ? (
                <AdminTableLoading colSpan={5} />
              ) : destinations.length === 0 ? (
                <AdminTableEmpty colSpan={5} message="No destinations found." />
              ) : destinations.map((d) => (
                  <tr key={d.id} className="border-b last:border-0">
                    <td className="p-4 font-medium">{d.name}</td>
                    <td className="p-4">{d.country}</td>
                    <td className="p-4">{d.rating}</td>
                    <td className="p-4">{d.featured ? "Yes" : "No"}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Link href={`/destinations/${d.slug}`} className="text-[#8DD3BB] hover:underline">View</Link>
                        <Button size="sm" variant="outline" onClick={() => openEdit(d)}><Pencil className="h-3 w-3" /></Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteMutation.mutate(d.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <AdminModal open={modalOpen} title={editId ? "Edit destination" : "Add destination"} onClose={() => setModalOpen(false)}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}>
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><Label>Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required /></div>
          <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
          <div><Label>Linked city (optional)</Label>
            <select className="mt-1 w-full rounded-lg border px-3 py-2" value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })}>
              <option value="">None</option>
              {options?.cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Rating</Label><Input type="number" step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} /></div>
            <div><Label>Review count</Label><Input type="number" value={form.reviewCount} onChange={(e) => setForm({ ...form, reviewCount: Number(e.target.value) })} /></div>
          </div>
          <div><Label>Categories (comma-separated)</Label><Input value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured</label>
          <div><Label>Hero image</Label><ImageUploadField value={form.heroImage} onChange={(heroImage) => setForm({ ...form, heroImage })} /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saveMutation.isPending}>Save</Button>
          </div>
        </form>
      </AdminModal>
    </PageTransition>
  );
}
