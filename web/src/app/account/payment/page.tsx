"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { paymentsApi } from "@/lib/api";
import { PageTransition } from "@/components/shared/page-transition";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, CreditCard, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export default function PaymentPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ cardNumber: "", expiry: "", cvv: "", name: "" });

  const { data: config } = useQuery({
    queryKey: ["payment-config"],
    queryFn: async () => (await paymentsApi.getConfig()).data as { stripeConfigured: boolean; devMode: boolean },
  });

  const { data: methods = [], isLoading } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => (await paymentsApi.getMethods()).data as PaymentMethod[],
  });

  const addMutation = useMutation({
    mutationFn: () => paymentsApi.addMethod({
      brand: form.cardNumber.startsWith("4") ? "Visa" : "Mastercard",
      last4: form.cardNumber.replace(/\s/g, "").slice(-4) || "0000",
      expMonth: parseInt(form.expiry.split("/")[0]) || 12,
      expYear: parseInt("20" + (form.expiry.split("/")[1] || "28")),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      setShowModal(false);
      setForm({ cardNumber: "", expiry: "", cvv: "", name: "" });
      toast.success("Card saved");
    },
    onError: () => toast.error("Could not save card"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.deleteMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Card removed");
    },
  });

  const canAddCard = config?.stripeConfigured || config?.devMode;

  return (
    <PageTransition>
      <h2 className="text-2xl font-bold">Payment methods</h2>

      {config?.stripeConfigured ? (
        <p className="mt-2 text-sm text-gray-500">
          Cards are tokenized securely at checkout via Stripe. Saved methods below are used for reference only.
        </p>
      ) : config?.devMode ? (
        <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          Development mode: you can save test cards locally. Real payments use checkout confirmation without Stripe keys.
        </p>
      ) : (
        <p className="mt-2 rounded-xl bg-gray-100 p-3 text-sm text-gray-600">
          Online card storage is not configured. Complete bookings via{" "}
          <Link href="/account/bookings" className="text-[#8DD3BB] hover:underline">checkout</Link> when paying.
        </p>
      )}

      {isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-[140px] animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : methods.length === 0 && !canAddCard ? (
        <EmptyState
          icon={CreditCard}
          className="mt-6"
          title="No saved cards"
          description="Complete bookings via checkout. In development mode you can add test cards when enabled."
          actionLabel="View bookings"
          actionHref="/account/bookings"
        />
      ) : methods.length === 0 && canAddCard ? (
        <EmptyState
          icon={CreditCard}
          className="mt-6"
          title="No cards saved yet"
          description="Add a test card for demo purposes."
          actionLabel="Add card"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {methods.map((m) => (
            <Card key={m.id} className="bg-[#8DD3BB] text-[#112211]">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <CreditCard className="h-8 w-8" />
                  <button type="button" onClick={() => deleteMutation.mutate(m.id)} className="opacity-70 hover:opacity-100">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-4 text-lg font-bold">•••• •••• •••• {m.last4}</p>
                <p className="text-sm opacity-70">{m.brand} · Exp {m.expMonth}/{m.expYear}</p>
              </CardContent>
            </Card>
          ))}
          {canAddCard && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex min-h-[140px] items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-[#8DD3BB] hover:text-[#8DD3BB]"
            >
              <Plus className="h-8 w-8" />
            </button>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Add a card</h3>
                <button type="button" onClick={() => setShowModal(false)}>✕</button>
              </div>
              {config?.devMode && !config.stripeConfigured && (
                <p className="text-xs text-amber-700">Dev only — do not enter real card numbers.</p>
              )}
              <div><Label>Card Number</Label><Input className="mt-1" value={form.cardNumber} onChange={(e) => setForm({ ...form, cardNumber: e.target.value })} placeholder="4242 4242 4242 4242" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Expiry</Label><Input className="mt-1" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} placeholder="MM/YY" /></div>
                <div><Label>CVV</Label><Input className="mt-1" value={form.cvv} onChange={(e) => setForm({ ...form, cvv: e.target.value })} placeholder="123" /></div>
              </div>
              <div><Label>Name on Card</Label><Input className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>
                {addMutation.isPending ? "Saving..." : "Save card"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </PageTransition>
  );
}
