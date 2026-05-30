import { cn } from "@/lib/utils";

type Variant = "available" | "full" | "few" | "waitlist" | "cancelled" | "confirmed";

const variantStyles: Record<Variant, string> = {
  available: "bg-[#27C7B8]/10 text-[#27C7B8] border-[#27C7B8]/30",
  confirmed: "bg-[#27C7B8]/10 text-[#27C7B8] border-[#27C7B8]/30",
  few:       "bg-[#F78837]/10 text-[#F78837] border-[#F78837]/30",
  full:      "bg-[#E61919]/10 text-[#E61919] border-[#E61919]/30",
  waitlist:  "bg-[#F78837]/10 text-[#F78837] border-[#F78837]/30",
  cancelled: "bg-[#1A4A63]/30 text-[#6B8A99] border-[#1A4A63]",
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
        "inline-flex items-center border px-2 py-0.5",
        "text-[10px] font-[family-name:var(--font-jetbrains)] uppercase tracking-[0.06em]",
        "rounded-[4px]",
        variantStyles[variant],
        className
      )}
    >
      {label ?? labels[variant]}
    </span>
  );
}
