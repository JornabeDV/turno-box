"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { TrashIcon, CheckIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { removeBookingByCoachAction, toggleBookingAttendanceAction } from "@/actions/bookings";

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
  emerald: "bg-success",
  orange: "bg-brand",
};

const accentCounter: Record<Props["accent"], string> = {
  emerald: "text-success",
  orange: "text-brand",
};

export function CoachAttendeesList({
  bookings,
  title,
  emptyMessage,
  accent,
}: Props) {
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [attendedMap, setAttendedMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(bookings.map((b) => [b.id, !!b.attendedAt]))
  );
  const [isPending, startTransition] = useTransition();
  const [attendancePending, setAttendancePending] = useState<Set<string>>(new Set());
  const [removeTarget, setRemoveTarget] = useState<Booking | null>(null);

  useEffect(() => {
    setAttendedMap(Object.fromEntries(bookings.map((b) => [b.id, !!b.attendedAt])));
  }, [bookings]);

  function handleRemove(bookingId: string) {
    startTransition(async () => {
      const result = await removeBookingByCoachAction(bookingId);
      setRemoveTarget(null);
      if (result.success) {
        setRemovedIds((prev) => new Set(prev).add(bookingId));
        toast.success("Alumno eliminado");
      } else {
        toast.error(result.error ?? "No se pudo eliminar al alumno");
      }
    });
  }

  const removeTargetName = removeTarget?.user.name ?? removeTarget?.user.email ?? "este alumno";

  function handleToggleAttendance(bookingId: string) {
    setAttendancePending((prev) => new Set(prev).add(bookingId));
    startTransition(async () => {
      const result = await toggleBookingAttendanceAction(bookingId);
      setAttendancePending((prev) => {
        const next = new Set(prev);
        next.delete(bookingId);
        return next;
      });
      if (result.success) {
        setAttendedMap((prev) => ({
          ...prev,
          [bookingId]: !!result.data.attendedAt,
        }));
        toast.success(result.data.attendedAt ? "Asistencia marcada" : "Asistencia desmarcada");
      } else {
        toast.error(result.error);
      }
    });
  }

  const visibleBookings = bookings.filter((b) => !removedIds.has(b.id));

  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-center gap-2 mb-2 md:mb-3 px-1">
        <span className={cn("size-1.5 rounded-full", accentDot[accent])} />
        <h3 className="text-xs md:text-base font-semibold text-secondary uppercase tracking-wider flex-1">
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

      <div className="bg-card border border-border overflow-hidden">
        {visibleBookings.length === 0 ? (
          <p className="text-xs md:text-base text-muted text-center py-8 md:py-10">
            {emptyMessage ?? "Sin registros."}
          </p>
        ) : (
          <div className="divide-y divide-border">
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
                  <span className="text-xs md:text-base font-mono text-muted w-5 md:w-6 text-left shrink-0">
                    {b.status === "WAITLISTED" ? `#${b.waitlistPos}` : `${i + 1}`}
                  </span>

                  {/* Avatar */}
                  <div className="size-8 md:size-11 rounded-[2px] bg-card border border-border flex items-center justify-center text-xs md:text-base font-semibold text-primary shrink-0">
                    {initials}
                  </div>

                  {/* Nombre + email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm md:text-lg font-medium text-primary truncate leading-tight">
                      {b.user.name ?? "—"}
                    </p>
                    <p className="text-xs md:text-sm text-muted truncate">{b.user.email}</p>
                  </div>

                  {/* Créditos */}
                  <div className="text-right shrink-0 hidden sm:block">
                    <p
                      className={cn(
                        "text-xs md:text-base font-mono font-medium",
                        b.credits > 0 ? "text-success" : "text-danger"
                      )}
                    >
                      {b.credits} crédito{b.credits !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Hora de reserva */}
                  <span className="text-xs md:text-base text-muted font-mono shrink-0 hidden sm:block">
                    {new Date(b.createdAt).toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>

                  {/* Asistencia */}
                  <button
                    type="button"
                    onClick={() => handleToggleAttendance(b.id)}
                    disabled={attendancePending.has(b.id)}
                    className={cn(
                      "size-8 md:size-10 cursor-pointer rounded-[2px] flex items-center justify-center transition-all active:scale-90 disabled:opacity-40 shrink-0 border",
                      attendedMap[b.id]
                        ? "bg-success border-success text-page"
                        : "border-border text-secondary hover:border-success hover:text-success"
                    )}
                    aria-label={attendedMap[b.id] ? "Desmarcar asistencia" : "Marcar asistencia"}
                  >
                    {attendedMap[b.id] && (
                      <CheckIcon size={16} weight="bold" className="md:size-5" />
                    )}
                  </button>

                  {/* Eliminar */}
                  <button
                    type="button"
                    onClick={() => setRemoveTarget(b)}
                    disabled={isPending}
                    className={cn(
                      "size-8 md:size-10 cursor-pointer rounded-[2px] flex items-center justify-center transition-all active:scale-90 disabled:opacity-40 shrink-0 border",
                      "border-border text-secondary hover:border-danger hover:text-danger"
                    )}
                    aria-label="Eliminar alumno"
                  >
                    <TrashIcon size={16} weight="bold" className="md:size-5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Eliminar alumno"
        description={`¿Estás seguro de que querés eliminar a ${removeTargetName} de la clase?`}
        size="sm"
      >
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            size="md"
            fullWidth
            onClick={() => setRemoveTarget(null)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            fullWidth
            loading={isPending}
            onClick={() => removeTarget && handleRemove(removeTarget.id)}
          >
            Eliminar
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
