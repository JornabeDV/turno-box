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
        "block bg-card border border-border press-scale animate-in",
        staggerClass,
        isConfirmed && "border-l-2 border-l-success",
        !isConfirmed && slot.userBooking?.status === "WAITLISTED" && "border-l-2 border-l-brand"
      )}
    >
      <div className="p-4 md:p-6">
        {/* Fila superior: turno + badge */}
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <span className="text-[10px] md:text-xs font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-success">
            {timeLabel}
          </span>
          <Badge variant={badgeVariant} />
        </div>

        {/* Horario grande */}
        <div className="flex items-baseline gap-2 md:gap-3 mb-3 md:mb-4">
          <span className="text-xl md:text-3xl font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight">
            {formatTime(slot.startTime)}
          </span>
          <span className="text-xs md:text-sm text-muted">—</span>
          <span className="text-sm md:text-base font-[family-name:var(--font-jetbrains)] text-secondary uppercase">
            {formatTime(slot.endTime)}
          </span>
        </div>

        {/* Nombre de clase */}
        <h3 className="font-[family-name:var(--font-oswald)] font-bold text-primary text-base md:text-xl uppercase tracking-tight mb-3 md:mb-4">
          {slot.name}
        </h3>

        {/* Fila inferior: cupos + CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 md:gap-2">
            <span className="text-xs md:text-sm font-[family-name:var(--font-jetbrains)] uppercase text-secondary">
              Cupos
            </span>
            <span className="text-sm md:text-base font-[family-name:var(--font-jetbrains)] text-success uppercase">
              {String(slot.confirmedCount).padStart(2, "0")}/{String(slot.maxCapacity).padStart(2, "0")}
            </span>
            <span className="text-[10px] md:text-xs font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-success">
              reservado
            </span>
          </div>

          {isConfirmed ? (
            <span className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 bg-success text-page text-xs md:text-sm font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wide">
              Clase reservada
            </span>
          ) : isFull ? (
            <span className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 border border-danger text-danger text-xs md:text-sm font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wide">
              Lista de espera
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 border border-brand text-brand text-xs md:text-sm font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wide">
              Reservar clase
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
