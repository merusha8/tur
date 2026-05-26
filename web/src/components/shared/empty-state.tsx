import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn("rounded-2xl border-dashed", className)}>
      <CardContent className="flex flex-col items-center px-6 py-14 text-center">
        {Icon && (
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8DD3BB]/15 text-[#8DD3BB]">
            <Icon className="h-7 w-7" />
          </div>
        )}
        <h3 className="text-lg font-bold text-[#112211]">{title}</h3>
        {description && <p className="mt-2 max-w-md text-sm text-gray-500">{description}</p>}
        {actionLabel && actionHref && (
          <Link href={actionHref} className="mt-6">
            <Button>{actionLabel}</Button>
          </Link>
        )}
        {actionLabel && onAction && !actionHref && (
          <Button className="mt-6" onClick={onAction}>{actionLabel}</Button>
        )}
      </CardContent>
    </Card>
  );
}
