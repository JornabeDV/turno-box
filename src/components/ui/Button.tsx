"use client";

import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "brand" | "ghost" | "danger" | "outline" | "success";
type Size = "sm" | "md" | "lg";

const variantStyles: Record<Variant, string> = {
  brand:   "bg-orange-500 text-white hover:bg-orange-600 shadow-[0_0_20px_rgba(249,115,22,.2)]",
  ghost:   "bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white",
  danger:  "bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20",
  outline: "bg-transparent text-zinc-200 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50",
  success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8  px-3   text-xs  rounded-lg",
  md: "h-11 px-5   text-sm  rounded-xl",
  lg: "h-14 px-6   text-base rounded-xl",
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
        "transition-all duration-150 ease-out",
        "active:scale-[0.97]",                    // tactile press
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900",
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
