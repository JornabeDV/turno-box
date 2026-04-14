"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { bookClassAction, cancelBookingAction } from "@/actions/bookings";

type Booking = {
  id: string;
  status: "CONFIRMED" | "WAITLISTED";
  waitlistPos: number | null;
} | null;

type Props = {
  classId: string;
  dateStr: string;
  userBooking: Booking;
  isFull: boolean;
};

export function BookingActions({
  classId,
  dateStr,
  userBooking: initial,
  isFull,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [booking, setBooking] = useState<Booking>(initial);

  function handleBook() {
    startTransition(async () => {
      const result = await bookClassAction(classId, dateStr);
      if (result.success) {
        setBooking({
          id: result.data.bookingId,
          status: result.data.status,
          waitlistPos: null,
        });
        toast.success(
          result.data.status === "CONFIRMED"
            ? "Turno reservado"
            : "En lista de espera",
        );
        router.push("/");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleCancel() {
    if (!booking) return;
    startTransition(async () => {
      const result = await cancelBookingAction(booking.id);
      if (result.success) {
        setBooking(null);
        toast.success("Turno cancelado");
        router.push("/");
      } else {
        toast.error(result.error);
      }
    });
  }

  if (booking?.status === "CONFIRMED") {
    return (
      <Button
        variant="danger"
        size="sm"
        fullWidth
        loading={isPending}
        onClick={handleCancel}
      >
        Cancelar turno
      </Button>
    );
  }
  if (booking?.status === "WAITLISTED") {
    return (
      <Button
        variant="ghost"
        size="sm"
        fullWidth
        loading={isPending}
        onClick={handleCancel}
      >
        Salir de la lista de espera
      </Button>
    );
  }
  if (isFull) {
    return (
      <Button
        variant="outline"
        size="md"
        fullWidth
        loading={isPending}
        onClick={handleBook}
      >
        Unirme a lista de espera
      </Button>
    );
  }
  return (
    <Button
      variant="brand"
      size="lg"
      fullWidth
      loading={isPending}
      onClick={handleBook}
    >
      Reservar
    </Button>
  );
}
