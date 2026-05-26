import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <Link href="/" className="mb-8 text-2xl font-bold">meru<span className="text-[#8DD3BB]">tour</span></Link>
        {children}
      </div>
      <div className="relative hidden lg:block lg:w-1/2">
        <Image
          src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200"
          alt="Travel"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#8DD3BB]/20" />
      </div>
    </div>
  );
}
