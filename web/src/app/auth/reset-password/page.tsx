"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/shared/page-transition";
import { toast } from "sonner";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.resetPassword({ email, code, password });
      toast.success("Password updated. You can sign in now.");
      router.push("/auth/login");
    } catch {
      toast.error("Invalid code or password too weak");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <h1 className="text-3xl font-bold">Reset password</h1>
      <p className="mt-2 text-gray-500">Enter the code from your email and choose a new password.</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div><Label>Email</Label><Input className="mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div><Label>Reset code</Label><Input className="mt-1" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" required /></div>
        <div><Label>New password</Label><Input className="mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required /></div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading ? "Saving..." : "Update password"}</Button>
      </form>
      <p className="mt-6 text-center text-sm"><Link href="/auth/login" className="text-[#8DD3BB] hover:underline">Back to login</Link></p>
    </PageTransition>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
