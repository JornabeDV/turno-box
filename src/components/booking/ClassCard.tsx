"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClockIcon, UserIcon } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
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
  // Estado local del booking — se actualiza optimistamente sin esperar re-render del server
  const [localBooking, setLocalBooking] = useState<LocalBooking>(
    slot.userBooking as LocalBooking ?? null
  );

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
    startTransition(async () => {
      const result = await bookClassAction(slot.id, dateStr);
      if (result.success) {
        setLocalBooking({ id: result.data.bookingId, status: result.data.status, waitlistPos: null });
        if (result.data.status === "CONFIRMED") {
          toast.success("Turno reservado");
        } else {
          toast("En lista de espera", { icon: "⏳" });
        }
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleCancel() {
    if (!localBooking) return;
    startTransition(async () => {
      const result = await cancelBookingAction(localBooking.id);
      if (result.success) {
        setLocalBooking(null);
        toast.success("Turno cancelado");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div
      className={cn(
        "bg-[#0E2A38] border border-[#1A4A63] p-4 press-scale animate-in",
        staggerClass,
        localBooking?.status === "CONFIRMED" && "border-l-2 border-l-[#27C7B8]",
        localBooking?.status === "WAITLISTED" && "border-l-2 border-l-[#F78837]"
      )}
    >
      {/* Fila superior: hora + badge de estado */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span
            className="size-2.5 shrink-0"
            style={{ backgroundColor: slot.color ?? "#F78837" }}
          />
          <span className="font-[family-name:var(--font-jetbrains)] text-xs text-[#6B8A99] tabular-nums uppercase">
            {formatTime(slot.startTime)}
          </span>
          <span className="text-[#4A6B7A] text-xs">—</span>
          <span className="font-[family-name:var(--font-jetbrains)] text-xs text-[#4A6B7A] tabular-nums uppercase">
            {formatTime(slot.endTime)}
          </span>
        </div>
        <Badge variant={badgeVariant} />
      </div>

      {/* Nombre de la clase */}
      <h3 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] text-base uppercase tracking-tight mb-1">
        {slot.name}
      </h3>

      {/* Coach + cupos */}
      <div className="flex items-center gap-3 text-xs text-[#6B8A99] mb-4">
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
            slot.availableSpots === 0 && "text-[#E61919]",
            slot.availableSpots <= Math.ceil(slot.maxCapacity * 0.25) && slot.availableSpots > 0 && "text-[#F78837]"
          )}>
            {slot.confirmedCount}/{slot.maxCapacity} cupos
          </span>
        </span>
      </div>

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
