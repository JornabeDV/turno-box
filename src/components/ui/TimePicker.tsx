"use client";

import { useState, useRef, useEffect } from "react";
import { CaretDown, Clock } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
  error?: string;
  className?: string;
}

// 06:00 → 23:00 en intervalos de 30 minutos
const HOURS = Array.from({ length: 35 }, (_, i) => {
  const hour = 6 + Math.floor(i / 2);
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
});

export function TimePicker({
  value,
  onChange,
  label,
  error,
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
        <label className="text-xs sm:text-sm font-medium text-secondary uppercase tracking-wider block mb-1.5 font-[family-   name:var(--font-oswald)]">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full h-12 bg-page border border-border px-3.5 text-sm sm:text-base text-primary",
          "flex items-center justify-between gap-2",
          "focus:outline-none focus:border-brand",
          "transition-colors hover:border-secondary",
          error && "border-danger focus:border-danger",
        )}
      >
        <span className="flex items-center gap-2">
          <Clock size={16} className="text-muted" />
          {value || "Seleccionar"}
        </span>
        <CaretDown
          size={14}
          className={cn(
            "text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border overflow-hidden">
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
                  "w-full px-3.5 py-2 text-sm text-left hover:bg-panel transition-colors",
                  "flex items-center gap-2",
                  value === hour
                    ? "text-brand bg-brand/10"
                    : "text-primary",
                )}
              >
                <Clock
                  size={14}
                  className={
                    value === hour ? "text-brand" : "text-muted"
                  }
                />
                {hour}
              </button>
            ))}
          </div>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
