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



function VerifyForm() {

  const router = useRouter();

  const params = useSearchParams();

  const email = params.get("email") || "";

  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);

  const [resending, setResending] = useState(false);



  const handleVerify = async () => {

    if (!email) {

      toast.error("Email missing — register again");

      return;

    }

    setLoading(true);

    try {

      await authApi.verify({ email, code });

      toast.success("Email verified!");

      router.push("/auth/login");

    } catch {

      toast.error("Invalid code");

    } finally {

      setLoading(false);

    }

  };



  const handleResend = async () => {

    if (!email) return;

    setResending(true);

    try {

      await authApi.resendVerification(email);

      toast.success("New code sent — check email or API logs");

    } catch {

      toast.error("Could not resend code");

    } finally {

      setResending(false);

    }

  };



  return (

    <PageTransition>

      <h1 className="text-3xl font-bold">Verify code</h1>

      <p className="mt-2 text-gray-500">We sent a verification code to {email || "your email"}</p>

      <div className="mt-8 space-y-4">

        <div><Label>Verification Code</Label><Input className="mt-1" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" /></div>

        <Button className="w-full" size="lg" onClick={handleVerify} disabled={loading}>{loading ? "Verifying..." : "Verify"}</Button>

        <p className="text-center text-sm">

          <button type="button" className="text-[#8DD3BB] hover:underline disabled:opacity-50" onClick={handleResend} disabled={resending || !email}>

            {resending ? "Sending..." : "Resend code"}

          </button>

        </p>

      </div>

      <p className="mt-6 text-center text-sm"><Link href="/auth/login" className="text-gray-500 hover:underline">Back to login</Link></p>

    </PageTransition>

  );

}



export default function VerifyPage() {

  return (

    <Suspense fallback={<div className="text-gray-500">Loading...</div>}>

      <VerifyForm />

    </Suspense>

  );

}

