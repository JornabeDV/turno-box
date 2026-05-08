"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

type Props = {
  initialDate: Date;
  onChange: (date: Date) => void;
};

const DAY_LABELS = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];

export function DaySelector({ initialDate, onChange }: Props) {
  const [current, setCurrent] = useState(initialDate);

  // Generar los 5 días de la semana laboral (lun-vie) centrados en la semana actual
  const weekDays = useMemo(() => {
    const d = new Date(current);
    const day = d.getDay(); // 0=dom, 1=lun...
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // lunes de esta semana
    const monday = new Date(d);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      days.push(date);
    }
    return days;
  }, [current]);

  function selectDate(date: Date) {
    setCurrent(date);
    onChange(date);
  }

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
      <div className="grid grid-cols-5 gap-2">
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
