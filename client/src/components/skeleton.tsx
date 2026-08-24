export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <div className="skeleton w-full aspect-[4/5] rounded-2xl" />
      <div className="skeleton h-3 w-3/4 rounded" />
      <div className="skeleton h-2.5 w-1/2 rounded" />
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="border border-border rounded-2xl p-5 space-y-3">
      <div className="flex justify-between">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-3 w-16 rounded" />
      </div>
      <div className="skeleton h-2 w-full rounded" />
      <div className="flex justify-between">
        <div className="skeleton h-2.5 w-32 rounded" />
        <div className="skeleton h-2.5 w-20 rounded" />
      </div>
    </div>
  );
}

export function CartItemSkeleton() {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-4 p-4">
      <div className="skeleton aspect-square rounded-xl" />
      <div className="space-y-2">
        <div className="skeleton h-3 w-3/4 rounded" />
        <div className="skeleton h-2.5 w-1/2 rounded" />
        <div className="skeleton h-2.5 w-1/3 rounded" />
      </div>
    </div>
  );
}

export function DashboardStatSkeleton() {
  return (
    <div className="p-5 rounded-2xl border border-border space-y-2">
      <div className="skeleton h-2.5 w-20 rounded" />
      <div className="skeleton h-7 w-28 rounded" />
      <div className="skeleton h-2 w-16 rounded" />
    </div>
  );
}
