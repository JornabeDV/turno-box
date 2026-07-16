"use client";

import { cn } from "@/lib/utils";
import { useTheme } from "./useTheme";

const options = [
  { value: "light" as const, label: "Claro" },
  { value: "dark" as const, label: "Oscuro" },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-2">
      <p className="text-sm md:text-base font-medium text-primary font-[family-name:var(--font-oswald)] uppercase tracking-tight">
        Modo
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            className={cn(
              "px-4 py-2 text-xs sm:text-sm font-medium uppercase tracking-wider border transition-colors",
              theme === option.value
                ? "bg-brand/10 text-brand border-brand"
                : "bg-card text-secondary border-border hover:text-primary hover:border-secondary"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
