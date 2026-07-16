"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface LoadMoreListProps<T> {
  items: T[];
  initialCount?: number;
  increment?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  loadMoreText?: string;
  emptyMessage?: string;
}

export function LoadMoreList<T>({
  items,
  initialCount = 10,
  increment = 10,
  renderItem,
  loadMoreText = "Cargar más",
  emptyMessage = "Sin registros.",
}: LoadMoreListProps<T>) {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const hasMore = visibleCount < items.length;

  if (items.length === 0) {
    return (
      <p className="text-xs md:text-sm text-muted text-center py-12 font-[family-name:var(--font-oswald)] uppercase tracking-wide">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      {items.slice(0, visibleCount).map((item, index) => renderItem(item, index))}
      {hasMore && (
        <div className="py-5 flex justify-center border-t border-border">
          <Button
            variant="outline"
            size="md"
            onClick={() => setVisibleCount((c) => c + increment)}
          >
            {loadMoreText}
          </Button>
        </div>
      )}
    </>
  );
}
