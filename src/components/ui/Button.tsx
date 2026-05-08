"use client";

import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "brand" | "ghost" | "danger" | "outline" | "success" | "outline-brand";
type Size = "sm" | "md" | "lg";

const variantStyles: Record<Variant, string> = {
  brand:
    "bg-[#F78837] text-[#0A1F2A] hover:bg-[#E07A2E]",
  ghost:
    "bg-transparent text-[#EAEAEA] hover:bg-[#143D52]",
  danger:
    "bg-transparent text-[#E61919] border border-[#E61919]/40 hover:bg-[#E61919]/10",
  outline:
    "bg-transparent text-[#EAEAEA] border border-[#1A4A63] hover:border-[#F78837] hover:text-[#F78837]",
  success:
    "bg-[#27C7B8] text-[#0A1F2A] hover:bg-[#20A898]",
  "outline-brand":
    "bg-transparent text-[#F78837] border border-[#F78837] hover:bg-[#F78837] hover:text-[#0A1F2A]",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-9  px-4   text-xs  rounded-[2px]",
  md: "h-12 px-5   text-sm  rounded-[2px]",
  lg: "h-14 px-6   text-base rounded-[2px]",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "brand",
      size = "md",
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium cursor-pointer",
        "uppercase tracking-wide",
        "transition-all duration-150 ease-out",
        "active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F78837]",
        "disabled:opacity-50 disabled:pointer-events-none",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <span className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
          <span>Cargando...</span>
        </>
      ) : (
        children
      )}
    </button>
  )
);

Button.displayName = "Button";
