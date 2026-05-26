"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import { PageTransition } from "@/components/shared/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await usersApi.getProfile()).data as {
      firstName: string;
      lastName: string;
      phone?: string;
      address?: string;
      email: string;
    },
  });

  useEffect(() => {
    if (profile) {
      setForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        address: profile.address || "",
      });
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: () => usersApi.updateProfile(form),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      const refreshed = await usersApi.getProfile();
      if (token) updateUser(refreshed.data, token);
      toast.success("Settings saved!");
    },
    onError: () => toast.error("Failed to save settings"),
  });

  return (
    <PageTransition>
      <h2 className="text-2xl font-bold">Settings</h2>
      {isLoading ? (
        <p className="mt-6 text-gray-500">Loading profile...</p>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="mt-6 max-w-lg space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>First Name</Label><Input className="mt-1" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
            <div><Label>Last Name</Label><Input className="mt-1" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
          </div>
          <div><Label>Email</Label><Input className="mt-1" value={profile?.email || ""} disabled /></div>
          <div><Label>Phone</Label><Input className="mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>Address</Label><Input className="mt-1" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save Changes"}</Button>
        </form>
      )}
    </PageTransition>
  );
}
