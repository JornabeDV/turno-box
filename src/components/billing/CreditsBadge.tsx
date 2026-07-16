import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = { credits: number; href?: string };

export function CreditsBadge({ credits, href = "/credits" }: Props) {
  const isZero = credits === 0;
  const isLow = credits > 0 && credits <= 3;

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 border text-[10px] transition-all active:scale-95",
        "font-[family-name:var(--font-oswald)] uppercase tracking-wide rounded-[4px]",
        isZero
          ? "border-danger/40 text-danger hover:bg-danger/10"
          : isLow
          ? "border-brand/40 text-brand hover:bg-brand/10"
          : "border-success/40 text-success hover:bg-success/10"
      )}
    >
      <span className="text-sm md:text-base">
        {credits}
      </span>
      <span className="text-sm md:text-base">{credits === 1 ? "CLASE" : "CLASES"}</span>
    </Link>
  );
}
