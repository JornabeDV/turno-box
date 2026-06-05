"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export type AreaPoint = {
  label: string;
  value: number;
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0E2A38] border border-[#1A4A63] px-3 py-2 shadow-lg">
      <p className="text-[10px] uppercase tracking-wider text-[#6B8A99] mb-1">{label}</p>
      <p className="text-sm font-bold text-[#EAEAEA] font-mono-data">{payload[0].value}% ocupación</p>
    </div>
  );
}

export function AreaChartPremium({ data, color = "#F78837" }: { data: AreaPoint[]; color?: string }) {
  const id = `gradient-${color.replace("#", "")}`;

  return (
    <div className="w-full h-[260px] md:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="#1A4A63" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#6B8A99", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
            tickLine={false}
            axisLine={{ stroke: "#1A4A63" }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "#4A6B7A", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#1A4A63", strokeWidth: 1, strokeDasharray: "4 4" }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${id})`}
            filter="url(#glow)"
            dot={{ r: 4, fill: "#0A1F2A", stroke: color, strokeWidth: 2 }}
            activeDot={{ r: 6, fill: color, stroke: "#0A1F2A", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
