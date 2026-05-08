"use client";

import { useState, useTransition } from "react";
import { CalendarBlank, Clock, User, Hourglass } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, formatTime, formatDate } from "@/lib/utils";
import { cancelBookingAction } from "@/actions/bookings";
import type { BookingCard } from "@/types";

type Props = {
  booking: BookingCard;
  index: number;
};

export function BookingCardItem({ booking, index }: Props) {
  const [isPending, startTransition] = useTransition();
  const [cancelled, setCancelled] = useState(false);

  const staggerClass = `stagger-${Math.min(index + 1, 6)}`;

  if (cancelled) return null;

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelBookingAction(booking.id);
      if (result.success) {
        setCancelled(true);
        toast.success("Turno cancelado");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div
      className={cn(
        "bg-[#0E2A38] border border-[#1A4A63] animate-in",
        staggerClass,
        booking.status === "CONFIRMED" && "border-l-2 border-l-[#27C7B8]",
        booking.status === "WAITLISTED" && "border-l-2 border-l-[#F78837]"
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] text-base uppercase tracking-tight">
            {booking.class.name}
          </h3>
          <Badge
            variant={booking.status === "CONFIRMED" ? "confirmed" : "waitlist"}
            className="shrink-0"
          />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4 text-xs text-[#6B8A99]">
          <span className="flex items-center gap-1.5">
            <CalendarBlank size={13} />
            <span className="capitalize font-[family-name:var(--font-oswald)]">
              {formatDate(new Date(booking.classDate))}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={13} />
            <span className="font-[family-name:var(--font-jetbrains)] tabular-nums uppercase">
              {formatTime(booking.class.startTime)} – {formatTime(booking.class.endTime)}
            </span>
          </span>
          {booking.class.coachName && (
            <span className="flex items-center gap-1.5">
              <User size={13} />
              <span className="font-[family-name:var(--font-oswald)]">{booking.class.coachName}</span>
            </span>
          )}
        </div>

        {booking.status === "WAITLISTED" && booking.waitlistPos && (
          <div className="flex items-center gap-2 border border-[#F78837]/30 bg-[#F78837]/5 px-3 py-2 mb-3">
            <Hourglass size={13} className="text-[#F78837]" />
            <span className="text-xs text-[#F78837] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider">
              Posición {booking.waitlistPos} en lista de espera
            </span>
          </div>
        )}

        <Button
          variant={booking.status === "CONFIRMED" ? "danger" : "ghost"}
          size="sm"
          fullWidth
          loading={isPending}
          onClick={handleCancel}
        >
          {booking.status === "CONFIRMED" ? "Cancelar turno" : "Salir de lista"}
        </Button>
      </div>
    </div>
  );
}
