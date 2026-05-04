export const ProductCardSkeleton = () => (
  <div className="rounded-xl bg-surface border border-subtle overflow-hidden">
    <div className="aspect-square skeleton-shimmer rounded-none" />
    <div className="p-4 space-y-3">
      <div className="h-3 w-16 skeleton-shimmer" />
      <div className="h-4 w-full skeleton-shimmer" />
      <div className="h-4 w-2/3 skeleton-shimmer" />
      <div className="flex justify-between items-center pt-2">
        <div className="h-5 w-20 skeleton-shimmer" />
        <div className="h-9 w-20 skeleton-shimmer" />
      </div>
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
    {Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)}
  </div>
);

export const ProductDetailSkeleton = () => (
  <section className="container pt-10 md:pt-16">
    <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
      <div className="space-y-3">
        <div className="aspect-square skeleton-shimmer rounded-2xl" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 w-20 md:h-24 md:w-24 skeleton-shimmer rounded-lg" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-6 w-32 skeleton-shimmer" />
        <div className="h-10 w-full skeleton-shimmer" />
        <div className="h-10 w-3/4 skeleton-shimmer" />
        <div className="h-4 w-full skeleton-shimmer" />
        <div className="h-4 w-2/3 skeleton-shimmer" />
        <div className="h-12 w-40 skeleton-shimmer" />
        <div className="h-12 w-full skeleton-shimmer rounded-xl" />
      </div>
    </div>
  </section>
);

export const TableRowSkeleton = ({ cols = 5, rows = 6 }: { cols?: number; rows?: number }) => (
  <div className="space-y-2 p-4">
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }).map((_, c) => <div key={c} className="h-8 skeleton-shimmer" />)}
      </div>
    ))}
  </div>
);
