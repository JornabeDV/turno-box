"use client";

import { useRef, useEffect, useState } from "react";

export type HBarItem = {
  label: string;
  value: number;
  color?: string | null;
  sublabel?: string;
};

export function HorizontalBarChart({ data, maxValue, unit = "%", barColor = "#F78837" }: {
  data: HBarItem[];
  maxValue?: number;
  unit?: string;
  barColor?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(400);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const mv = maxValue ?? Math.max(1, ...data.map((d) => d.value));

  return (
    <div ref={containerRef} className="w-full space-y-3">
      {data.map((item, i) => {
        const pct = Math.min(100, (item.value / mv) * 100);
        const color = item.color || barColor;
        return (
          <div key={i} className="group">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs md:text-sm font-medium text-[#EAEAEA] truncate">{item.label}</span>
                {item.sublabel && (
                  <span className="text-[10px] md:text-xs text-[#4A6B7A] hidden sm:inline">{item.sublabel}</span>
                )}
              </div>
              <span className="text-xs md:text-sm font-bold tabular-nums text-[#EAEAEA] shrink-0 ml-2">
                {item.value}{unit}
              </span>
            </div>
            <div className="h-2 bg-[#0A1F2A] rounded-[1px] overflow-hidden">
              <div
                className="h-full rounded-[1px] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                style={{
                  width: `${pct}%`,
                  backgroundColor: color,
                  transitionDelay: `${i * 60}ms`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
