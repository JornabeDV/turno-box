"use client";

type DataPoint = {
  label: string;
  income: number;
  expense: number;
};

const CHART_H = 220;
const CHART_W = 720;
const PAD_L = 40;
const PAD_R = 16;
const PAD_B = 32;
const PAD_T = 16;

export function BarChart({ data }: { data: DataPoint[] }) {
  const maxValue = Math.max(
    1,
    ...data.map((d) => Math.max(d.income, d.expense))
  );

  const barGroupW = (CHART_W - PAD_L - PAD_R) / data.length;
  const barW = barGroupW * 0.32;
  const gap = barW * 0.3;

  const yScale = (val: number) =>
    CHART_H - PAD_B - (val / maxValue) * (CHART_H - PAD_T - PAD_B);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full min-w-[400px]"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Líneas horizontales guía */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => {
          const y = yScale(maxValue * p);
          return (
            <g key={p}>
              <line
                x1={PAD_L}
                y1={y}
                x2={CHART_W - PAD_R}
                y2={y}
                stroke="#1A4A63"
                strokeWidth={1}
                strokeDasharray={p === 0 ? "0" : "4 4"}
              />
              <text
                x={PAD_L - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-[#4A6B7A]"
                style={{ fontSize: 10 }}
              >
                {Math.round(maxValue * p).toLocaleString("es-AR")}
              </text>
            </g>
          );
        })}

        {/* Barras */}
        {data.map((d, i) => {
          const cx = PAD_L + i * barGroupW + barGroupW / 2;
          const incomeH = CHART_H - PAD_B - yScale(d.income);
          const expenseH = CHART_H - PAD_B - yScale(d.expense);

          return (
            <g key={d.label}>
              {/* Income bar */}
              <rect
                x={cx - barW - gap / 2}
                y={yScale(d.income)}
                width={barW}
                height={incomeH}
                rx={2}
                fill="#27C7B8"
                opacity={0.9}
              />
              {/* Expense bar */}
              <rect
                x={cx + gap / 2}
                y={yScale(d.expense)}
                width={barW}
                height={expenseH}
                rx={2}
                fill="#E61919"
                opacity={0.85}
              />
              {/* Label */}
              <text
                x={cx}
                y={CHART_H - 8}
                textAnchor="middle"
                className="fill-[#6B8A99]"
                style={{ fontSize: 10 }}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Leyenda */}
      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[2px] bg-[#27C7B8]" />
          <span className="text-[10px] text-[#6B8A99]">Ingresos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[2px] bg-[#E61919]" />
          <span className="text-[10px] text-[#6B8A99]">Egresos</span>
        </div>
      </div>
    </div>
  );
}
