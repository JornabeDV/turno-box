"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export type PieSlice = {
  label: string;
  value: number;
  color: string;
};

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: PieSlice }> }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-[#0E2A38] border border-[#1A4A63] px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ backgroundColor: data.color }} />
        <span className="text-xs text-[#EAEAEA]">{data.label}</span>
      </div>
      <p className="text-sm font-bold text-[#EAEAEA] font-mono-data mt-1">{data.value} reservas</p>
    </div>
  );
}

export function PieChartPremium({ data, size = 200 }: { data: PieSlice[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative" style={{ width: "100%", height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              <filter id="pieGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={size * 0.32}
              outerRadius={size * 0.45}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
              cornerRadius={4}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} filter="url(#pieGlow)" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Centro */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl md:text-2xl font-bold text-[#EAEAEA] font-mono-data">{total}</span>
          <span className="text-[10px] text-[#6B8A99] uppercase tracking-wider">reservas</span>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
        {data.map((slice, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: slice.color }} />
            <span className="text-xs text-[#6B8A99]">{slice.label}</span>
            <span className="text-xs font-bold text-[#EAEAEA] font-mono-data">
              {total > 0 ? Math.round((slice.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
