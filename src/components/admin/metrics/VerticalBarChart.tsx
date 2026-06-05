"use client";

import { useRef, useEffect, useState } from "react";

export type VBarItem = {
  label: string;
  value: number;
};

export function VerticalBarChart({ data, color = "#27C7B8", height = 200 }: {
  data: VBarItem[];
  color?: string;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(500);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const isMobile = width < 640;
  const padL = isMobile ? 32 : 40;
  const padR = 8;
  const padB = isMobile ? 36 : 28;
  const padT = 16;
  const chartW = Math.max(width, 300);
  const chartH = height;

  const maxValue = Math.max(1, ...data.map((d) => d.value));
  const barW = ((chartW - padL - padR) / data.length) * (isMobile ? 0.55 : 0.5);
  const gap = ((chartW - padL - padR) / data.length) * (isMobile ? 0.45 : 0.5);

  const yScale = (v: number) => chartH - padB - (v / maxValue) * (chartH - padT - padB);

  return (
    <div ref={containerRef} className="w-full">
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Guía base */}
        <line x1={padL} y1={chartH - padB} x2={chartW - padR} y2={chartH - padB} stroke="#1A4A63" strokeWidth={1} />

        {data.map((d, i) => {
          const x = padL + i * (barW + gap) + gap / 2;
          const barH = chartH - padB - yScale(d.value);
          return (
            <g key={i}>
              <rect
                x={x}
                y={yScale(d.value)}
                width={barW}
                height={barH}
                rx={1}
                fill={color}
                opacity={0.85}
              />
              {d.value > 0 && (
                <text
                  x={x + barW / 2}
                  y={yScale(d.value) - 6}
                  textAnchor="middle"
                  className="fill-[#EAEAEA] font-mono-data"
                  style={{ fontSize: isMobile ? 8 : 10 }}
                >
                  {d.value}%
                </text>
              )}
              <text
                x={x + barW / 2}
                y={chartH - 6}
                textAnchor={isMobile ? "end" : "middle"}
                transform={isMobile ? `rotate(-45, ${x + barW / 2}, ${chartH - 6})` : undefined}
                className="fill-[#6B8A99]"
                style={{ fontSize: isMobile ? 9 : 11 }}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
