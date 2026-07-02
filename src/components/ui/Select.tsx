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
  error?: string;
  className?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Seleccionar",
  label,
  error,
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
        <label className="text-xs sm:text-sm font-medium text-[#6B8A99] uppercase tracking-wider block mb-1.5 font-[family-name:var(--font-oswald)]">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full h-12 bg-[#0A1F2A] border border-[#1A4A63] px-3.5 text-xs sm:text-base text-[#EAEAEA]",
          "flex items-center justify-between gap-2",
          "focus:outline-none focus:border-[#F78837]",
          "transition-colors hover:border-[#6B8A99]",
          selected ? "text-[#EAEAEA]" : "text-[#4A6B7A]",
          error && "border-[#E61919] focus:border-[#E61919]",
        )}
      >
        <span>{selected?.label || placeholder}</span>
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
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full px-3.5 py-2.5 text-sm sm:text-base text-left hover:bg-[#143D52] transition-colors",
                  "flex items-center justify-between",
                  value === option.value
                    ? "text-[#F78837] bg-[#F78837]/10"
                    : "text-[#EAEAEA]",
                )}
              >
                {option.label}
                {value === option.value && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>
      )}
      {error && (
        <p className="mt-1 text-xs text-[#E61919]">{error}</p>
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
  error?: string;
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
  error,
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
        error={error}
        className={className}
      />
      <input type="hidden" name={name} value={value} />
    </>
  );
}

interface MultiSelectProps {
  values: string[];
  onChange: (values: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
}

export function MultiSelect({
  values,
  onChange,
  options,
  placeholder = "Seleccionar",
  label,
  error,
  className,
}: MultiSelectProps) {
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

  const toggle = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  const selectedLabels = options
    .filter((o) => values.includes(o.value))
    .map((o) => o.label);

  const displayText =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length === 1
        ? selectedLabels[0]
        : `${selectedLabels.length} días seleccionados`;

  return (
    <div className={cn("relative", className)} ref={ref}>
      {label && (
        <label className="text-xs sm:text-sm font-medium text-[#6B8A99] uppercase tracking-wider block mb-1.5 font-[family-name:var(--font-oswald)]">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full h-12 bg-[#0A1F2A] border border-[#1A4A63] px-3.5 text-xs sm:text-base text-[#EAEAEA]",
          "flex items-center justify-between gap-2",
          "focus:outline-none focus:border-[#F78837]",
          "transition-colors hover:border-[#6B8A99]",
          selectedLabels.length > 0 ? "text-[#EAEAEA]" : "text-[#4A6B7A]",
          error && "border-[#E61919] focus:border-[#E61919]",
        )}
      >
        <span className="truncate">{displayText}</span>
        <CaretDown
          size={14}
          className={cn(
            "text-[#4A6B7A] transition-transform shrink-0",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-[#0E2A38] border border-[#1A4A63] overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            {options.map((option) => {
              const selected = values.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggle(option.value)}
                  className={cn(
                    "w-full px-3.5 py-2.5 text-sm sm:text-base text-left hover:bg-[#143D52] transition-colors",
                    "flex items-center justify-between",
                    selected
                      ? "text-[#F78837] bg-[#F78837]/10"
                      : "text-[#EAEAEA]",
                  )}
                >
                  {option.label}
                  {selected && <Check size={14} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {error && (
        <p className="mt-1 text-xs text-[#E61919]">{error}</p>
      )}
    </div>
  );
}

interface MultiSelectInputProps {
  name: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

export function MultiSelectInput({
  name,
  values,
  onChange,
  options,
  placeholder,
  label,
  error,
  className,
}: MultiSelectInputProps) {
  return (
    <>
      <MultiSelect
        values={values}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        label={label}
        error={error}
        className={className}
      />
      {values.map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}
    </>
  );
}
