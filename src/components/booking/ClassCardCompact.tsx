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

function getTimeOfDayLabel(startTime: string): string {
  const [h] = startTime.split(":").map(Number);
  if (h < 12) return "MAÑANA";
  if (h < 17) return "TARDE";
  return "NOCHE";
}

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

  const isConfirmed = slot.userBooking?.status === "CONFIRMED";
  const isFull = slot.isFull && !slot.userBooking;
  const timeLabel = getTimeOfDayLabel(slot.startTime);

  return (
    <Link
      href={`/classes/${slot.id}?date=${dateStr}`}
      className={cn(
        "block bg-[#0E2A38] border border-[#1A4A63] press-scale animate-in",
        staggerClass,
        isConfirmed && "border-l-2 border-l-[#27C7B8]",
        !isConfirmed && slot.userBooking?.status === "WAITLISTED" && "border-l-2 border-l-[#F78837]"
      )}
    >
      <div className="p-4">
        {/* Fila superior: turno + badge */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#27C7B8]">
            {timeLabel}
          </span>
          <Badge variant={badgeVariant} />
        </div>

        {/* Horario grande */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-xl font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight">
            {formatTime(slot.startTime)}
          </span>
          <span className="text-xs text-[#4A6B7A]">—</span>
          <span className="text-sm font-[family-name:var(--font-jetbrains)] text-[#6B8A99] uppercase">
            {formatTime(slot.endTime)}
          </span>
        </div>

        {/* Nombre de clase */}
        <h3 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] text-base uppercase tracking-tight mb-3">
          {slot.name}
        </h3>

        {/* Fila inferior: cupos + CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-[family-name:var(--font-jetbrains)] uppercase text-[#6B8A99]">
              Cupos
            </span>
            <span className="text-sm font-[family-name:var(--font-jetbrains)] text-[#27C7B8] uppercase">
              {String(slot.confirmedCount).padStart(2, "0")}/{String(slot.maxCapacity).padStart(2, "0")}
            </span>
            <span className="text-[10px] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#27C7B8]">
              reservado
            </span>
          </div>

          {isConfirmed ? (
            <span className="inline-flex items-center px-3 py-1.5 bg-[#27C7B8] text-[#0A1F2A] text-xs font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wide">
              Clase reservada
            </span>
          ) : isFull ? (
            <span className="inline-flex items-center px-3 py-1.5 border border-[#E61919] text-[#E61919] text-xs font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wide">
              Lista de espera
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1.5 border border-[#F78837] text-[#F78837] text-xs font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wide">
              Reservar clase
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
