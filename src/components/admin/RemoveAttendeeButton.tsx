"use client";

import { useState, useTransition } from "react";
import { TrashIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { cancelBookingAction } from "@/actions/bookings";

export function RemoveAttendeeButton({ bookingId }: { bookingId: string }) {
  const [isPending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (removed) return null;

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await cancelBookingAction(bookingId);
      if (result.success) {
        setRemoved(true);
        setOpen(false);
        toast.success("Reserva eliminada");
      } else {
        setError(result.error ?? "No se pudo eliminar la reserva");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="size-8 cursor-pointer rounded-[2px] flex items-center justify-center text-secondary hover:text-danger hover:bg-danger/10 transition-all active:scale-90 disabled:opacity-40"
      >
        {isPending ? (
          <span className="size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          <TrashIcon size={16} weight="bold" />
        )}
      </button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) {
            setOpen(false);
            setError(null);
          }
        }}
        title="Eliminar reserva"
        description="¿Eliminar a este estudiante de la clase?"
        size="sm"
      >
        {error && (
          <div className="mb-4 rounded-[2px] bg-danger/10 border border-danger/20 px-3 py-2">
            <p className="text-xs md:text-sm text-danger">{error}</p>
          </div>
        )}
        <div className="flex max-md:flex-col gap-2 max-md:mt-6">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="md:flex-1"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            className="md:flex-1"
            loading={isPending}
            onClick={handleConfirm}
          >
            Eliminar
          </Button>
        </div>
      </Dialog>
    </>
  );
}
