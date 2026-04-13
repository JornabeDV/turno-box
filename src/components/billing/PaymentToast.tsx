"use client";

import { useEffect } from "react";
import { toast } from "sonner";

type Props = {
  error?: string;
  info?: string;
};

export function PaymentToast({ error, info }: Props) {
  useEffect(() => {
    if (error === "rejected") {
      toast.error("El pago fue rechazado. Podés intentar con otro método de pago.");
    } else if (info === "pending") {
      toast.warning("Tu pago está siendo procesado. Los créditos se acreditarán automáticamente.");
    }
  }, [error, info]);

  return null;
}
