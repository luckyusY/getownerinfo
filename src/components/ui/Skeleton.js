export default function Skeleton({ className = "" }) {
  return <div className={`skeleton ${className}`} />;
}

export function ListingCardSkeleton() {
  return (
    <div className="card dashboard-reveal !p-3">
      <Skeleton className="mb-3 aspect-[4/3] w-full rounded-xl" />
      <Skeleton className="mb-2 h-3 w-20" />
      <Skeleton className="mb-2 h-4 w-3/4" />
      <Skeleton className="mb-4 h-3 w-32" />
      <Skeleton className="h-5 w-28" />
    </div>
  );
}
