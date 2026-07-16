import { cn } from "@/lib/utils";

type Variant = "available" | "full" | "few" | "waitlist" | "cancelled" | "confirmed";

const variantStyles: Record<Variant, string> = {
  available: "bg-success/10 text-success border-success/30",
  confirmed: "bg-success/10 text-success border-success/30",
  few:       "bg-brand/10 text-brand border-brand/30",
  full:      "bg-danger/10 text-danger border-danger/30",
  waitlist:  "bg-brand/10 text-brand border-brand/30",
  cancelled: "bg-border/30 text-secondary border-border",
};

const labels: Record<Variant, string> = {
  available: "Disponible",
  confirmed: "Confirmado",
  few:       "Pocos cupos",
  full:      "Completo",
  waitlist:  "En espera",
  cancelled: "Cancelado",
};

type BadgeProps = {
  variant: Variant;
  label?: string;
  className?: string;
};

export function Badge({ variant, label, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-0.5 md:px-2.5 md:py-1",
        "text-[10px] md:text-xs font-[family-name:var(--font-jetbrains)] uppercase tracking-[0.06em]",
        "rounded-[4px]",
        variantStyles[variant],
        className
      )}
    >
      {label ?? labels[variant]}
    </span>
  );
}
