import { cn } from "@/lib/utils";

type Variant = "available" | "full" | "few" | "waitlist" | "cancelled" | "confirmed";

const variantStyles: Record<Variant, string> = {
  available: "bg-emerald-950 text-emerald-400 border-emerald-900",
  confirmed:  "bg-blue-950 text-blue-400 border-blue-900",
  few:        "bg-amber-950  text-amber-400  border-amber-900",
  full:       "bg-rose-950   text-rose-400   border-rose-900",
  waitlist:   "bg-orange-950 text-orange-400 border-orange-900",
  cancelled:  "bg-zinc-800   text-zinc-400   border-zinc-700",
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
        "inline-flex items-center rounded-full border px-2.5 py-0.5",
        "text-[10px] font-medium uppercase tracking-[0.08em]",
        variantStyles[variant],
        className
      )}
    >
      {label ?? labels[variant]}
    </span>
  );
}
