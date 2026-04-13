"use client";

import { useState, useRef, useEffect } from "react";
import {
  Calendar,
  CaretDown,
  CaretLeft,
  CaretRight,
  Check,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  className?: string;
  minAge?: number;
}

export function DatePicker({
  value,
  onChange,
  label,
  className,
  minAge,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() =>
    value ? new Date(value) : new Date(),
  );
  const ref = useRef<HTMLDivElement>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const DAYS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function formatDate(d: Date): string {
    return d.toISOString().split("T")[0];
  }

  function formatDisplay(d: Date): string {
    return d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function handleSelect(day: number) {
    const selected = new Date(year, month, day);
    onChange(formatDate(selected));
    setOpen(false);
  }

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  function handleYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setViewDate(new Date(Number(e.target.value), month, 1));
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - i);

  const [yearOpen, setYearOpen] = useState(false);
  const yearRef = useRef<HTMLDivElement>(null);

  function isDisabled(day: number): boolean {
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) return true;
    if (minAge !== undefined) {
      const minDate = new Date(
        today.getFullYear() - minAge,
        today.getMonth(),
        today.getDate(),
      );
      if (date < minDate) return true;
    }
    return false;
  }

  const selectedDate = value ? new Date(value) : null;

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
          !value && "text-zinc-500",
        )}
      >
        <span className="flex items-center gap-2">
          <Calendar size={16} className="text-zinc-500" />
          {value ? formatDisplay(new Date(value)) : "Seleccionar fecha"}
        </span>
        <CaretRight
          size={14}
          className={cn(
            "text-zinc-500 rotate-90 transition-transform",
            open && "rotate-[-90deg]",
          )}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl p-3">
          {/* Year picker overlay */}
          {yearOpen && (
            <div className="absolute inset-0 z-10 bg-zinc-800 rounded-xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-zinc-700 shrink-0">
                <span className="text-sm font-medium text-zinc-300">
                  Seleccionar año
                </span>
                <button
                  type="button"
                  onClick={() => setYearOpen(false)}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors text-xs"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-y-auto min-h-0 flex-1">
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setViewDate(new Date(y, month, 1));
                      setYearOpen(false);
                    }}
                    className={cn(
                      "w-full py-2 text-sm hover:bg-zinc-700 transition-colors text-center",
                      y === year
                        ? "text-orange-500 bg-orange-500/10"
                        : "text-zinc-200",
                    )}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <CaretLeft size={16} className="text-zinc-400" />
            </button>
            <div className="flex items-center gap-1">
              {/* Month label */}
              <span className="text-sm font-medium text-zinc-100 min-w-auto text-center">
                {months[month]}
              </span>
              <span className="text-zinc-100">-</span>
              {/* Year picker */}
              <div ref={yearRef}>
                <button
                  type="button"
                  onClick={() => setYearOpen(!yearOpen)}
                  className="text-sm font-medium text-zinc-100 hover:text-orange-400 transition-colors flex items-center gap-1"
                >
                  {year}
                  <CaretDown
                    size={12}
                    className={cn(yearOpen && "rotate-180")}
                  />
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <CaretRight size={16} className="text-zinc-400" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-[10px] font-medium text-zinc-500 text-center py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(year, month, day);
              const isSelected =
                selectedDate?.toDateString() === date.toDateString();
              const disabled = isDisabled(day);

              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelect(day)}
                  className={cn(
                    "h-8 text-sm rounded-lg transition-colors",
                    disabled &&
                      "text-zinc-600 cursor-not-allowed hover:bg-transparent",
                    !disabled && "hover:bg-zinc-700",
                    isSelected &&
                      "bg-orange-500 text-white hover:bg-orange-600",
                    !isSelected && !disabled && "text-zinc-200",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface DateInputProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  minAge?: number;
}

export function DateInput({
  name,
  value,
  onChange,
  label,
  className,
  minAge,
}: DateInputProps) {
  return (
    <>
      <DatePicker
        value={value}
        onChange={onChange}
        label={label}
        className={className}
        minAge={minAge}
      />
      <input type="hidden" name={name} value={value} />
    </>
  );
}
