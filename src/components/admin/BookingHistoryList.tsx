"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

type SerializedBooking = {
  id: string;
  status: string;
  classDate: string;
  waitlistPos: number | null;
  cancelledAt: string | null;
  class: {
    startTime: string;
    endTime: string;
    color: string | null;
    discipline: { name: string } | null;
  };
};

interface BookingHistoryListProps {
  bookings: SerializedBooking[];
}

const INITIAL_COUNT = 10;
const INCREMENT = 10;

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5);
}

export function BookingHistoryList({ bookings }: BookingHistoryListProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const hasMore = visibleCount < bookings.length;

  if (bookings.length === 0) {
    return (
      <p className="text-xs md:text-sm text-muted text-center py-12">
        Sin turnos registrados.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border">
      {bookings.slice(0, visibleCount).map((b) => {
        const isPast = new Date(b.classDate) < new Date();
        return (
          <div key={b.id} className="flex items-center gap-3 px-4 md:px-5 py-3 md:py-4">
            <span
              className={cn(
                "size-1.5 rounded-full shrink-0",
                b.status === "CANCELLED" && "bg-muted",
                b.status === "WAITLISTED" && "bg-brand",
                b.status === "CONFIRMED" && isPast && "bg-emerald-600",
                b.status === "CONFIRMED" && !isPast && "bg-success",
              )}
            />
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm md:text-base font-medium truncate",
                  b.status === "CANCELLED"
                    ? "text-muted line-through"
                    : "text-primary",
                )}
              >
                {b.class.discipline?.name ?? "Sin disciplina"}
              </p>
              <p className="text-xs md:text-sm text-muted">
                {formatDate(b.classDate)} · {formatTime(b.class.startTime)}
                {b.status === "WAITLISTED" && b.waitlistPos !== null && (
                  <span className="ml-2 text-brand">
                    #{b.waitlistPos} en espera
                  </span>
                )}
                {b.status === "CANCELLED" && b.cancelledAt && (
                  <span className="ml-2 text-muted">
                    cancelado{" "}
                    {new Date(b.cancelledAt).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                      timeZone: "UTC",
                    })}
                  </span>
                )}
              </p>
            </div>
            <span
              className={cn(
                "text-xs md:text-sm font-medium shrink-0",
                b.status === "CONFIRMED" && isPast && "text-emerald-600",
                b.status === "CONFIRMED" && !isPast && "text-success",
                b.status === "CANCELLED" && "text-muted",
                b.status === "WAITLISTED" && "text-brand",
              )}
            >
              {b.status === "CONFIRMED" && isPast && "Asistió"}
              {b.status === "CONFIRMED" && !isPast && "Confirmado"}
              {b.status === "CANCELLED" && "Canceló"}
              {b.status === "WAITLISTED" && "En espera"}
            </span>
          </div>
        );
      })}

      {hasMore && (
        <div className="py-5 flex justify-center">
          <Button
            variant="outline"
            size="md"
            onClick={() => setVisibleCount((c) => c + INCREMENT)}
          >
            Cargar más turnos
          </Button>
        </div>
      )}
    </div>
  );
}
