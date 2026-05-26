"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { toast } from "sonner";

export function Newsletter() {
  const [email, setEmail] = useState("");

  const subscribe = useMutation({
    mutationFn: () => publicApi.subscribeNewsletter(email),
    onSuccess: () => {
      toast.success("Subscribed! You'll receive hot tour deals by email.");
      setEmail("");
    },
    onError: () => toast.error("Subscription failed. Try again later."),
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-[#8DD3BB] p-8 md:flex-row md:p-12">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-[#112211]">Subscribe Newsletter</h3>
          <p className="mt-2 text-[#112211]/70">Get the latest deals, travel tips and exclusive offers delivered to your inbox.</p>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              subscribe.mutate();
            }}
          >
            <Input
              type="email"
              placeholder="Your email"
              className="max-w-xs bg-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button variant="secondary" type="submit" disabled={subscribe.isPending}>
              <Mail className="h-4 w-4" /> {subscribe.isPending ? "..." : "Subscribe"}
            </Button>
          </form>
        </div>
        <div className="text-8xl">📬</div>
      </div>
    </section>
  );
}
