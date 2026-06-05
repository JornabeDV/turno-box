"use client";

import { useRef, useEffect, useState } from "react";

export type DonutSlice = {
  label: string;
  value: number;
  color: string;
};

const COLORS = ["#F78837", "#27C7B8", "#E61919", "#4A6B7A", "#1A4A63"];

export function DonutChart({ data, size = 180 }: { data: DonutSlice[]; size?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(size);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => setContainerWidth(entries[0].contentRect.width));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = containerWidth / 2;
  const cy = size / 2;
  const r = Math.min(cx, cy) - 10;
  const strokeWidth = r * 0.22;
  const radius = r - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center">
      <div className="relative" style={{ width: containerWidth, height: size }}>
        <svg width={containerWidth} height={size} viewBox={`0 0 ${containerWidth} ${size}`}>
          {data.map((slice, i) => {
            const pct = total > 0 ? slice.value / total : 0;
            const dash = pct * circumference;
            const color = slice.color || COLORS[i % COLORS.length];
            const el = (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                className="transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                style={{ transitionDelay: `${i * 80}ms` }}
              />
            );
            offset += dash;
            return el;
          })}
        </svg>
        {/* Centro */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl md:text-2xl font-bold text-[#EAEAEA] tabular-nums">{total}</span>
          <span className="text-[10px] md:text-xs text-[#6B8A99] uppercase tracking-wider">reservas</span>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
        {data.map((slice, i) => {
          const color = slice.color || COLORS[i % COLORS.length];
          return (
            <div key={i} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-[1px]" style={{ backgroundColor: color }} />
              <span className="text-xs text-[#6B8A99]">{slice.label}</span>
              <span className="text-xs font-bold text-[#EAEAEA] tabular-nums">
                {total > 0 ? Math.round((slice.value / total) * 100) : 0}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
