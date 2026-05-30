"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  initialDate: Date;
  onChange: (date: Date) => void;
  availableDays: number[];
};

const DAY_LABELS = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];

const GRID_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  7: "grid-cols-7",
};

export function DaySelector({ initialDate, onChange, availableDays }: Props) {
  const [current, setCurrent] = useState(initialDate);
  const autoSelectedRef = useRef(false);

  // Generar los próximos 14 días calendario, filtrando solo los días con clases
  const weekDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: Date[] = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (availableDays.includes(date.getDay())) {
        days.push(date);
      }
    }
    return days;
  }, [availableDays]);

  // Si la fecha inicial no está entre los días disponibles, auto-seleccionar el primero
  useEffect(() => {
    if (autoSelectedRef.current) return;
    if (weekDays.length === 0) return;

    const isAvailable = weekDays.some(
      (d) => d.toDateString() === initialDate.toDateString()
    );

    if (!isAvailable) {
      autoSelectedRef.current = true;
      setCurrent(weekDays[0]);
      onChange(weekDays[0]);
    }
  }, [weekDays, initialDate, onChange]);

  function selectDate(date: Date) {
    setCurrent(date);
    onChange(date);
  }

  const gridClass = GRID_COLS[weekDays.length] ?? "grid-cols-7";

  return (
    <div className="bg-[#0E2A38] border border-[#1A4A63] p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#6B8A99]">
          Calendario semanal
        </span>
        <span className="text-[10px] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#27C7B8]">
          {current.toLocaleDateString("es-AR", { month: "short" })}
        </span>
      </div>
      <div className={cn("grid gap-2", gridClass)}>
        {weekDays.map((date) => {
          const isSelected =
            date.toDateString() === current.toDateString();
          return (
            <button
              key={date.toISOString()}
              onClick={() => selectDate(date)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 transition-all duration-150 active:scale-[0.97]",
                isSelected
                  ? "bg-[#F78837] text-[#0A1F2A]"
                  : "border border-[#1A4A63] text-[#6B8A99] hover:text-[#EAEAEA] hover:border-[#6B8A99]"
              )}
            >
              <span className="text-[9px] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider">
                {DAY_LABELS[date.getDay()]}
              </span>
              <span
                className={cn(
                  "text-sm font-[family-name:var(--font-oswald)] font-bold",
                  isSelected ? "text-[#0A1F2A]" : "text-[#EAEAEA]"
                )}
              >
                {date.getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
