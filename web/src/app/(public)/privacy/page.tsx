import Link from "next/link";
import { PageTransition } from "@/components/shared/page-transition";

export default function PrivacyPage() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold text-[#112211]">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: May 2026</p>
        <div className="prose prose-gray mt-8 max-w-none space-y-6 text-gray-600">
          <section>
            <h2 className="text-xl font-bold text-[#112211]">1. Data we collect</h2>
            <p>We collect information you provide when registering, booking, or contacting us: name, email, phone, booking details, and payment metadata (not full card numbers when Stripe is used).</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[#112211]">2. How we use data</h2>
            <p>Your data is used to process bookings, send confirmations, improve our service, and respond to support requests.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[#112211]">3. Cookies & sessions</h2>
            <p>We use cookies and local storage to keep you signed in and remember search preferences. You can clear these in your browser settings.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[#112211]">4. Third parties</h2>
            <p>We may share necessary booking data with airlines, hotels, and payment processors to fulfil your reservations.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[#112211]">5. Your rights</h2>
            <p>You may request access, correction, or deletion of your personal data by contacting us via the <Link href="/contact" className="text-[#8DD3BB] hover:underline">contact page</Link>.</p>
          </section>
        </div>
      </div>
    </PageTransition>
  );
}
