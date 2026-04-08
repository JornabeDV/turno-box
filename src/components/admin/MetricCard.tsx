import { cn } from "@/lib/utils";

type Accent = "orange" | "emerald" | "rose" | "zinc";

const accentStyles: Record<Accent, string> = {
  orange:  "text-orange-500",
  emerald: "text-emerald-500",
  rose:    "text-rose-500",
  zinc:    "text-zinc-300",
};

type Props = {
  label: string;
  value: string | number;
  icon: "calendar" | "check" | "chart" | "x" | "users";
  accent?: Accent;
  large?: boolean;
};

const icons: Record<Props["icon"], React.ReactNode> = {
  calendar: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  ),
  chart: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  x: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  users: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
};

export function MetricCard({ label, value, icon, accent = "zinc", large = false }: Props) {
  return (
    <div className={cn(
      "glass-card rounded-2xl p-4 animate-in",
      large && "col-span-2 md:col-span-4 flex items-center gap-4"
    )}>
      <div className={cn(
        "size-9 rounded-xl flex items-center justify-center shrink-0",
        accent === "orange"  && "bg-orange-500/10 text-orange-500",
        accent === "emerald" && "bg-emerald-500/10 text-emerald-500",
        accent === "rose"    && "bg-rose-500/10 text-rose-500",
        accent === "zinc"    && "bg-zinc-800 text-zinc-400",
      )}>
        {icons[icon]}
      </div>
      <div>
        <p className={cn(
          "font-bold tabular-nums leading-none",
          large ? "text-3xl" : "text-2xl",
          accentStyles[accent]
        )}>
          {value}
        </p>
        <p className="text-xs text-zinc-500 mt-1">{label}</p>
      </div>
    </div>
  );
}
