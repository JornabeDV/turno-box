"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClockIcon, UserIcon, CheckCircleIcon, HourglassIcon } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, formatTime, spotsVariant } from "@/lib/utils";
import { bookClassAction, cancelBookingAction } from "@/actions/bookings";
import type { ClassSlot } from "@/types";

type Props = {
  slot: ClassSlot;
  dateStr: string;
  index: number;
};

type LocalBooking = {
  id: string;
  status: "CONFIRMED" | "WAITLISTED";
  waitlistPos: number | null;
} | null;

export function ClassCard({ slot, dateStr, index }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Estado local del booking — se actualiza optimistamente sin esperar re-render del server
  const [localBooking, setLocalBooking] = useState<LocalBooking>(
    slot.userBooking as LocalBooking ?? null
  );
  // Banner de feedback post-acción (sólo éxito — el error va en errorMsg)
  const [justBooked, setJustBooked] = useState(false);

  const staggerClass = `stagger-${Math.min(index + 1, 6)}` as string;
  const spotsV = spotsVariant(slot.availableSpots, slot.maxCapacity);

  const badgeVariant = localBooking?.status === "CONFIRMED"
    ? "confirmed"
    : localBooking?.status === "WAITLISTED"
    ? "waitlist"
    : slot.isFull
    ? "full"
    : spotsV;

  function handleBook() {
    setErrorMsg(null);
    setJustBooked(false);
    startTransition(async () => {
      const result = await bookClassAction(slot.id, dateStr);
      if (result.success) {
        setLocalBooking({ id: result.data.bookingId, status: result.data.status, waitlistPos: null });
        setJustBooked(true);
        router.refresh();
      } else {
        setErrorMsg(result.error);
      }
    });
  }

  function handleCancel() {
    if (!localBooking) return;
    setErrorMsg(null);
    setJustBooked(false);
    startTransition(async () => {
      const result = await cancelBookingAction(localBooking.id);
      if (result.success) {
        setLocalBooking(null);
        router.refresh();
      } else {
        setErrorMsg(result.error);
      }
    });
  }

  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-4 press-scale animate-in",
        staggerClass,
        localBooking?.status === "CONFIRMED" && "border-emerald-500/20",
        localBooking?.status === "WAITLISTED" && "border-orange-500/20"
      )}
    >
      {/* Fila superior: hora + badge de estado */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span
            className="size-2.5 rounded-full shrink-0"
            style={{ backgroundColor: slot.color ?? "#f97316" }}
          />
          <span className="font-mono text-xs text-zinc-400 tabular-nums">
            {formatTime(slot.startTime)}
          </span>
          <span className="text-zinc-700 text-xs">—</span>
          <span className="font-mono text-xs text-zinc-500 tabular-nums">
            {formatTime(slot.endTime)}
          </span>
        </div>
        <Badge variant={badgeVariant} />
      </div>

      {/* Nombre de la clase */}
      <h3 className="font-semibold text-zinc-100 text-base leading-tight mb-1">
        {slot.name}
      </h3>

      {/* Coach + cupos */}
      <div className="flex items-center gap-3 text-xs text-zinc-500 mb-4">
        {slot.coachName && (
          <span className="flex items-center gap-1">
            <UserIcon size={12} />
            {slot.coachName}
          </span>
        )}
        <span className="flex items-center gap-1">
          <ClockIcon size={12} />
          <span className={cn(
            "tabular-nums",
            slot.availableSpots === 0 && "text-rose-400",
            slot.availableSpots <= Math.ceil(slot.maxCapacity * 0.25) && slot.availableSpots > 0 && "text-amber-400"
          )}>
            {slot.confirmedCount}/{slot.maxCapacity} cupos
          </span>
        </span>
      </div>

      {/* Banner de reserva exitosa (desaparece al cancelar) */}
      {justBooked && localBooking?.status === "CONFIRMED" && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 mb-3">
          <CheckCircleIcon size={14} className="text-emerald-400" />
          <span className="text-xs text-emerald-400 font-medium">Turno reservado</span>
        </div>
      )}
      {justBooked && localBooking?.status === "WAITLISTED" && (
        <div className="flex items-center gap-2 rounded-xl bg-orange-500/10 border border-orange-500/20 px-3 py-2 mb-3">
          <HourglassIcon size={14} className="text-orange-400" />
          <span className="text-xs text-orange-400 font-medium">En lista de espera</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2 mb-3">
          <span className="text-xs text-rose-400">{errorMsg}</span>
        </div>
      )}

      {/* Acción */}
      {localBooking?.status === "CONFIRMED" ? (
        <Button variant="danger" size="sm" fullWidth loading={isPending} onClick={handleCancel}>
          Cancelar turno
        </Button>
      ) : localBooking?.status === "WAITLISTED" ? (
        <Button variant="ghost" size="sm" fullWidth loading={isPending} onClick={handleCancel}>
          Salir de la lista
        </Button>
      ) : slot.isFull ? (
        <Button variant="outline" size="md" fullWidth loading={isPending} onClick={handleBook}>
          Unirme a lista de espera
        </Button>
      ) : (
        <Button variant="brand" size="lg" fullWidth loading={isPending} onClick={handleBook}>
          Reservar
        </Button>
      )}
    </div>
  );
}
