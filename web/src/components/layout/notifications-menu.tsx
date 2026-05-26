"use client";



import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import Link from "next/link";

import { useState } from "react";

import { notificationsApi } from "@/lib/api";

import { Button } from "@/components/ui/button";

import { Bell } from "lucide-react";

import { cn } from "@/lib/utils";



type Notification = {

  id: string;

  title: string;

  message: string;

  read: boolean;

  type: string;

  createdAt: string;

};



export function NotificationsMenu() {

  const qc = useQueryClient();

  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery({

    queryKey: ["notifications"],

    queryFn: async () => (await notificationsApi.getAll()).data as Notification[],

    refetchInterval: 60_000,

  });



  const markRead = useMutation({

    mutationFn: (id: string) => notificationsApi.markRead(id),

    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),

  });



  const markAll = useMutation({

    mutationFn: () => notificationsApi.markAllRead(),

    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),

  });



  const unread = notifications.filter((n) => !n.read).length;



  return (

    <div className="relative">

      <Button variant="ghost" size="icon" aria-label="Notifications" onClick={() => setOpen((v) => !v)}>

        <Bell className="h-5 w-5" />

        {unread > 0 && (

          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">

            {unread > 9 ? "9+" : unread}

          </span>

        )}

      </Button>

      {open && (

        <>

          <button type="button" className="fixed inset-0 z-40" aria-label="Close notifications" onClick={() => setOpen(false)} />

          <div className="fixed right-4 top-[4.5rem] z-50 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border bg-white shadow-xl sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-80">

            <div className="flex items-center justify-between border-b px-4 py-3">

              <p className="font-semibold text-[#112211]">Notifications</p>

              {unread > 0 && (

                <button type="button" className="text-xs text-[#8DD3BB] hover:underline" onClick={() => markAll.mutate()}>

                  Mark all read

                </button>

              )}

            </div>

            <div className="max-h-80 overflow-y-auto">

              {notifications.length === 0 ? (

                <p className="px-4 py-6 text-center text-sm text-gray-500">No notifications yet</p>

              ) : (

                notifications.slice(0, 8).map((n) => (

                  <button

                    key={n.id}

                    type="button"

                    className={cn(

                      "block w-full border-b px-4 py-3 text-left text-sm last:border-0 hover:bg-gray-50",

                      !n.read && "bg-[#8DD3BB]/5",

                    )}

                    onClick={() => { if (!n.read) markRead.mutate(n.id); }}

                  >

                    <p className="font-medium text-[#112211]">{n.title}</p>

                    <p className="mt-0.5 text-gray-600 line-clamp-2">{n.message}</p>

                  </button>

                ))

              )}

            </div>

            <div className="border-t px-4 py-2">

              <Link href="/account/bookings" className="text-xs font-medium text-[#8DD3BB] hover:underline" onClick={() => setOpen(false)}>

                View bookings →

              </Link>

            </div>

          </div>

        </>

      )}

    </div>

  );

}

