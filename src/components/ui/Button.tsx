"use client";

import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "brand" | "ghost" | "danger" | "outline" | "success" | "outline-brand";
type Size = "sm" | "md" | "lg";

const variantStyles: Record<Variant, string> = {
  brand:
    "bg-brand text-page hover:bg-brand-hover",
  ghost:
    "bg-transparent text-primary hover:bg-panel",
  danger:
    "bg-transparent text-danger border border-danger/40 hover:bg-danger/10",
  outline:
    "bg-transparent text-primary border border-border hover:border-brand hover:text-brand",
  success:
    "bg-success text-page hover:bg-success-hover",
  "outline-brand":
    "bg-transparent text-brand border border-brand hover:bg-brand hover:text-page",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-10 md:h-12 px-4   text-xs  rounded-[2px]",
  md: "h-12 md:h-14 px-5   text-xs md:text-sm  rounded-[2px]",
  lg: "h-12 md:h-14 px-6   text-sm md:text-base rounded-[2px]",
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
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
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
