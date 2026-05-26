"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

const tabs = [
  { href: "/account", label: "Account" },
  { href: "/account/bookings", label: "Tickets/Bookings" },
  { href: "/account/favorites", label: "Favourites" },
  { href: "/account/payment", label: "Payment methods" },
  { href: "/account/settings", label: "Settings" },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) router.push("/auth/login");
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="relative bg-gradient-to-br from-[#8DD3BB] via-orange-300 to-yellow-300 pb-16 pt-8">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-white shadow-lg">
            <User className="h-12 w-12 text-[#8DD3BB]" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">{user?.firstName} {user?.lastName}</h1>
          <p className="text-gray-700">{user?.email}</p>
        </div>
      </div>
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl gap-1 overflow-x-auto px-4">
          {tabs.map((tab) => (
            <Link key={tab.href} href={tab.href}
              className={cn("whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                pathname === tab.href ? "border-[#8DD3BB] text-[#112211]" : "border-transparent text-gray-500 hover:text-[#112211]"
              )}>{tab.label}</Link>
          ))}
        </div>
      </nav>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
      <Footer />
    </div>
  );
}
