"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/shared/page-transition";
import { toast } from "sonner";

const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setLoading(true);
    try {
      const res = await authApi.register({ email: data.email, password: data.password, firstName: data.firstName, lastName: data.lastName, phone: data.phone });
      if (res.data.demoMode) {
        toast.success("Verification email sent (demo mode: account is ready to login)");
        router.push("/auth/login");
      } else {
        toast.success("Verification email sent");
        router.push(`/auth/verify?email=${encodeURIComponent(data.email)}`);
      }
    } catch {
      toast.error("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <h1 className="text-3xl font-bold">Sign up</h1>
      <p className="mt-2 text-gray-500">Let&apos;s get you started so you can start booking.</p>
      <div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
        Demo mode: without SMTP, new accounts are auto-verified. Or use <Link href="/auth/login" className="font-medium underline">demo login</Link>.
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>First Name</Label><Input className="mt-1" {...register("firstName")} /></div>
          <div><Label>Last Name</Label><Input className="mt-1" {...register("lastName")} /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Email</Label><Input className="mt-1" type="email" {...register("email")} /></div>
          <div><Label>Phone</Label><Input className="mt-1" {...register("phone")} /></div>
        </div>
        <div><Label>Password</Label><Input className="mt-1" type="password" {...register("password")} /></div>
        <div><Label>Confirm Password</Label><Input className="mt-1" type="password" {...register("confirmPassword")} />{errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}</div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" required /> I agree to the{" "}
          <Link href="/terms" className="text-[#8DD3BB] hover:underline">Terms</Link> and{" "}
          <Link href="/privacy" className="text-[#8DD3BB] hover:underline">Privacy Policy</Link>
        </label>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading ? "Creating..." : "Create account"}</Button>
      </form>
      <p className="mt-6 text-center text-sm">Already have an account? <Link href="/auth/login" className="font-medium text-[#8DD3BB] hover:underline">Login</Link></p>
    </PageTransition>
  );
}
