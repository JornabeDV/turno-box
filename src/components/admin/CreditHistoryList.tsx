"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

type SerializedPayment = {
  amountPaid: string | null;
  currency: string;
  provider: string;
  status: string;
  pack: { name: string } | null;
} | null;

type SerializedTransaction = {
  id: string;
  type: string;
  amount: number;
  note: string | null;
  createdAt: string;
  payment: SerializedPayment;
};

interface CreditHistoryListProps {
  transactions: SerializedTransaction[];
}

const INITIAL_COUNT = 10;
const INCREMENT = 10;

export function CreditHistoryList({ transactions }: CreditHistoryListProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const hasMore = visibleCount < transactions.length;

  if (transactions.length === 0) {
    return (
      <p className="text-xs md:text-sm text-muted text-center py-12 font-[family-name:var(--font-oswald)] uppercase tracking-wide">
        Sin movimientos de créditos.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border">
      {transactions.slice(0, visibleCount).map((tx) => {
        const typeLabel =
          tx.type === "ADJUSTMENT"
            ? "Ajuste manual"
            : tx.type === "PURCHASE"
              ? (tx.payment?.pack?.name ?? "Compra de pack")
              : tx.type === "CONSUME"
                ? "Reserva de turno"
                : tx.type === "REFUND"
                  ? "Reembolso"
                  : tx.type === "EXPIRY"
                    ? "Vencimiento"
                    : tx.type;

        const typeColor =
          tx.type === "CONSUME" || tx.type === "EXPIRY"
            ? "text-danger"
            : tx.type === "PURCHASE"
              ? "text-brand"
              : tx.type === "ADJUSTMENT"
                ? "text-primary"
                : tx.type === "REFUND"
                  ? "text-success"
                  : "text-primary";

        const createdAt = new Date(tx.createdAt);

        return (
          <div
            key={tx.id}
            className="group flex flex-col md:grid md:grid-cols-[4rem_1fr_10rem_10rem] gap-3 md:gap-5 px-4 md:px-6 py-4 md:py-5 hover:bg-page/60 transition-colors"
          >
            {/* Icono + cantidad */}
            <div className="flex md:flex-col md:items-center gap-3 md:gap-1.5">
              <div
                className={cn(
                  "size-9 md:size-10 border flex items-center justify-center shrink-0",
                  tx.amount > 0
                    ? "border-success/30 bg-success/10"
                    : "border-danger/30 bg-danger/10",
                )}
              >
                <span
                  className={cn(
                    "text-sm md:text-base font-bold leading-none font-[family-name:var(--font-oswald)]",
                    tx.amount > 0 ? "text-success" : "text-danger",
                  )}
                >
                  {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                </span>
              </div>
              <span className="md:hidden text-xs font-[family-name:var(--font-oswald)] uppercase tracking-wide text-secondary">
                {typeLabel}
              </span>
            </div>

            {/* Concepto + nota */}
            <div className="min-w-0 flex flex-col justify-center">
              <p className="hidden md:block text-sm lg:text-base font-[family-name:var(--font-oswald)] font-bold uppercase tracking-tight truncate">
                <span className={typeColor}>{typeLabel}</span>
              </p>
              {tx.note && (
                <p className="text-base md:text-sm text-secondary truncate font-[family-name:var(--font-oswald)]">
                  {tx.note}
                </p>
              )}
              {tx.payment && (
                <div className="md:hidden flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-sm font-semibold text-primary font-[family-name:var(--font-jetbrains)] tabular-nums">
                    {new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: tx.payment.currency,
                      maximumFractionDigits: 0,
                    }).format(Number(tx.payment.amountPaid))}
                  </span>
                  {tx.payment.provider === "MANUAL" && (
                    <span className="text-[11px] px-1.5 py-0.5 border border-border text-secondary font-[family-name:var(--font-jetbrains)]">
                      MANUAL
                    </span>
                  )}
                  {tx.payment.provider === "MERCADOPAGO" && (
                    <span className="text-[11px] px-1.5 py-0.5 border border-border text-secondary font-[family-name:var(--font-jetbrains)]">
                      MP
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Fecha */}
            <div className="hidden md:flex flex-col justify-center">
              <p className="text-sm lg:text-base text-secondary font-[family-name:var(--font-jetbrains)] tabular-nums">
                {createdAt.toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs lg:text-sm text-muted font-[family-name:var(--font-jetbrains)] tabular-nums mt-0.5">
                {createdAt.toLocaleTimeString("es-AR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* Monto + proveedor */}
            <div className="hidden md:flex flex-col items-end justify-center text-right">
              {tx.payment ? (
                <>
                  <span className="text-sm lg:text-base font-semibold text-primary font-[family-name:var(--font-jetbrains)] tabular-nums">
                    {new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: tx.payment.currency,
                      maximumFractionDigits: 0,
                    }).format(Number(tx.payment.amountPaid))}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {tx.payment.provider === "MANUAL" && (
                      <span className="text-[11px] px-2 py-0.5 border border-border text-secondary font-[family-name:var(--font-jetbrains)] uppercase tracking-wide">
                        Manual
                      </span>
                    )}
                    {tx.payment.provider === "MERCADOPAGO" && (
                      <span className="text-[11px] px-2 py-0.5 border border-border text-secondary font-[family-name:var(--font-jetbrains)] uppercase tracking-wide">
                        MercadoPago
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <span className="text-sm text-muted font-[family-name:var(--font-jetbrains)]">
                  —
                </span>
              )}
            </div>

            {/* Fecha en mobile */}
            <div className="md:hidden text-xs text-muted font-[family-name:var(--font-jetbrains)] tabular-nums">
              {createdAt.toLocaleDateString("es-AR", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        );
      })}

      {hasMore && (
        <div className="py-5 flex justify-center">
          <Button
            variant="outline"
            size="md"
            onClick={() => setVisibleCount((c) => c + INCREMENT)}
          >
            Cargar más transacciones
          </Button>
        </div>
      )}
    </div>
  );
}
