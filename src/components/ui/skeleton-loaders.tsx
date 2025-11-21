"use client";
import * as React from "react";

// Generic skeleton block
export const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-muted ${className}`} />
);

export const SkeletonLine = ({ width = "w-full" }: { width?: string }) => (
  <div className={`animate-pulse h-3 ${width} rounded bg-muted`} />
);

export const SkeletonAvatar = ({ size = 40 }: { size?: number }) => (
  <div
    className="animate-pulse rounded-full bg-muted"
    style={{ width: size, height: size }}
  />
);

export const PageHeaderSkeleton = () => (
  <div className="space-y-3">
    <SkeletonLine width="w-1/3" />
    <SkeletonLine width="w-1/2" />
  </div>
);

export const CardSkeleton = () => (
  <div className="border border-border rounded-xl p-4 bg-card">
    <div className="flex items-center gap-3 mb-4">
      <SkeletonAvatar />
      <div className="flex-1 space-y-2">
        <SkeletonLine width="w-1/2" />
        <SkeletonLine width="w-1/3" />
      </div>
    </div>
    <div className="space-y-2">
      <SkeletonLine />
      <SkeletonLine width="w-5/6" />
      <SkeletonLine width="w-2/3" />
    </div>
  </div>
);

export const GridCardsSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) => (
  <div className="w-full overflow-x-auto border border-border rounded-xl">
    <table className="min-w-[720px] w-full">
      <thead className="bg-muted/40">
        <tr>
          {Array.from({ length: cols }).map((_, c) => (
            <th key={c} className="text-left p-3 text-sm font-medium text-muted-foreground">
              <SkeletonLine width="w-20" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r} className="border-t border-border">
            {Array.from({ length: cols }).map((_, c) => (
              <td key={c} className="p-3">
                <SkeletonLine width="w-32" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const FormSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <SkeletonLine width="w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
    <div className="flex gap-3">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

export const ListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <SkeletonAvatar size={28} />
        <SkeletonLine />
      </div>
    ))}
  </div>
);
