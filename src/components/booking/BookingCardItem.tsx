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
        "bg-card border border-border animate-in",
        staggerClass,
        booking.status === "CONFIRMED" && "border-l-2 border-l-success",
        booking.status === "WAITLISTED" && "border-l-2 border-l-brand"
      )}
    >
      <div className="p-4 md:p-6">
        <div className="flex items-start justify-between gap-2 md:gap-3 mb-3 md:mb-4">
          <h3 className="font-[family-name:var(--font-oswald)] font-bold text-primary text-base md:text-xl uppercase tracking-tight">
            {booking.class.name}
          </h3>
          <Badge
            variant={booking.status === "CONFIRMED" ? "confirmed" : "waitlist"}
            className="shrink-0"
          />
        </div>

        <div className="flex flex-wrap gap-x-4 md:gap-x-6 gap-y-1.5 md:gap-y-2 mb-4 md:mb-5 text-xs md:text-sm text-secondary">
          <span className="flex items-center gap-1.5 md:gap-2">
            <CalendarBlank size={13} className="md:size-4" />
            <span className="capitalize font-[family-name:var(--font-oswald)]">
              {formatDate(new Date(booking.classDate))}
            </span>
          </span>
          <span className="flex items-center gap-1.5 md:gap-2">
            <Clock size={13} className="md:size-4" />
            <span className="font-[family-name:var(--font-jetbrains)] tabular-nums uppercase">
              {formatTime(booking.class.startTime)} – {formatTime(booking.class.endTime)}
            </span>
          </span>
          {booking.class.coachName && (
            <span className="flex items-center gap-1.5 md:gap-2">
              <User size={13} className="md:size-4" />
              <span className="font-[family-name:var(--font-oswald)]">{booking.class.coachName}</span>
            </span>
          )}
        </div>

        {booking.status === "WAITLISTED" && booking.waitlistPos && (
          <div className="flex items-center gap-2 md:gap-3 border border-brand/30 bg-brand/5 px-3 py-2 md:px-4 md:py-2.5 mb-3 md:mb-4">
            <Hourglass size={13} className="text-brand md:size-4" />
            <span className="text-xs md:text-sm text-brand font-[family-name:var(--font-jetbrains)] uppercase tracking-wider">
              Posición {booking.waitlistPos} en lista de espera
            </span>
          </div>
        )}

        <Button
          variant={booking.status === "CONFIRMED" ? "danger" : "outline"}
          size="lg"
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
