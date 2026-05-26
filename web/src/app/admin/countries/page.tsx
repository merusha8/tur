"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { PageTransition } from "@/components/shared/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminModal } from "@/components/admin/admin-modal";
import { toast } from "sonner";
import { AdminTableEmpty, AdminTableLoading } from "@/components/admin/admin-table-empty";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

type Country = {
  id: string;
  name: string;
  code: string;
  flag: string;
  currency: string;
  language: string;
  description: string;
  visaRequired: boolean;
  _count?: { cities: number; tours: number };
};

const emptyForm = {
  name: "",
  code: "",
  flag: "🌍",
  currency: "USD",
  language: "English",
  description: "",
  visaRequired: false,
};

export default function AdminCountriesPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: countries = [], isLoading } = useQuery({
    queryKey: ["admin-countries"],
    queryFn: async () => (await adminApi.countries()).data as Country[],
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, code: form.code.toUpperCase() };
      if (editId) return adminApi.updateCountry(editId, payload);
      return adminApi.createCountry(payload);
    },
    onSuccess: () => {
      toast.success(editId ? "Country updated" : "Country created");
      qc.invalidateQueries({ queryKey: ["admin-countries"] });
      qc.invalidateQueries({ queryKey: ["admin-form-options"] });
      setModalOpen(false);
      setEditId(null);
      setForm(emptyForm);
    },
    onError: () => toast.error("Failed to save country"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCountry(id),
    onSuccess: () => {
      toast.success("Country deleted");
      qc.invalidateQueries({ queryKey: ["admin-countries"] });
    },
    onError: () => toast.error("Cannot delete country with linked data"),
  });

  const openEdit = (c: Country) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      code: c.code,
      flag: c.flag,
      currency: c.currency,
      language: c.language,
      description: c.description,
      visaRequired: c.visaRequired,
    });
    setModalOpen(true);
  };

  return (
    <PageTransition>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Countries</h1>
        <Button onClick={() => { setEditId(null); setForm(emptyForm); setModalOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" /> Add country
        </Button>
      </div>

      <Card className="mt-6 rounded-[24px]">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-gray-50 text-left text-gray-500"><th className="p-4">Flag</th><th className="p-4">Name</th><th className="p-4">Code</th><th className="p-4">Currency</th><th className="p-4">Cities</th><th className="p-4">Actions</th></tr></thead>
            <tbody>
              {isLoading ? (
                <AdminTableLoading colSpan={6} />
              ) : countries.length === 0 ? (
                <AdminTableEmpty colSpan={6} message="No countries found." />
              ) : countries.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="p-4 text-xl">{c.flag}</td>
                    <td className="p-4 font-medium">{c.name}</td>
                    <td className="p-4">{c.code}</td>
                    <td className="p-4">{c.currency}</td>
                    <td className="p-4">{c._count?.cities ?? 0}</td>
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

      <AdminModal open={modalOpen} title={editId ? "Edit country" : "Add country"} onClose={() => setModalOpen(false)}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}>
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} maxLength={3} required /></div>
            <div><Label>Flag (emoji)</Label><Input value={form.flag} onChange={(e) => setForm({ ...form, flag: e.target.value })} /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
            <div><Label>Language</Label><Input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} /></div>
          </div>
          <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.visaRequired} onChange={(e) => setForm({ ...form, visaRequired: e.target.checked })} /> Visa required</label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saveMutation.isPending}>Save</Button>
          </div>
        </form>
      </AdminModal>
    </PageTransition>
  );
}
