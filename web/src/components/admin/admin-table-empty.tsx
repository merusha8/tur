export function AdminTableEmpty({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-10 text-center text-sm text-gray-500">
        {message}
      </td>
    </tr>
  );
}

export function AdminTableLoading({ colSpan = 6, rows = 4 }: { colSpan?: number; rows?: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-6">
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </td>
    </tr>
  );
}

export function AdminListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="mt-6 space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
      ))}
    </div>
  );
}
