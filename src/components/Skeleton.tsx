interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`bg-surface-lighter rounded-xl animate-pulse ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-surface rounded-2xl p-4 border border-border animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-surface-lighter" />
        <div className="flex-1">
          <div className="h-3 bg-surface-lighter rounded-full w-24 mb-2" />
          <div className="h-2 bg-surface-lighter rounded-full w-16" />
        </div>
      </div>
      <div className="h-2 bg-surface-lighter rounded-full w-full mb-2" />
      <div className="h-2 bg-surface-lighter rounded-full w-3/4" />
    </div>
  );
}
