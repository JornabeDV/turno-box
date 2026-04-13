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

const HOURS = Array.from({ length: 17 }, (_, i) => {
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
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider block mb-1.5">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full h-10 rounded-xl bg-zinc-800/60 border border-zinc-700 px-3.5 text-sm text-zinc-100",
          "flex items-center justify-between gap-2",
          "focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500",
          "transition-colors hover:border-zinc-600",
        )}
      >
        <span className="flex items-center gap-2">
          <Clock size={16} className="text-zinc-500" />
          {value || "Seleccionar"}
        </span>
        <CaretDown
          size={14}
          className={cn(
            "text-zinc-500 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden">
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
                  "w-full px-3.5 py-2 text-sm text-left hover:bg-zinc-700 transition-colors",
                  "flex items-center gap-2",
                  value === hour
                    ? "text-orange-500 bg-orange-500/10"
                    : "text-zinc-100",
                )}
              >
                <Clock
                  size={14}
                  className={
                    value === hour ? "text-orange-500" : "text-zinc-500"
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
