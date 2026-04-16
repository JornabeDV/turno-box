"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

interface PaymentData {
  status: PaymentStatus;
  creditsGranted: number;
  pack: { name: string } | null;
}

const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS  = 30_000;

export function PaymentSuccessClient({ paymentId }: { paymentId: string }) {
  const [data, setData]       = useState<PaymentData | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let stopped  = false;
    const startedAt = Date.now();

    async function poll() {
      try {
        const res = await fetch(`/api/payment-status/${paymentId}`);
        if (!res.ok) return;
        const json: PaymentData = await res.json();
        setData(json);
        if (json.status === "APPROVED" || json.status === "REJECTED" || json.status === "CANCELLED") {
          stopped = true;
          return;
        }
      } catch {
        // red floja, reintentamos
      }

      if (stopped) return;

      if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
        setTimedOut(true);
        return;
      }

      setTimeout(poll, POLL_INTERVAL_MS);
    }

    poll();
    return () => { stopped = true; };
  }, [paymentId]);

  const approved = data?.status === "APPROVED";
  const failed   = data?.status === "REJECTED" || data?.status === "CANCELLED";
  const pending  = !approved && !failed;

  return (
    <section className="px-4 pt-16 pb-24 flex flex-col items-center text-center gap-6">
      {/* Ícono */}
      <div className={`size-20 rounded-3xl flex items-center justify-center transition-colors duration-500 ${
        approved ? "bg-emerald-500/10 border border-emerald-500/20"
        : failed  ? "bg-red-500/10 border border-red-500/20"
        : "bg-amber-500/10 border border-amber-500/20"
      }`}>
        {approved ? (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        ) : failed ? (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        ) : (
          /* Spinner mientras espera */
          <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        )}
      </div>

      {/* Mensaje */}
      {approved && (
        <>
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">¡Pago aprobado!</h2>
            <p className="text-zinc-500 mt-2">
              Se acreditaron{" "}
              <span className="text-emerald-400 font-bold">{data.creditsGranted} clases</span>
              {data.pack ? ` de ${data.pack.name}` : ""} a tu cuenta.
            </p>
          </div>
          <Link
            href="/"
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-400 transition-colors active:scale-95"
          >
            Reservar una clase
          </Link>
        </>
      )}

      {failed && (
        <>
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Pago no completado</h2>
            <p className="text-zinc-500 mt-2">
              El pago fue rechazado o cancelado. No se realizó ningún cargo.
            </p>
          </div>
          <Link
            href="/packs"
            className="px-6 py-3 bg-zinc-800 text-zinc-200 rounded-xl font-semibold text-sm hover:bg-zinc-700 transition-colors"
          >
            Intentar de nuevo
          </Link>
        </>
      )}

      {pending && (
        <>
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">
              {timedOut ? "Verificando pago" : "Confirmando pago..."}
            </h2>
            <p className="text-zinc-500 mt-2">
              {timedOut
                ? "El pago está siendo procesado. Los créditos se acreditarán en unos minutos."
                : "Estamos confirmando tu pago con MercadoPago."}
            </p>
          </div>
          {timedOut && (
            <Link
              href="/packs"
              className="px-6 py-3 bg-zinc-800 text-zinc-200 rounded-xl font-semibold text-sm hover:bg-zinc-700 transition-colors"
            >
              Volver a abonos
            </Link>
          )}
        </>
      )}
    </section>
  );
}
