import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = { credits: number; href?: string };

export function CreditsBadge({ credits, href = "/packs" }: Props) {
  const label =
    credits === 0
      ? "Sin clases"
      : credits === 1
      ? "1 clase"
      : `${credits} clases`;

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all active:scale-95",
        credits === 0
          ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/15"
          : credits <= 3
          ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/15"
          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15"
      )}
    >
      {/* Barbell icon inline */}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 6.5h11M6.5 17.5h11M12 2v20M2 12h4M18 12h4"/>
      </svg>
      {label}
    </Link>
  );
}
