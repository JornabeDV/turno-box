"use client";

import Link from "next/link";
import { cn, formatTime, spotsVariant } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { ClassSlot } from "@/types";

type Props = {
  slot: ClassSlot;
  dateStr: string;
  index: number;
};

export function ClassCardCompact({ slot, dateStr, index }: Props) {
  const staggerClass = `stagger-${Math.min(index + 1, 6)}`;

  const badgeVariant =
    slot.userBooking?.status === "CONFIRMED"
      ? "confirmed"
      : slot.userBooking?.status === "WAITLISTED"
      ? "waitlist"
      : slot.isFull
      ? "full"
      : spotsVariant(slot.availableSpots, slot.maxCapacity);

  return (
    <Link
      href={`/classes/${slot.id}?date=${dateStr}`}
      className={cn(
        "glass-card glass-interactive rounded-2xl px-4 py-3.5 flex items-center gap-3 press-scale animate-in",
        staggerClass,
        slot.userBooking?.status === "CONFIRMED" && "border-blue-500/20",
        slot.userBooking?.status === "WAITLISTED" && "border-orange-500/20"
      )}
    >
      {/* Dot de disciplina */}
      <span
        className="size-2.5 rounded-full shrink-0"
        style={{ backgroundColor: slot.color ?? "#f97316" }}
      />

      {/* Hora de inicio */}
      <span className="font-mono text-sm tabular-nums text-zinc-400 shrink-0">
        {formatTime(slot.startTime)}
      </span>

      {/* Disciplina */}
      <span className="flex-1 font-semibold text-zinc-100 text-sm truncate">
        {slot.name}
      </span>

      {/* Badge + chevron */}
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={badgeVariant} />
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-zinc-600"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </Link>
  );
}
