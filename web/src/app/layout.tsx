import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { DemoBanner } from "@/components/shared/demo-banner";

export const metadata: Metadata = {
  title: "Meru Tour — Travel Booking Platform",
  description: "Book flights, hotels, and plan your perfect trip with Meru Tour.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <DemoBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
