import Link from "next/link";
import { PageTransition } from "@/components/shared/page-transition";

export default function TermsPage() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold text-[#112211]">Terms of Service</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: May 2026</p>
        <div className="prose prose-gray mt-8 max-w-none space-y-6 text-gray-600">
          <section>
            <h2 className="text-xl font-bold text-[#112211]">1. Acceptance</h2>
            <p>By using Meru Tour you agree to these terms. If you do not agree, please do not use our platform.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[#112211]">2. Bookings</h2>
            <p>All bookings are subject to availability and confirmation. Prices may change until payment is completed. Cancellation policies depend on the product type (flight, hotel, tour).</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[#112211]">3. Payments</h2>
            <p>Payments are processed securely. In development environments, bookings may be confirmed without a live payment provider.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[#112211]">4. User accounts</h2>
            <p>You are responsible for keeping your login credentials secure and for all activity under your account.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[#112211]">5. Contact</h2>
            <p>Questions about these terms: <Link href="/contact" className="text-[#8DD3BB] hover:underline">Contact us</Link>.</p>
          </section>
        </div>
      </div>
    </PageTransition>
  );
}
