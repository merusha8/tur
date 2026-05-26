"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/shared/page-transition";
import { toast } from "sonner";

const schema = z.object({ email: z.string().email(), password: z.string().min(8) });

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "";
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setLoading(true);
    try {
      const res = await authApi.login({ ...data, rememberMe });
      setAuth(res.data.user, res.data.accessToken, rememberMe);
      toast.success("Welcome back!");
      if (redirect && redirect.startsWith("/")) router.push(redirect);
      else router.push(res.data.user.role === "ADMIN" ? "/admin" : "/account");
    } catch {
      toast.error("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <h1 className="text-3xl font-bold">Login</h1>
      <p className="mt-2 text-gray-500">Welcome back to Meru Tour</p>
      <div className="mt-4 rounded-xl bg-[#8DD3BB]/10 p-4 text-sm text-[#112211]">
        <p className="font-semibold">Demo accounts</p>
        <p className="mt-1">User: john@example.com / User12345!</p>
        <p>Admin: admin@merutour.com / Admin123!</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div><Label>Email</Label><Input className="mt-1" type="email" placeholder="you@example.com" {...register("email")} />{errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}</div>
        <div><Label>Password</Label><Input className="mt-1" type="password" placeholder="••••••••" {...register("password")} />{errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}</div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /> Remember me (30 days)
          </label>
          <Link href="/auth/forgot-password" className="text-red-500 hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading ? "Logging in..." : "Login"}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">Don&apos;t have an account? <Link href="/auth/register" className="font-medium text-[#8DD3BB] hover:underline">Sign up</Link></p>
    </PageTransition>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
