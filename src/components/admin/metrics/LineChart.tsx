"use client";

import { useRef, useEffect, useState } from "react";

export type LinePoint = {
  label: string;
  value: number;
};

export function LineChart({ data, color = "#F78837", height = 240 }: { data: LinePoint[]; color?: string; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isMobile = width < 640;
  const padL = isMobile ? 36 : 48;
  const padR = 16;
  const padB = isMobile ? 40 : 32;
  const padT = 20;
  const chartW = Math.max(width, 300);
  const chartH = height;

  const maxValue = Math.max(10, ...data.map((d) => d.value));
  const xScale = (i: number) => padL + (i / Math.max(1, data.length - 1)) * (chartW - padL - padR);
  const yScale = (v: number) => chartH - padB - (v / maxValue) * (chartH - padT - padB);

  const pathD = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d.value)}`)
    .join(" ");

  const areaD = `${pathD} L ${xScale(data.length - 1)} ${chartH - padB} L ${xScale(0)} ${chartH - padB} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div ref={containerRef} className="w-full">
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Guías horizontales */}
        {yTicks.map((p) => {
          const y = yScale(maxValue * p);
          return (
            <g key={p}>
              <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#1A4A63" strokeWidth={1} strokeDasharray={p === 0 ? "0" : "4 4"} />
              <text x={padL - 8} y={y + 4} textAnchor="end" className="fill-[#4A6B7A]" style={{ fontSize: isMobile ? 9 : 11 }}>
                {Math.round(maxValue * p)}
              </text>
            </g>
          );
        })}

        {/* Área bajo la línea */}
        <path d={areaD} fill={color} opacity={0.06} />

        {/* Línea */}
        <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Puntos */}
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={xScale(i)} cy={yScale(d.value)} r={isMobile ? 3 : 4} fill="#0A1F2A" stroke={color} strokeWidth={2} />
            {d.value > 0 && (
              <text
                x={xScale(i)}
                y={yScale(d.value) - 10}
                textAnchor="middle"
                className="fill-[#EAEAEA] font-mono-data"
                style={{ fontSize: isMobile ? 8 : 10 }}
              >
                {d.value}%
              </text>
            )}
          </g>
        ))}

        {/* Labels X */}
        {data.map((d, i) => (
          <text
            key={`l-${i}`}
            x={xScale(i)}
            y={chartH - 8}
            textAnchor={isMobile ? "end" : "middle"}
            transform={isMobile ? `rotate(-45, ${xScale(i)}, ${chartH - 8})` : undefined}
            className="fill-[#6B8A99]"
            style={{ fontSize: isMobile ? 9 : 11 }}
          >
            {d.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
