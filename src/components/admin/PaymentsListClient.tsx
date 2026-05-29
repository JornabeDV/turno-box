"use client";

import { useState, useTransition, useEffect } from "react";
import { getAllPaymentsAction } from "@/actions/payments";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

type PaymentItem = {
  id: string;
  status: string;
  provider: string;
  method: string | null;
  amountPaid: number;
  creditsGranted: number;
  paidAt: Date | null;
  createdAt: Date;
  user: { name: string | null; email: string };
  pack: { name: string } | null;
};

type Props = {
  initialItems: PaymentItem[];
  initialTotal: number;
  initialYear: number;
  initialMonth: number | null;
};

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function fmtMoney(n: number) {
  return `$ ${n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function PaymentsListClient({ initialItems, initialTotal, initialYear, initialMonth }: Props) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState<number | null>(initialMonth);
  const [statusFilter, setStatusFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 25;

  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const res = await getAllPaymentsAction({
        year,
        month,
        status: statusFilter || null,
        provider: providerFilter || null,
        limit,
        offset,
      });
      if (res.success) {
        setItems(res.data.items);
        setTotal(res.data.total);
      }
    });
  }, [year, month, statusFilter, providerFilter, offset]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs md:text-sm text-[#6B8A99] uppercase tracking-wider mb-0.5">
            {month ? `${MONTHS[month - 1]} ` : ""}{year}
          </p>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#EAEAEA] tracking-tight">
            Pagos de alumnos
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={month != null ? String(month) : ""}
            onChange={(v) => { setMonth(v ? Number(v) : null); setOffset(0); }}
            options={[{ value: "", label: "Todo el año" }, ...MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))]}
            className="w-36"
          />
          <Select
            value={String(year)}
            onChange={(v) => { setYear(Number(v)); setOffset(0); }}
            options={Array.from({ length: 5 }, (_, i) => initialYear - 2 + i).map((y) => ({ value: String(y), label: String(y) }))}
            className="w-24"
          />
          <Select
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setOffset(0); }}
            options={[
              { value: "", label: "Todos los estados" },
              { value: "APPROVED", label: "Aprobado" },
              { value: "PENDING", label: "Pendiente" },
              { value: "REJECTED", label: "Rechazado" },
              { value: "CANCELLED", label: "Cancelado" },
              { value: "REFUNDED", label: "Reembolsado" },
            ]}
            className="w-36"
          />
          <Select
            value={providerFilter}
            onChange={(v) => { setProviderFilter(v); setOffset(0); }}
            options={[
              { value: "", label: "Todos los orígenes" },
              { value: "MANUAL", label: "Manual" },
              { value: "MERCADOPAGO", label: "MercadoPago" },
            ]}
            className="w-36"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-[#0E2A38] border border-[#1A4A63] overflow-hidden">
        {isPending && items.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <span className="size-5 rounded-full border-2 border-[#F78837] border-t-transparent animate-spin inline-block" />
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm md:text-base text-[#6B8A99]">Sin pagos en este período.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1A4A63]">
            {items.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 md:px-5 py-3 md:py-4">
                <div className={cn(
                  "size-2 rounded-full shrink-0",
                  p.status === "APPROVED" ? "bg-[#27C7B8]" :
                  p.status === "PENDING" ? "bg-[#F78837]" :
                  "bg-[#E61919]"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm md:text-base font-medium text-[#EAEAEA] truncate leading-tight">
                    {p.user.name ?? p.user.email}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] md:text-xs text-[#4A6B7A]">
                      {p.pack?.name ?? "Ajuste manual"}
                    </span>
                    {p.method && (
                      <span className="text-[10px] md:text-xs text-[#6B8A99]">
                        · {p.method}
                      </span>
                    )}
                    <span className={cn(
                      "text-[10px] md:text-xs px-1.5 py-0.5 rounded-[2px] border",
                      p.provider === "MANUAL"
                        ? "bg-[#F78837]/10 border-[#F78837]/20 text-[#F78837]"
                        : "bg-[#27C7B8]/10 border-[#27C7B8]/20 text-[#27C7B8]"
                    )}>
                      {p.provider === "MANUAL" ? "Manual" : "MP"}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm md:text-base font-bold tabular-nums text-[#EAEAEA]">
                    {fmtMoney(p.amountPaid)}
                  </p>
                  <p className="text-[10px] md:text-xs text-[#4A6B7A]">
                    {p.creditsGranted > 0 ? `${p.creditsGranted} créd. · ` : ""}
                    {p.paidAt
                      ? new Date(p.paidAt).toLocaleDateString("es-AR")
                      : new Date(p.createdAt).toLocaleDateString("es-AR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {total > limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#1A4A63]">
            <button
              disabled={offset === 0 || isPending}
              onClick={() => setOffset((o) => Math.max(0, o - limit))}
              className="flex items-center gap-1 text-xs md:text-sm text-[#6B8A99] hover:text-[#EAEAEA] disabled:opacity-30 transition-colors"
            >
              <CaretLeft size={14} /> Anterior
            </button>
            <span className="text-xs md:text-sm text-[#4A6B7A]">
              {offset + 1} – {Math.min(offset + limit, total)} de {total}
            </span>
            <button
              disabled={offset + limit >= total || isPending}
              onClick={() => setOffset((o) => o + limit)}
              className="flex items-center gap-1 text-xs text-[#6B8A99] hover:text-[#EAEAEA] disabled:opacity-30 transition-colors"
            >
              Siguiente <CaretRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
