"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageTransition } from "@/components/shared/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin } from "lucide-react";
import { publicApi } from "@/lib/api";
import { toast } from "sonner";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", subject: "", message: "" });

  const { data: contactInfo, isLoading } = useQuery({
    queryKey: ["contact-info"],
    queryFn: async () => (await publicApi.getContactInfo()).data as { email: string; phone: string; address: string },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await publicApi.submitContact(form);
      toast.success("Message sent! We'll reply within 24 hours.");
      setForm({ firstName: "", lastName: "", email: "", subject: "", message: "" });
    } catch {
      toast.error("Failed to send message. Is the API running?");
    } finally {
      setLoading(false);
    }
  };

  const contactItems = [
    { icon: Mail, label: "Email", value: contactInfo?.email },
    { icon: Phone, label: "Phone", value: contactInfo?.phone },
    { icon: MapPin, label: "Office", value: contactInfo?.address },
  ];

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1200px] px-6 py-16 lg:px-8">
        <h1 className="text-4xl font-bold text-[#112211]">Contact Us</h1>
        <p className="mt-2 text-gray-500">We&apos;d love to hear from you</p>

        <div className="mt-12 grid gap-12 lg:grid-cols-2">
          <form onSubmit={handleSubmit} className="space-y-5 rounded-[24px] border border-gray-100 bg-white p-8 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>First Name</Label><Input className="mt-1" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></div>
              <div><Label>Last Name</Label><Input className="mt-1" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></div>
            </div>
            <div><Label>Email</Label><Input className="mt-1" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            <div><Label>Subject</Label><Input className="mt-1" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required /></div>
            <div><Label>Message</Label><textarea className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-[#8DD3BB] focus:outline-none focus:ring-2 focus:ring-[#8DD3BB]/30" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required /></div>
            <Button type="submit" size="lg" disabled={loading}>{loading ? "Sending..." : "Send Message"}</Button>
          </form>

          <div className="space-y-6">
            {contactItems.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-4 rounded-[24px] border border-gray-100 bg-white p-6">
                <div className="rounded-xl bg-[#8DD3BB]/20 p-3"><Icon className="h-5 w-5 text-[#8DD3BB]" /></div>
                <div><p className="text-sm text-gray-500">{label}</p><p className="font-medium">{isLoading ? "Loading..." : value || "—"}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
