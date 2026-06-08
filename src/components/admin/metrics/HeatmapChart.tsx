"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

type HeatmapItem = {
  hour: number;
  label: string;
  disciplineId: string;
  disciplineName: string;
  color: string | null;
  bookings: number;
  capacity: number;
  occupancy: number;
};

type Props = {
  data: HeatmapItem[];
};

function getHeatColor(occupancy: number): string {
  if (occupancy >= 80) return "bg-[#27C7B8]";
  if (occupancy >= 60) return "bg-[#27C7B8]/70";
  if (occupancy >= 40) return "bg-[#F78837]";
  if (occupancy >= 20) return "bg-[#F78837]/50";
  return "bg-[#1A4A63]/40";
}

function getTextColor(occupancy: number): string {
  if (occupancy >= 60) return "text-[#0A1F2A]";
  return "text-[#EAEAEA]";
}

export function HeatmapChart({ data }: Props) {
  const { hours, disciplines, matrix } = useMemo(() => {
    const hourSet = new Set<number>();
    const discMap = new Map<string, { id: string; name: string; color: string | null }>();

    for (const item of data) {
      hourSet.add(item.hour);
      if (!discMap.has(item.disciplineId)) {
        discMap.set(item.disciplineId, { id: item.disciplineId, name: item.disciplineName, color: item.color });
      }
    }

    const hours = Array.from(hourSet).sort((a, b) => a - b);
    const disciplines = Array.from(discMap.values());

    const matrix = new Map<string, HeatmapItem>();
    for (const item of data) {
      matrix.set(`${item.hour}|${item.disciplineId}`, item);
    }

    return { hours, disciplines, matrix };
  }, [data]);

  if (disciplines.length === 0 || hours.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-[#6B8A99] text-sm">
        Sin datos para mostrar
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left text-[#6B8A99] font-medium uppercase tracking-wider py-2 pr-4 sticky left-0 bg-[#0E2A38] z-10">
              Horario
            </th>
            {disciplines.map((d) => (
              <th key={d.id} className="text-center text-[#6B8A99] font-medium uppercase tracking-wider py-2 px-1 min-w-[80px]">
                <div className="flex items-center justify-center gap-1.5">
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: d.color || "#F78837" }}
                  />
                  <span className="truncate max-w-[100px]">{d.name}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hours.map((h) => (
            <tr key={h} className="border-t border-[#1A4A63]/40">
              <td className="text-[#EAEAEA] font-[family-name:var(--font-jetbrains)] tabular-nums py-2 pr-4 sticky left-0 bg-[#0E2A38] z-10">
                {String(h).padStart(2, "0")}:00
              </td>
              {disciplines.map((d) => {
                const item = matrix.get(`${h}|${d.id}`);
                const occupancy = item?.occupancy ?? 0;
                return (
                  <td key={d.id} className="py-1 px-1">
                    <div
                      className={cn(
                        "relative h-10 flex flex-col items-center justify-center rounded-[2px] transition-colors",
                        getHeatColor(occupancy)
                      )}
                    >
                      {item ? (
                        <>
                          <span className={cn("font-bold tabular-nums text-[11px]", getTextColor(occupancy))}>
                            {occupancy}%
                          </span>
                          <span className={cn("tabular-nums text-[9px] opacity-80", getTextColor(occupancy))}>
                            {item.bookings}
                          </span>
                        </>
                      ) : (
                        <span className="text-[#4A6B7A] text-[10px]">—</span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Leyenda */}
      <div className="flex items-center gap-3 mt-3 text-[10px] text-[#6B8A99]">
        <span>Baja</span>
        <div className="flex gap-1">
          <span className="size-3 rounded-[2px] bg-[#1A4A63]/40" />
          <span className="size-3 rounded-[2px] bg-[#F78837]/50" />
          <span className="size-3 rounded-[2px] bg-[#F78837]" />
          <span className="size-3 rounded-[2px] bg-[#27C7B8]/70" />
          <span className="size-3 rounded-[2px] bg-[#27C7B8]" />
        </div>
        <span>Alta</span>
      </div>
    </div>
  );
}
