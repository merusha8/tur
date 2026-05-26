"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { PageTransition } from "@/components/shared/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { AdminTableEmpty, AdminTableLoading } from "@/components/admin/admin-table-empty";

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "USER" | "ADMIN";
  banned: boolean;
  createdAt: string;
};

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await adminApi.users()).data as User[],
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: "USER" | "ADMIN" }) => adminApi.updateUser(id, { role }),
    onSuccess: () => {
      toast.success("User role updated");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Failed to update role"),
  });

  const banMutation = useMutation({
    mutationFn: ({ id, banned }: { id: string; banned: boolean }) => adminApi.banUser(id, banned),
    onSuccess: () => {
      toast.success("User status updated");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message || "Failed to update ban status"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      toast.success("User deleted");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message || "Failed to delete user"),
  });

  return (
    <PageTransition>
      <h1 className="text-3xl font-bold">Users</h1>
      <Card className="mt-6">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Joined</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <AdminTableLoading colSpan={6} />
              ) : users.length === 0 ? (
                  <AdminTableEmpty colSpan={6} message="No users found." />
                ) : users.map((u) => (
                  <tr key={u.id} className={`border-b last:border-0 ${u.banned ? "bg-red-50/50" : ""}`}>
                    <td className="p-4 font-medium">{u.firstName} {u.lastName}</td>
                    <td className="p-4">{u.email}</td>
                    <td className="p-4">
                      <select
                        className="rounded-lg border px-2 py-1 text-xs"
                        value={u.role}
                        disabled={u.role === "ADMIN"}
                        onChange={(e) => roleMutation.mutate({ id: u.id, role: e.target.value as "USER" | "ADMIN" })}
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="p-4">
                      {u.banned ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Banned</span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>
                      )}
                    </td>
                    <td className="p-4">{formatDate(u.createdAt)}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {u.role !== "ADMIN" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => banMutation.mutate({ id: u.id, banned: !u.banned })}
                              disabled={banMutation.isPending}
                            >
                              {u.banned ? "Unban" : "Ban"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500"
                              onClick={() => {
                                if (confirm(`Delete ${u.email}? This removes all their bookings.`)) {
                                  deleteMutation.mutate(u.id);
                                }
                              }}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
