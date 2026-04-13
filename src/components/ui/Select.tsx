"use client";

import { useState, useRef, useEffect } from "react";
import { CaretDown, Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  className?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Seleccionar",
  label,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

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
          selected ? "text-zinc-100" : "text-zinc-500",
        )}
      >
        <span>{selected?.label || placeholder}</span>
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
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full px-3.5 py-2.5 text-sm text-left hover:bg-zinc-700 transition-colors",
                  "flex items-center justify-between",
                  value === option.value
                    ? "text-orange-500 bg-orange-500/10"
                    : "text-zinc-100",
                )}
              >
                {option.label}
                {value === option.value && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface SelectInputProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

export function SelectInput({
  name,
  value,
  onChange,
  options,
  placeholder,
  label,
  required,
  className,
}: SelectInputProps) {
  return (
    <>
      <Select
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        label={label}
        className={className}
      />
      <input type="hidden" name={name} value={value} />
    </>
  );
}
