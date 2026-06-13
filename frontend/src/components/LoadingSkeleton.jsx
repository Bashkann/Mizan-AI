/**
 * LoadingSkeleton renders animated placeholder content during loading states.
 * Supports 'text', 'card', and 'table-row' variants.
 */
export default function LoadingSkeleton({ type = 'text', count = 1 }) {
  const renderSkeleton = (index) => {
    switch (type) {
      case 'text':
        return (
          <div key={index} className="space-y-3">
            <div className="h-4 skeleton-shimmer rounded w-3/4" />
            <div className="h-4 skeleton-shimmer rounded w-full" />
            <div className="h-4 skeleton-shimmer rounded w-5/6" />
            {index === 0 && <div className="h-4 skeleton-shimmer rounded w-2/3" />}
          </div>
        );

      case 'card':
        return (
          <div
            key={index}
            className="rounded-xl border border-border bg-bg-surface p-6 space-y-4"
          >
            <div className="h-5 skeleton-shimmer rounded w-1/3" />
            <div className="space-y-2">
              <div className="h-4 skeleton-shimmer rounded w-full" />
              <div className="h-4 skeleton-shimmer rounded w-4/5" />
              <div className="h-4 skeleton-shimmer rounded w-3/5" />
            </div>
            <div className="flex gap-3 pt-2">
              <div className="h-8 w-20 skeleton-shimmer rounded-lg" />
              <div className="h-8 w-20 skeleton-shimmer rounded-lg" />
            </div>
          </div>
        );

      case 'table-row':
        return (
          <div
            key={index}
            className="flex items-center gap-4 py-4 px-4 border-b border-border"
          >
            <div className="h-4 skeleton-shimmer rounded w-24" />
            <div className="h-4 skeleton-shimmer rounded flex-1" />
            <div className="h-4 skeleton-shimmer rounded w-32" />
          </div>
        );

      default:
        return (
          <div key={index} className="h-4 skeleton-shimmer rounded w-full" />
        );
    }
  };

  return (
    <div className="space-y-4 w-full">
      {Array.from({ length: count }, (_, i) => renderSkeleton(i))}
    </div>
  );
}
