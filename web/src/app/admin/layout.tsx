"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, CalendarCheck, Plane, Hotel, CreditCard, LogOut, Menu, MapPin, Palmtree, Flame, Globe, Building2,
  MessageSquare, Mail, Star, Umbrella,
} from "lucide-react";
import { useState } from "react";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/admin/countries", label: "Countries", icon: Globe },
  { href: "/admin/cities", label: "Cities", icon: Building2 },
  { href: "/admin/destinations", label: "Destinations", icon: MapPin },
  { href: "/admin/tours", label: "Tours", icon: Palmtree },
  { href: "/admin/hot-tours", label: "Hot Tours", icon: Flame },
  { href: "/admin/flights", label: "Flights", icon: Plane },
  { href: "/admin/hotels", label: "Hotels", icon: Hotel },
  { href: "/admin/resorts", label: "Resorts", icon: Umbrella },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/contact", label: "Contact", icon: MessageSquare },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isAdmin, logout, user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) router.push("/auth/login");
    else if (!isAdmin()) router.push("/account");
  }, [isAuthenticated, isAdmin, router]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className={cn("fixed inset-y-0 left-0 z-40 w-64 transform bg-[#112211] text-white transition-transform lg:static lg:translate-x-0", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-16 items-center px-6 font-bold text-xl">meru<span className="text-[#8DD3BB]">admin</span></div>
        <nav className="space-y-1 px-3">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
              className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === href ? "bg-[#8DD3BB] text-[#112211]" : "text-white/70 hover:bg-white/10 hover:text-white"
              )}><Icon className="h-4 w-4" /> {label}</Link>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-white/10 p-4">
          <p className="text-sm text-white/60">{user?.email}</p>
          <button onClick={() => { logout(); router.push("/"); }} className="mt-2 flex items-center gap-2 text-sm text-white/70 hover:text-white"><LogOut className="h-4 w-4" /> Logout</button>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b bg-white px-4 lg:px-8">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-6 w-6" /></button>
          <Link href="/" className="text-sm text-gray-500 hover:text-[#8DD3BB]">← Back to site</Link>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
