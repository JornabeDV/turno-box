"use client";

import { useState, useTransition } from "react";
import { Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import { cancelBookingAction } from "@/actions/bookings";

export function RemoveAttendeeButton({ bookingId }: { bookingId: string }) {
  const [isPending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);

  if (removed) return null;

  return (
    <button
      onClick={() => {
        if (!confirm("¿Eliminar esta reserva?")) return;
        startTransition(async () => {
          const result = await cancelBookingAction(bookingId);
          if (result.success) {
            setRemoved(true);
            toast.success("Reserva eliminada");
          } else {
            toast.error(result.error);
          }
        });
      }}
      disabled={isPending}
      className="size-7 rounded-lg flex items-center justify-center text-zinc-700 hover:text-rose-400 hover:bg-rose-500/10 transition-all active:scale-90 disabled:opacity-40"
    >
      {isPending
        ? <span className="size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
        : <Trash size={13} />
      }
    </button>
  );
}
