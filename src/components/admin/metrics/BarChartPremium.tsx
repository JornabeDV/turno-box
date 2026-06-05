"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export type BarPoint = {
  label: string;
  value: number;
  color?: string | null;
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0E2A38] border border-[#1A4A63] px-3 py-2 shadow-lg">
      <p className="text-[10px] uppercase tracking-wider text-[#6B8A99] mb-1">{label}</p>
      <p className="text-sm font-bold text-[#EAEAEA] font-mono-data">{payload[0].value}%</p>
    </div>
  );
}

export function BarChartPremium({
  data,
  layout = "vertical",
  color = "#F78837",
  height = 260,
}: {
  data: BarPoint[];
  layout?: "vertical" | "horizontal";
  color?: string;
  height?: number;
}) {
  const isVertical = layout === "vertical";

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={layout}
          margin={{ top: 10, right: 10, left: isVertical ? 20 : -10, bottom: 0 }}
        >
          <defs>
            <filter id="barGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="#1A4A63" horizontal={isVertical} vertical={!isVertical} />
          {isVertical ? (
            <>
              <XAxis
                type="number"
                tick={{ fill: "#4A6B7A", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
                tickLine={false}
                axisLine={{ stroke: "#1A4A63" }}
                tickFormatter={(v: number) => `${v}%`}
              />
              <YAxis
                dataKey="label"
                type="category"
                tick={{ fill: "#6B8A99", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
                tickLine={false}
                axisLine={{ stroke: "#1A4A63" }}
                width={80}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="label"
                tick={{ fill: "#6B8A99", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
                tickLine={false}
                axisLine={{ stroke: "#1A4A63" }}
              />
              <YAxis
                tick={{ fill: "#4A6B7A", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v}%`}
              />
            </>
          )}
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(26, 74, 99, 0.2)" }} />
          <Bar
            dataKey="value"
            radius={isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            maxBarSize={32}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || color}
                filter={index < 3 ? "url(#barGlow)" : undefined}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
