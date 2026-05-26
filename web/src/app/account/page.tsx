"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import { PageTransition } from "@/components/shared/page-transition";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { formatDate } from "@/lib/utils";

const FIELD_LINKS: Record<string, string> = {
  Name: "/account/settings",
  Email: "/account/settings",
  Password: "/auth/forgot-password",
  "Phone number": "/account/settings",
  Address: "/account/settings",
  "Date of birth": "/account/settings",
};

export default function AccountPage() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await usersApi.getProfile()).data,
  });

  const fields = [
    { label: "Name", value: profile ? `${profile.firstName} ${profile.lastName}` : "—" },
    { label: "Email", value: profile?.email },
    { label: "Password", value: "••••••••" },
    { label: "Phone number", value: profile?.phone || "Not set" },
    { label: "Address", value: profile?.address || "Not set" },
    { label: "Date of birth", value: profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : "Not set" },
  ];

  return (
    <PageTransition>
      <h2 className="text-2xl font-bold">Account</h2>
      {isLoading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="mt-6 divide-y rounded-xl border bg-white">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center justify-between px-6 py-4">
              <div><p className="text-sm text-gray-500">{f.label}</p><p className="font-medium">{f.value}</p></div>
              <Link href={FIELD_LINKS[f.label] || "/account/settings"}>
                <Button variant="ghost" size="sm"><Pencil className="mr-1 h-4 w-4" /> Change</Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
