"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type TooltipProps = {
  content: string;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
};

export function Tooltip({
  content,
  children,
  position = "top",
  className,
}: TooltipProps) {
  const arrowClasses = {
    top: "bottom-[-4px] left-1/2 -translate-x-1/2 border-b border-r",
    bottom: "top-[-4px] left-1/2 -translate-x-1/2 border-t border-l",
    left: "right-[-4px] top-1/2 -translate-y-1/2 border-b border-r",
    right: "left-[-4px] top-1/2 -translate-y-1/2 border-t border-l",
  };

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div className={cn("group relative inline-flex items-center", className)}>
      {children}
      <div
        className={cn(
          "absolute z-50 hidden group-hover:block group-focus-within:block",
          "w-52 md:w-64 px-3 py-2.5 bg-page border border-border shadow-xl",
          "text-[11px] md:text-xs text-primary text-left font-[family-name:var(--font-jetbrains)] leading-snug",
          "pointer-events-none",
          positionClasses[position]
        )}
      >
        {content}
        <span
          className={cn(
            "absolute size-2 bg-page border-border rotate-45",
            arrowClasses[position]
          )}
        />
      </div>
    </div>
  );
}
