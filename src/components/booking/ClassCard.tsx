"use client";

import { useState, useTransition } from "react";
import { Clock, User, CheckCircle, Hourglass, X } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, formatTime, spotsVariant } from "@/lib/utils";
import { bookClassAction, cancelBookingAction } from "@/actions/bookings";
import type { ClassSlot } from "@/types";

type Props = {
  slot: ClassSlot;
  dateStr: string; // "2025-04-07"
  index: number;   // para stagger
};

type FeedbackState = "idle" | "confirmed" | "waitlisted" | "cancelled" | "error";

export function ClassCard({ slot, dateStr, index }: Props) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<FeedbackState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const staggerClass = `stagger-${Math.min(index + 1, 6)}` as string;
  const spotsV = spotsVariant(slot.availableSpots, slot.maxCapacity);

  const badgeVariant = slot.userBooking?.status === "CONFIRMED"
    ? "confirmed"
    : slot.userBooking?.status === "WAITLISTED"
    ? "waitlist"
    : slot.isFull
    ? "full"
    : spotsV;

  function handleBook() {
    startTransition(async () => {
      setFeedback("idle");
      setErrorMsg(null);
      const result = await bookClassAction(slot.id, dateStr);
      if (result.success) {
        setFeedback(result.data.status === "CONFIRMED" ? "confirmed" : "waitlisted");
      } else {
        setFeedback("error");
        setErrorMsg(result.error);
      }
    });
  }

  function handleCancel() {
    if (!slot.userBooking) return;
    startTransition(async () => {
      setFeedback("idle");
      const result = await cancelBookingAction(slot.userBooking!.id);
      if (result.success) {
        setFeedback("cancelled");
      } else {
        setFeedback("error");
        setErrorMsg(result.error);
      }
    });
  }

  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-4 press-scale animate-in",
        staggerClass,
        slot.userBooking?.status === "CONFIRMED" && "border-emerald-500/20",
        slot.userBooking?.status === "WAITLISTED" && "border-orange-500/20"
      )}
    >
      {/* Fila superior: hora + badge de estado */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {/* Pastilla de color de la clase */}
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
            <User size={12} />
            {slot.coachName}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock size={12} />
          <span className={cn(
            "tabular-nums",
            slot.availableSpots === 0 && "text-rose-400",
            slot.availableSpots <= Math.ceil(slot.maxCapacity * 0.25) && slot.availableSpots > 0 && "text-amber-400"
          )}>
            {slot.confirmedCount}/{slot.maxCapacity} cupos
          </span>
        </span>
      </div>

      {/* Feedback inline */}
      {feedback === "confirmed" && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 mb-3">
          <CheckCircle size={14} className="text-emerald-400" />
          <span className="text-xs text-emerald-400 font-medium">Turno reservado</span>
        </div>
      )}
      {feedback === "waitlisted" && (
        <div className="flex items-center gap-2 rounded-xl bg-orange-500/10 border border-orange-500/20 px-3 py-2 mb-3">
          <Hourglass size={14} className="text-orange-400" />
          <span className="text-xs text-orange-400 font-medium">En lista de espera</span>
        </div>
      )}
      {feedback === "cancelled" && (
        <div className="flex items-center gap-2 rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 mb-3">
          <X size={14} className="text-zinc-400" />
          <span className="text-xs text-zinc-400 font-medium">Turno cancelado</span>
        </div>
      )}
      {feedback === "error" && errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2 mb-3">
          <span className="text-xs text-rose-400">{errorMsg}</span>
        </div>
      )}

      {/* Acción */}
      {slot.userBooking?.status === "CONFIRMED" || feedback === "confirmed" ? (
        <Button
          variant="danger"
          size="sm"
          fullWidth
          loading={isPending}
          onClick={handleCancel}
        >
          Cancelar turno
        </Button>
      ) : slot.userBooking?.status === "WAITLISTED" || feedback === "waitlisted" ? (
        <Button
          variant="ghost"
          size="sm"
          fullWidth
          loading={isPending}
          onClick={handleCancel}
        >
          Salir de la lista
        </Button>
      ) : slot.isFull && feedback === "idle" ? (
        <Button
          variant="outline"
          size="md"
          fullWidth
          loading={isPending}
          onClick={handleBook}
        >
          Unirme a lista de espera
        </Button>
      ) : feedback === "idle" ? (
        <Button
          variant="brand"
          size="lg"
          fullWidth
          loading={isPending}
          onClick={handleBook}
        >
          Reservar
        </Button>
      ) : null}
    </div>
  );
}
