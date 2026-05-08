"use client";

import { useState, useRef, useEffect } from "react";
import { CaretDown, Clock } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
  className?: string;
}

// 06:00 → 21:00 en intervalos de 30 minutos
const HOURS = Array.from({ length: 31 }, (_, i) => {
  const hour = 6 + Math.floor(i / 2);
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
});

export function TimePicker({
  value,
  onChange,
  label,
  className,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={ref}>
      {label && (
        <label className="text-xs font-medium text-[#6B8A99] uppercase tracking-wider block mb-1.5 font-[family-name:var(--font-oswald)]">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full h-10 bg-[#0A1F2A] border border-[#1A4A63] px-3.5 text-sm text-[#EAEAEA]",
          "flex items-center justify-between gap-2",
          "focus:outline-none focus:border-[#F78837]",
          "transition-colors hover:border-[#6B8A99]",
        )}
      >
        <span className="flex items-center gap-2">
          <Clock size={16} className="text-zinc-500" />
          {value || "Seleccionar"}
        </span>
        <CaretDown
          size={14}
          className={cn(
            "text-[#4A6B7A] transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-[#0E2A38] border border-[#1A4A63] overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            {HOURS.map((hour) => (
              <button
                key={hour}
                type="button"
                onClick={() => {
                  onChange(hour);
                  setOpen(false);
                }}
                className={cn(
                  "w-full px-3.5 py-2 text-sm text-left hover:bg-[#143D52] transition-colors",
                  "flex items-center gap-2",
                  value === hour
                    ? "text-[#F78837] bg-[#F78837]/10"
                    : "text-[#EAEAEA]",
                )}
              >
                <Clock
                  size={14}
                  className={
                    value === hour ? "text-[#F78837]" : "text-[#4A6B7A]"
                  }
                />
                {hour}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
