import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function DetailPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-72 rounded-2xl bg-gray-200 sm:h-96" />
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="h-8 w-2/3 rounded-lg bg-gray-200" />
          <div className="h-4 w-1/3 rounded bg-gray-100" />
          <div className="h-32 rounded-2xl bg-gray-100" />
          <div className="h-32 rounded-2xl bg-gray-100" />
        </div>
        <div className="h-56 rounded-2xl bg-gray-100" />
      </div>
    </div>
  );
}

export function PageErrorState({
  message = "Something went wrong. Please try again.",
  onRetry,
  backHref = "/",
  backLabel = "Back to home",
}: {
  message?: string;
  onRetry?: () => void;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card className="rounded-2xl">
        <CardContent className="flex flex-col items-center p-8 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-[#112211]">Unable to load</h2>
          <p className="mt-2 text-sm text-gray-500">{message}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {onRetry && <Button onClick={onRetry}>Try again</Button>}
            <Link href={backHref}>
              <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />{backLabel}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function NotFoundState({
  title = "Not found",
  message = "This item may have been removed or the link is incorrect.",
  backHref = "/",
  backLabel = "Back to home",
}: {
  title?: string;
  message?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h2 className="text-2xl font-bold text-[#112211]">{title}</h2>
      <p className="mt-2 text-gray-500">{message}</p>
      <Link href={backHref} className="mt-6 inline-block">
        <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />{backLabel}</Button>
      </Link>
    </div>
  );
}

export function InlineError({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}
