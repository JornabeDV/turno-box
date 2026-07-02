"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";

type Props = {
  initialDate: Date;
  onChange: (date: Date) => void;
  availableDays: number[];
};

const DAY_LABELS = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];
const VISIBLE_COUNT = 4;

export function DaySelectorCompact({ initialDate, onChange, availableDays }: Props) {
  const [current, setCurrent] = useState(initialDate);
  const [startIndex, setStartIndex] = useState(0);
  const autoSelectedRef = useRef(false);

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

  function goPrev() {
    setStartIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    setStartIndex((i) =>
      Math.min(Math.max(0, weekDays.length - VISIBLE_COUNT), i + 1)
    );
  }

  const visibleDays = weekDays.slice(startIndex, startIndex + VISIBLE_COUNT);
  const canGoPrev = startIndex > 0;
  const canGoNext = startIndex + VISIBLE_COUNT < weekDays.length;

  return (
    <div className="bg-[#0E2A38] border border-[#1A4A63] p-3 md:p-5">
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <span className="text-[10px] md:text-xs font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#6B8A99]">
          Próximos días
        </span>
        <span className="text-[10px] md:text-xs font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#27C7B8]">
          {current.toLocaleDateString("es-AR", { month: "short" })}
        </span>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={goPrev}
          disabled={!canGoPrev}
          className={cn(
            "shrink-0 size-7 md:size-9 flex items-center justify-center transition-colors",
            canGoPrev
              ? "text-[#6B8A99] hover:text-[#EAEAEA]"
              : "text-[#1A4A63] cursor-default"
          )}
          aria-label="Días anteriores"
        >
          <CaretLeftIcon size={16} className="md:size-5" />
        </button>

        <div className="flex-1 flex gap-2 md:gap-3">
          {visibleDays.map((date) => {
            const isSelected =
              date.toDateString() === current.toDateString();
            return (
              <button
                key={date.toISOString()}
                onClick={() => selectDate(date)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 md:gap-1.5 py-2 md:py-3 transition-all duration-150 active:scale-[0.97]",
                  isSelected
                    ? "bg-[#F78837] text-[#0A1F2A]"
                    : "border border-[#1A4A63] text-[#6B8A99] hover:text-[#EAEAEA] hover:border-[#6B8A99]"
                )}
              >
                <span className="text-[9px] md:text-xs font-[family-name:var(--font-jetbrains)] uppercase tracking-wider">
                  {DAY_LABELS[date.getDay()]}
                </span>
                <span
                  className={cn(
                    "text-sm md:text-lg font-[family-name:var(--font-oswald)] font-bold",
                    isSelected ? "text-[#0A1F2A]" : "text-[#EAEAEA]"
                  )}
                >
                  {date.getDate()}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={goNext}
          disabled={!canGoNext}
          className={cn(
            "shrink-0 size-7 md:size-9 flex items-center justify-center transition-colors",
            canGoNext
              ? "text-[#6B8A99] hover:text-[#EAEAEA]"
              : "text-[#1A4A63] cursor-default"
          )}
          aria-label="Días siguientes"
        >
          <CaretRightIcon size={16} className="md:size-5" />
        </button>
      </div>
    </div>
  );
}
