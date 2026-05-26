"use client";



import Link from "next/link";

import { usePathname } from "next/navigation";

import { Plane, Hotel, Palmtree, MapPin, Flame, Heart, User, LogOut, Menu, X, CalendarCheck } from "lucide-react";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { useAuthStore } from "@/stores/auth-store";

import { NotificationsMenu } from "@/components/layout/notifications-menu";

import { cn } from "@/lib/utils";



export function Header({ variant }: { variant?: "default" | "transparent" }) {

  const pathname = usePathname();

  const { user, isAuthenticated, logout } = useAuthStore();

  const [mobileOpen, setMobileOpen] = useState(false);

  const isTransparent = variant === "transparent" || pathname === "/";



  const navLinks = [

    { href: "/flights", label: "Flights", icon: Plane },

    { href: "/hotels", label: "Hotels", icon: Hotel },

    { href: "/hot-tours", label: "Hot Tours", icon: Flame },

    { href: "/tours", label: "Tours", icon: Palmtree },

    { href: "/destinations", label: "Destinations", icon: MapPin },

  ];



  const closeMobile = () => setMobileOpen(false);



  return (

    <header className={cn("sticky top-0 z-50 w-full", isTransparent ? "bg-transparent" : "border-b border-gray-100 bg-white/95 backdrop-blur-md")}>

      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 lg:px-8">

        <div className="flex items-center gap-8">

          <Link href="/" className={cn("text-2xl font-bold tracking-tight", isTransparent ? "text-white" : "text-[#112211]")}>

            meru<span className="text-[#8DD3BB]">tour</span>

          </Link>

          <nav className="hidden items-center gap-5 lg:flex">

            {navLinks.map(({ href, label, icon: Icon }) => (

              <Link key={href} href={href}

                className={cn("flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-[#8DD3BB]",

                  isTransparent ? "text-white/90" : pathname.startsWith(href) ? "text-[#8DD3BB]" : "text-gray-600")}>

                <Icon className="h-4 w-4" />{label}

              </Link>

            ))}

          </nav>

        </div>



        <div className="hidden items-center gap-3 md:flex">

          {isAuthenticated() ? (

            <>

              <Link href="/account/favorites"><Button variant="ghost" size="icon" aria-label="Favorites"><Heart className="h-5 w-5" /></Button></Link>

              <NotificationsMenu />

              <Link href="/account/bookings"><Button variant="ghost" size="icon" aria-label="Bookings"><CalendarCheck className="h-5 w-5" /></Button></Link>

              <Link href="/account" className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium">

                <User className="h-4 w-4" />{user?.firstName}

              </Link>

              {user?.role === "ADMIN" && <Link href="/admin"><Button variant="outline" size="sm">Admin</Button></Link>}

              <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout"><LogOut className="h-4 w-4" /></Button>

            </>

          ) : (

            <>

              <Link href="/auth/login"><Button variant={isTransparent ? "ghost" : "outline"} className={isTransparent ? "text-white hover:bg-white/10" : ""}>Login</Button></Link>

              <Link href="/auth/register"><Button>Sign up</Button></Link>

            </>

          )}

        </div>



        <div className="flex items-center gap-1 md:hidden">

          {isAuthenticated() ? (

            <>

              <Link href="/account/favorites"><Button variant="ghost" size="icon" aria-label="Favorites"><Heart className="h-5 w-5" /></Button></Link>

              <NotificationsMenu />

              <Link href="/account/bookings"><Button variant="ghost" size="icon" aria-label="Bookings"><CalendarCheck className="h-5 w-5" /></Button></Link>

            </>

          ) : null}

        </div>



        <button className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">

          {mobileOpen ? <X className={isTransparent ? "text-white" : "text-[#112211]"} /> : <Menu className={isTransparent ? "text-white" : "text-[#112211]"} />}

        </button>

      </div>



      {mobileOpen && (

        <div className="border-t bg-white px-4 py-4 lg:hidden">

          {navLinks.map(({ href, label }) => (

            <Link key={href} href={href} className="block py-2.5 text-sm font-medium" onClick={closeMobile}>{label}</Link>

          ))}

          <Link href="/about" className="block py-2.5 text-sm font-medium" onClick={closeMobile}>About</Link>

          <Link href="/contact" className="block py-2.5 text-sm font-medium" onClick={closeMobile}>Contact</Link>

          <div className="mt-4 border-t pt-4 space-y-2">

            {isAuthenticated() ? (

              <>

                <Link href="/account/favorites" className="flex items-center gap-2 py-2 text-sm font-medium" onClick={closeMobile}><Heart className="h-4 w-4" /> Favorites</Link>

                <Link href="/account/bookings" className="flex items-center gap-2 py-2 text-sm font-medium" onClick={closeMobile}><CalendarCheck className="h-4 w-4" /> Bookings</Link>

                <Link href="/account" className="flex items-center gap-2 py-2 text-sm font-medium" onClick={closeMobile}><User className="h-4 w-4" /> Account</Link>

                {user?.role === "ADMIN" && <Link href="/admin" className="block py-2 text-sm font-medium text-[#8DD3BB]" onClick={closeMobile}>Admin panel</Link>}

                <button type="button" className="flex w-full items-center gap-2 py-2 text-sm font-medium text-red-500" onClick={() => { logout(); closeMobile(); }}><LogOut className="h-4 w-4" /> Logout</button>

              </>

            ) : (

              <>

                <Link href="/auth/login" className="block py-2 text-sm font-medium" onClick={closeMobile}>Login</Link>

                <Link href="/auth/register" className="block py-2 text-sm font-medium text-[#8DD3BB]" onClick={closeMobile}>Sign up</Link>

              </>

            )}

          </div>

        </div>

      )}

    </header>

  );

}

