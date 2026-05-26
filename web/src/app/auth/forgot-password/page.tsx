"use client";



import { useState } from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { authApi } from "@/lib/api";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { PageTransition } from "@/components/shared/page-transition";

import { toast } from "sonner";



export default function ForgotPasswordPage() {

  const router = useRouter();

  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    setLoading(true);

    try {

      await authApi.forgotPassword(email);

      toast.success("If the email exists, a reset code was sent.");

      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);

    } catch {

      toast.error("Something went wrong");

    } finally {

      setLoading(false);

    }

  };



  return (

    <PageTransition>

      <h1 className="text-3xl font-bold">Forgot your password?</h1>

      <p className="mt-2 text-gray-500">Enter your email and we&apos;ll send you a reset code.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">

        <div><Label>Email</Label><Input className="mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading ? "Sending..." : "Submit"}</Button>

      </form>

      <p className="mt-6 text-center text-sm"><Link href="/auth/login" className="text-[#8DD3BB] hover:underline">Back to login</Link></p>

    </PageTransition>

  );

}

