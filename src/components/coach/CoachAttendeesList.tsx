"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { TrashIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { removeBookingByCoachAction } from "@/actions/bookings";

type Booking = {
  id: string;
  status: "CONFIRMED" | "WAITLISTED";
  waitlistPos: number | null;
  attendedAt: Date | null;
  createdAt: Date;
  credits: number;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

interface Props {
  bookings: Booking[];
  title: string;
  emptyMessage?: string;
  accent: "emerald" | "orange";
}

const accentDot: Record<Props["accent"], string> = {
  emerald: "bg-[#27C7B8]",
  orange: "bg-[#F78837]",
};

const accentCounter: Record<Props["accent"], string> = {
  emerald: "text-[#27C7B8]",
  orange: "text-[#F78837]",
};

export function CoachAttendeesList({
  bookings,
  title,
  emptyMessage,
  accent,
}: Props) {
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  function handleRemove(bookingId: string) {
    startTransition(async () => {
      const result = await removeBookingByCoachAction(bookingId);
      if (result.success) {
        setRemovedIds((prev) => new Set(prev).add(bookingId));
        toast.success("Alumno eliminado");
      } else {
        toast.error(result.error ?? "No se pudo eliminar al alumno");
      }
    });
  }

  const visibleBookings = bookings.filter((b) => !removedIds.has(b.id));

  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-center gap-2 mb-2 md:mb-3 px-1">
        <span className={cn("size-1.5 rounded-full", accentDot[accent])} />
        <h3 className="text-xs md:text-base font-semibold text-[#6B8A99] uppercase tracking-wider flex-1">
          {title}
        </h3>
        <span
          className={cn(
            "text-xs md:text-base font-mono font-bold tabular-nums",
            accentCounter[accent]
          )}
        >
          {visibleBookings.length}
        </span>
      </div>

      <div className="bg-[#0E2A38] border border-[#1A4A63] overflow-hidden">
        {visibleBookings.length === 0 ? (
          <p className="text-xs md:text-base text-[#4A6B7A] text-center py-8 md:py-10">
            {emptyMessage ?? "Sin registros."}
          </p>
        ) : (
          <div className="divide-y divide-[#1A4A63]">
            {visibleBookings.map((b, i) => {
              const initials = b.user.name
                ? b.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : b.user.email[0].toUpperCase();

              return (
                <div
                  key={b.id}
                  className={cn(
                    "flex items-center gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-5",
                    "animate-in",
                    `stagger-${Math.min(i + 1, 6)}`
                  )}
                >
                  {/* Posición / espera */}
                  <span className="text-xs md:text-base font-mono text-[#4A6B7A] w-5 md:w-6 text-right shrink-0">
                    {b.status === "WAITLISTED" ? `#${b.waitlistPos}` : `${i + 1}`}
                  </span>

                  {/* Avatar */}
                  <div className="size-8 md:size-11 rounded-[2px] bg-[#0E2A38] border border-[#1A4A63] flex items-center justify-center text-xs md:text-base font-semibold text-[#EAEAEA] shrink-0">
                    {initials}
                  </div>

                  {/* Nombre + email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm md:text-lg font-medium text-[#EAEAEA] truncate leading-tight">
                      {b.user.name ?? "—"}
                    </p>
                    <p className="text-xs md:text-sm text-[#4A6B7A] truncate">{b.user.email}</p>
                  </div>

                  {/* Créditos */}
                  <div className="text-right shrink-0 hidden sm:block">
                    <p
                      className={cn(
                        "text-xs md:text-base font-mono font-medium",
                        b.credits > 0 ? "text-[#27C7B8]" : "text-[#E61919]"
                      )}
                    >
                      {b.credits} crédito{b.credits !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Hora de reserva */}
                  <span className="text-xs md:text-base text-[#4A6B7A] font-mono shrink-0 hidden sm:block">
                    {new Date(b.createdAt).toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>

                  {/* Eliminar */}
                  <button
                    onClick={() => handleRemove(b.id)}
                    disabled={isPending}
                    className="size-8 md:size-10 cursor-pointer rounded-[2px] flex items-center justify-center text-[#6B8A99] hover:text-[#E61919] hover:bg-[#E61919]/10 transition-all active:scale-90 disabled:opacity-40 shrink-0"
                  >
                    <TrashIcon size={16} weight="bold" className="md:size-5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
