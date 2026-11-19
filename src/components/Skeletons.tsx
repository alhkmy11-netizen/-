import React from 'react';

/**
 * Shimmer element for skeleton placeholders with smooth pulsating animation
 */
export const SkeletonBox: React.FC<{
  className?: string;
  rounded?: string;
}> = ({ className = '', rounded = 'rounded-xl' }) => (
  <div
    className={`bg-slate-200/80 animate-pulse relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent ${rounded} ${className}`}
  />
);

/**
 * Skeleton representation of a single product card in HomeOffersView
 */
export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col justify-between space-y-4 shadow-xs">
      <div>
        {/* Top Badges & Alert Icon Placeholder */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <SkeletonBox className="h-5 w-16" rounded="rounded-md" />
            <SkeletonBox className="h-5 w-20" rounded="rounded-md" />
          </div>
          <SkeletonBox className="h-7 w-7" rounded="rounded-lg" />
        </div>

        {/* Product Visual & Info Area */}
        <div className="flex items-start gap-3 my-2">
          {/* Product Icon/Image Box */}
          <SkeletonBox className="w-16 h-16 shrink-0" rounded="rounded-2xl" />

          {/* Titles & Pack info */}
          <div className="flex-1 space-y-2 py-0.5">
            <SkeletonBox className="h-4 w-5/6" rounded="rounded-md" />
            <SkeletonBox className="h-3 w-1/2" rounded="rounded-md" />
            <div className="flex items-center gap-2 pt-1">
              <SkeletonBox className="h-3 w-14" rounded="rounded-md" />
              <SkeletonBox className="h-3 w-10" rounded="rounded-md" />
            </div>
          </div>
        </div>

        {/* Lowest Price Highlight Badge Skeleton */}
        <div className="my-3 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div className="space-y-1.5">
            <SkeletonBox className="h-3 w-16" rounded="rounded" />
            <SkeletonBox className="h-5 w-24" rounded="rounded-md" />
          </div>
          <SkeletonBox className="h-6 w-16" rounded="rounded-lg" />
        </div>

        {/* Multi-Store Mini Comparison Badges Skeleton */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] px-1">
            <SkeletonBox className="h-3 w-28" rounded="rounded" />
            <SkeletonBox className="h-3 w-12" rounded="rounded" />
          </div>
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonBox key={i} className="h-10 w-full" rounded="rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Cart Action Skeleton */}
      <div className="pt-3 border-t border-slate-100 mt-2">
        <SkeletonBox className="h-10 w-full" rounded="rounded-xl" />
      </div>
    </div>
  );
};

/**
 * Grid of product card skeletons
 */
export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" dir="rtl">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};

/**
 * Skeleton representation of the StoreMatrixView comparison table
 */
export const MatrixTableSkeleton: React.FC<{ storeCount?: number; rowCount?: number }> = ({
  storeCount = 5,
  rowCount = 8,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" dir="rtl">
      {/* Table Top Status Skeleton */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SkeletonBox className="w-5 h-5" rounded="rounded-md" />
          <SkeletonBox className="h-4 w-40" rounded="rounded-md" />
        </div>
        <SkeletonBox className="h-5 w-24" rounded="rounded-full" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          {/* Header Skeleton */}
          <thead className="bg-slate-50/80 border-b border-slate-200">
            <tr>
              <th className="p-3.5 sticky right-0 bg-slate-50 z-10 min-w-[200px]">
                <SkeletonBox className="h-4 w-24" rounded="rounded-md" />
              </th>
              <th className="p-3.5 min-w-[100px]">
                <SkeletonBox className="h-4 w-16" rounded="rounded-md" />
              </th>
              {Array.from({ length: storeCount }).map((_, i) => (
                <th key={i} className="p-3.5 text-center min-w-[110px]">
                  <div className="flex flex-col items-center gap-1.5">
                    <SkeletonBox className="w-7 h-7" rounded="rounded-full" />
                    <SkeletonBox className="h-3 w-16" rounded="rounded-md" />
                  </div>
                </th>
              ))}
              <th className="p-3.5 text-center min-w-[90px]">
                <SkeletonBox className="h-4 w-12 mx-auto" rounded="rounded-md" />
              </th>
            </tr>
          </thead>

          {/* Rows Skeleton */}
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: rowCount }).map((_, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                {/* Product Name & Icon Column */}
                <td className="p-3.5 sticky right-0 bg-white z-10">
                  <div className="flex items-center gap-2.5">
                    <SkeletonBox className="w-8 h-8 shrink-0" rounded="rounded-lg" />
                    <div className="space-y-1.5 flex-1">
                      <SkeletonBox className="h-3.5 w-4/5" rounded="rounded-md" />
                      <SkeletonBox className="h-2.5 w-1/2" rounded="rounded-md" />
                    </div>
                  </div>
                </td>

                {/* Packaging Unit Column */}
                <td className="p-3.5">
                  <SkeletonBox className="h-5 w-16" rounded="rounded-md" />
                </td>

                {/* Store Price Cells Skeleton */}
                {Array.from({ length: storeCount }).map((_, sIdx) => {
                  // Simulate random lowest price highlight shape for realistic look
                  const isSimulatedBest = (rIdx + sIdx) % storeCount === 1;

                  return (
                    <td key={sIdx} className="p-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <SkeletonBox
                          className={`h-5 w-16 ${
                            isSimulatedBest ? 'bg-emerald-200/70' : ''
                          }`}
                          rounded="rounded-md"
                        />
                        {isSimulatedBest && (
                          <SkeletonBox className="h-2.5 w-10 bg-emerald-100" rounded="rounded-xs" />
                        )}
                      </div>
                    </td>
                  );
                })}

                {/* Action Column Skeleton */}
                <td className="p-3 text-center">
                  <SkeletonBox className="h-8 w-16 mx-auto" rounded="rounded-lg" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
