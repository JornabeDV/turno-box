"use client";

import { useState, useTransition } from "react";
import { CalendarBlank, Clock, User, CheckCircle, Hourglass } from "@phosphor-icons/react";
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
  const [error, setError] = useState<string | null>(null);

  const staggerClass = `stagger-${Math.min(index + 1, 6)}`;

  if (cancelled) return null; // fade out tras cancelar

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelBookingAction(booking.id);
      if (result.success) {
        setCancelled(true);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-4 animate-in",
        staggerClass,
        booking.status === "CONFIRMED" && "border-emerald-500/20",
        booking.status === "WAITLISTED" && "border-orange-500/20"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-zinc-100 text-base leading-tight">
          {booking.class.name}
        </h3>
        <Badge
          variant={booking.status === "CONFIRMED" ? "confirmed" : "waitlist"}
          className="shrink-0"
        />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <CalendarBlank size={13} />
          <span className="capitalize">
            {formatDate(new Date(booking.classDate))}
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={13} />
          <span className="font-mono tabular-nums">
            {formatTime(booking.class.startTime)} – {formatTime(booking.class.endTime)}
          </span>
        </span>
        {booking.class.coachName && (
          <span className="flex items-center gap-1.5">
            <User size={13} />
            {booking.class.coachName}
          </span>
        )}
      </div>

      {booking.status === "WAITLISTED" && booking.waitlistPos && (
        <div className="flex items-center gap-2 rounded-xl bg-orange-500/10 border border-orange-500/20 px-3 py-2 mb-3">
          <Hourglass size={13} className="text-orange-400" />
          <span className="text-xs text-orange-400">
            Posición {booking.waitlistPos} en lista de espera
          </span>
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-400 mb-3">{error}</p>
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
  );
}
