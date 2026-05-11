import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = { credits: number; href?: string };

export function CreditsBadge({ credits, href = "/packs" }: Props) {
  const isZero = credits === 0;
  const isLow = credits > 0 && credits <= 3;

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 border text-[10px] transition-all active:scale-95",
        "font-[family-name:var(--font-oswald)] uppercase tracking-wide rounded-[4px]",
        isZero
          ? "border-[#E61919]/40 text-[#E61919] hover:bg-[#E61919]/10"
          : isLow
          ? "border-[#F78837]/40 text-[#F78837] hover:bg-[#F78837]/10"
          : "border-[#27C7B8]/40 text-[#27C7B8] hover:bg-[#27C7B8]/10"
      )}
    >
      <span className="font-[family-name:var(--font-jetbrains)] text-sm font-medium">
        {credits}
      </span>
      <span className="text-sm">{credits === 1 ? "CLASE" : "CLASES"}</span>
    </Link>
  );
}
