"use client";

import { useState, useRef, useEffect } from "react";
import {
  CalendarIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  className?: string;
  minAge?: number;
  allowFuture?: boolean;
  showYearPicker?: boolean;
}

export function DatePicker({
  value,
  onChange,
  label,
  className,
  minAge,
  allowFuture = false,
  showYearPicker = true,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const parseLocalDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  const [viewDate, setViewDate] = useState(() =>
    value ? parseLocalDate(value) : new Date(),
  );
  const ref = useRef<HTMLDivElement>(null);
  const [yearOpen, setYearOpen] = useState(false);

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
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
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

  const currentYear = new Date().getFullYear();
  const years = allowFuture
    ? Array.from({ length: 85 }, (_, i) => currentYear + 5 - i)
    : Array.from({ length: 80 }, (_, i) => currentYear - i);

  function isDisabled(day: number): boolean {
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!allowFuture && date > today) return true;
    if (minAge !== undefined) {
      const minDate = new Date(
        today.getFullYear() - minAge,
        today.getMonth(),
        today.getDate(),
      );
      if (date > minDate) return true;
    }
    return false;
  }

  const selectedDate = value ? parseLocalDate(value) : null;

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
          "w-full h-10 rounded-xl bg-zinc-800/60 border border-zinc-700 px-3.5 text-sm text-zinc-100",
          "flex items-center justify-between gap-2",
          "focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500",
          "transition-colors hover:border-zinc-600",
          !value && "text-zinc-500",
        )}
      >
        <span className="flex items-center gap-2">
          <CalendarIcon size={16} className="text-[#4A6B7A]" />
          {value ? formatDisplay(parseLocalDate(value)) : "Seleccionar fecha"}
        </span>
        <CaretRightIcon
          size={14}
          className={cn(
            "text-zinc-500 rotate-90 transition-transform",
            open && "rotate-[-90deg]",
          )}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-[#0E2A38] border border-[#1A4A63] p-3">
          {/* Year picker overlay */}
          {showYearPicker && yearOpen && (
            <div className="absolute inset-0 z-10 bg-[#0E2A38] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-zinc-700 shrink-0">
                <span className="text-sm font-medium text-[#EAEAEA] font-[family-name:var(--font-oswald)]">Seleccionar año</span>
                <button
                  type="button"
                  onClick={() => setYearOpen(false)}
                  className="text-[#6B8A99] hover:text-[#EAEAEA] transition-colors text-xs"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-y-auto min-h-0 flex-1">
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => { setViewDate(new Date(y, month, 1)); setYearOpen(false); }}
                    className={cn(
                      "w-full py-2 text-sm hover:bg-[#143D52] transition-colors text-center",
                      y === year ? "text-[#F78837] bg-[#F78837]/10" : "text-[#EAEAEA]",
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
              className="p-1 hover:bg-[#143D52] transition-colors"
            >
              <CaretLeftIcon size={16} className="text-[#6B8A99]" />
            </button>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-[#EAEAEA] font-[family-name:var(--font-oswald)]">{months[month]}</span>
              {showYearPicker ? (
                <button
                  type="button"
                  onClick={() => setYearOpen(!yearOpen)}
                  className="text-sm font-medium text-[#EAEAEA] hover:text-[#F78837] transition-colors flex items-center gap-1"
                >
                  {year}
                  <CaretDownIcon size={12} className={cn(yearOpen && "rotate-180")} />
                </button>
              ) : (
                <span className="text-sm font-medium text-[#EAEAEA]">{year}</span>
              )}
            </div>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 hover:bg-[#143D52] transition-colors"
            >
              <CaretRightIcon size={16} className="text-[#6B8A99]" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-[10px] font-medium text-[#6B8A99] text-center py-1 font-[family-name:var(--font-jetbrains)] uppercase tracking-wider"
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
                    "h-8 text-sm transition-colors",
                    disabled &&
                      "text-[#4A6B7A] cursor-not-allowed hover:bg-transparent",
                    !disabled && "hover:bg-[#143D52]",
                    isSelected &&
                      "bg-[#F78837] text-[#0A1F2A] hover:bg-[#E07A2E]",
                    !isSelected && !disabled && "text-[#EAEAEA]",
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
  allowFuture?: boolean;
  showYearPicker?: boolean;
}

export function DateInput({
  name,
  value,
  onChange,
  label,
  className,
  minAge,
  allowFuture,
  showYearPicker,
}: DateInputProps) {
  return (
    <>
      <DatePicker
        value={value}
        onChange={onChange}
        label={label}
        className={className}
        minAge={minAge}
        allowFuture={allowFuture}
        showYearPicker={showYearPicker}
      />
      <input type="hidden" name={name} value={value} />
    </>
  );
}
