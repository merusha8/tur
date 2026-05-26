"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useState } from "react";

type City = {
  id: string;
  countryId: string;
  name: string;
  slug: string;
  image: string;
  popular: boolean;
  airportCode?: string | null;
  country: { id: string; name: string; code: string };
};

type FormOptions = { countries: { id: string; name: string; code: string }[] };

const emptyForm = {
  countryId: "",
  name: "",
  image: [] as string[],
  popular: false,
  airportCode: "",
};

export default function AdminCitiesPage() {
  const qc = useQueryClient();
  const [countryFilter, setCountryFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: options } = useQuery({
    queryKey: ["admin-form-options"],
    queryFn: async () => (await adminApi.formOptions()).data as FormOptions,
  });

  const { data: cities = [], isLoading } = useQuery({
    queryKey: ["admin-cities", countryFilter],
    queryFn: async () => (await adminApi.cities(countryFilter || undefined)).data as City[],
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        countryId: form.countryId,
        name: form.name,
        image: form.image[0] || undefined,
        popular: form.popular,
        airportCode: form.airportCode || undefined,
      };
      if (editId) return adminApi.updateCity(editId, payload);
      return adminApi.createCity(payload);
    },
    onSuccess: () => {
      toast.success(editId ? "City updated" : "City created");
      qc.invalidateQueries({ queryKey: ["admin-cities"] });
      qc.invalidateQueries({ queryKey: ["admin-form-options"] });
      setModalOpen(false);
      setEditId(null);
      setForm(emptyForm);
    },
    onError: () => toast.error("Failed to save city"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCity(id),
    onSuccess: () => {
      toast.success("City deleted");
      qc.invalidateQueries({ queryKey: ["admin-cities"] });
    },
    onError: () => toast.error("Cannot delete city with linked data"),
  });

  const openEdit = (c: City) => {
    setEditId(c.id);
    setForm({
      countryId: c.countryId,
      name: c.name,
      image: c.image ? [c.image] : [],
      popular: c.popular,
      airportCode: c.airportCode || "",
    });
    setModalOpen(true);
  };

  return (
    <PageTransition>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Cities</h1>
        <Button onClick={() => { setEditId(null); setForm(emptyForm); setModalOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" /> Add city
        </Button>
      </div>

      <div className="mt-4">
        <select className="rounded-lg border px-3 py-2 text-sm" value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)}>
          <option value="">All countries</option>
          {options?.countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <Card className="mt-6 rounded-[24px]">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-gray-50 text-left text-gray-500"><th className="p-4">Name</th><th className="p-4">Country</th><th className="p-4">Airport</th><th className="p-4">Popular</th><th className="p-4">Actions</th></tr></thead>
            <tbody>
              {isLoading ? (
                <AdminTableLoading colSpan={5} />
              ) : cities.length === 0 ? (
                <AdminTableEmpty colSpan={5} message="No cities match this filter." />
              ) : cities.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="p-4 font-medium">{c.name}</td>
                    <td className="p-4">{c.country.name}</td>
                    <td className="p-4">{c.airportCode || "—"}</td>
                    <td className="p-4">{c.popular ? "Yes" : "No"}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(c)}><Pencil className="h-3 w-3" /></Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <AdminModal open={modalOpen} title={editId ? "Edit city" : "Add city"} onClose={() => setModalOpen(false)}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}>
          <div><Label>Country</Label>
            <select className="mt-1 w-full rounded-lg border px-3 py-2" value={form.countryId} onChange={(e) => setForm({ ...form, countryId: e.target.value })} required>
              <option value="">Select country</option>
              {options?.countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><Label>Airport code</Label><Input value={form.airportCode} onChange={(e) => setForm({ ...form, airportCode: e.target.value.toUpperCase() })} maxLength={3} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.popular} onChange={(e) => setForm({ ...form, popular: e.target.checked })} /> Popular destination</label>
          <div><Label>Cover image</Label><ImageUploadField value={form.image} onChange={(images) => setForm({ ...form, image: images })} /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saveMutation.isPending}>Save</Button>
          </div>
        </form>
      </AdminModal>
    </PageTransition>
  );
}
