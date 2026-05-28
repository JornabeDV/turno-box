"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import {
  getFinancesSummaryAction,
  getMonthlyChartAction,
  getGymTransactionsAction,
  createExpenseAction,
  deleteGymTransactionAction,
} from "@/actions/finances";
import {
  EXPENSE_CATEGORIES,
  ALL_CATEGORIES,
  PAYMENT_METHODS,
} from "@/lib/finance-constants";
import { Dialog } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { DateInput } from "@/components/ui/DatePicker";
import { BarChart } from "./BarChart";
import { cn } from "@/lib/utils";
import {
  TrendUp,
  TrendDown,
  Wallet,
  ListDashes,
  Plus,
  Trash,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";

type Summary = {
  income: number;
  expense: number;
  balance: number;
  prevIncome: number;
  prevExpense: number;
  prevBalance: number;
  transactionCount: number;
};

type TxItem = {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string | null;
  method: string | null;
  date: Date;
  createdAt: Date;
  user: { name: string | null; email: string } | null;
  paymentId: string | null;
};

type ChartPoint = { label: string; income: number; expense: number };

type Props = {
  initialSummary: Summary;
  initialChart: ChartPoint[];
  initialItems: TxItem[];
  initialTotal: number;
  initialYear: number;
  initialMonth: number;
};

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function fmtMoney(n: number) {
  return `$ ${n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function FinancesClient({
  initialSummary,
  initialChart,
  initialItems,
  initialTotal,
  initialYear,
  initialMonth,
}: Props) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [typeFilter, setTypeFilter] = useState<"INCOME" | "EXPENSE" | "">("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 25;

  const [summary, setSummary] = useState(initialSummary);
  const [chart, setChart] = useState(initialChart);
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [isPending, startTransition] = useTransition();

  const [showModal, setShowModal] = useState(false);
  const [modalPending, setModalPending] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [expenseDate, setExpenseDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [expenseMethod, setExpenseMethod] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");

  // Resetear modal al abrir
  useEffect(() => {
    if (showModal) {
      setExpenseDate(new Date().toISOString().split("T")[0]);
      setExpenseMethod("");
      setExpenseCategory("");
    }
  }, [showModal]);

  // Cargar datos cuando cambian filtros o se fuerza refresh
  useEffect(() => {
    startTransition(async () => {
      const [sRes, cRes, tRes] = await Promise.all([
        getFinancesSummaryAction(year, month),
        getMonthlyChartAction(year),
        getGymTransactionsAction({
          year,
          month,
          type: typeFilter || null,
          category: categoryFilter || null,
          limit,
          offset,
        }),
      ]);
      if (sRes.success) setSummary(sRes.data);
      if (cRes.success) setChart(cRes.data);
      if (tRes.success) {
        setItems(tRes.data.items);
        setTotal(tRes.data.total);
      }
    });
  }, [year, month, typeFilter, categoryFilter, offset, refreshKey]);

  async function handleCreateExpense(fd: FormData) {
    setModalPending(true);
    const res = await createExpenseAction(fd);
    setModalPending(false);
    if (res.success) {
      toast.success("Egreso registrado");
      setShowModal(false);
      setOffset(0);
      setRefreshKey((k) => k + 1);
    } else {
      toast.error(res.error);
    }
  }

  async function handleDelete(id: string, hasPayment: boolean) {
    if (hasPayment) {
      toast.error("No se puede eliminar una transacción vinculada a un pago.");
      return;
    }
    if (!confirm("¿Eliminar este movimiento?")) return;
    const res = await deleteGymTransactionAction(id);
    if (res.success) {
      toast.success("Movimiento eliminado");
      setRefreshKey((k) => k + 1);
    } else {
      toast.error(res.error);
    }
  }

  const incChange = pctChange(summary.income, summary.prevIncome);
  const expChange = pctChange(summary.expense, summary.prevExpense);

  return (
    <div className="space-y-6">
      {/* Header + filtros de período */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs md:text-sm font-medium text-[#6B8A99] uppercase tracking-wider mb-0.5">
            {MONTHS[month - 1]} {year}
          </p>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#EAEAEA] tracking-tight">
            Finanzas
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(month)}
            onChange={(v) => {
              setMonth(Number(v));
              setOffset(0);
            }}
            options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
            className="w-32"
          />
          <Select
            value={String(year)}
            onChange={(v) => {
              setYear(Number(v));
              setOffset(0);
            }}
            options={Array.from(
              { length: 5 },
              (_, i) => initialYear - 2 + i,
            ).map((y) => ({ value: String(y), label: String(y) }))}
            className="w-24"
          />
          <Button variant="brand" size="sm" onClick={() => setShowModal(true)} className="flex items-center gap-1.5">
            <Plus size={16} weight="bold" />
            Egreso
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
        <MetricCard
          label="Ingresos"
          value={fmtMoney(summary.income)}
          change={incChange}
          icon="up"
          color="teal"
        />
        <MetricCard
          label="Egresos"
          value={fmtMoney(summary.expense)}
          change={expChange}
          icon="down"
          color="rose"
        />
        <MetricCard
          label="Balance"
          value={fmtMoney(summary.balance)}
          change={null}
          icon="wallet"
          color={summary.balance >= 0 ? "teal" : "rose"}
        />
        <MetricCard
          label="Movimientos"
          value={String(summary.transactionCount)}
          change={null}
          icon="list"
          color="zinc"
        />
      </div>

      {/* Gráfico */}
      <div className="bg-[#0E2A38] border border-[#1A4A63] p-4">
        <h3 className="text-xs md:text-sm font-medium font-semibold text-[#6B8A99] uppercase tracking-wider mb-3">
          Ingresos vs Egresos ({year})
        </h3>
        <BarChart data={chart} />
      </div>

      {/* Movimientos */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
          <h3 className="text-xs md:text-sm font-medium font-semibold text-[#6B8A99] uppercase tracking-wider flex-1">
            Movimientos
          </h3>
          <div className="flex items-center gap-2">
            <Select
              value={typeFilter}
              onChange={(v) => {
                setTypeFilter(v as any);
                setOffset(0);
              }}
              options={[
                { value: "", label: "Todos los tipos" },
                { value: "INCOME", label: "Ingreso" },
                { value: "EXPENSE", label: "Egreso" },
              ]}
              className="w-36"
            />
            <Select
              value={categoryFilter}
              onChange={(v) => {
                setCategoryFilter(v);
                setOffset(0);
              }}
              options={[
                { value: "", label: "Todas las categorías" },
                ...ALL_CATEGORIES.map((c) => ({ value: c, label: c })),
              ]}
              className="w-44"
            />
          </div>
        </div>

        <div className="bg-[#0E2A38] border border-[#1A4A63] overflow-hidden">
          {isPending && items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <span className="size-5 rounded-full border-2 border-[#F78837] border-t-transparent animate-spin inline-block" />
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm md:text-base text-[#6B8A99]">
                Sin movimientos en este período.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#1A4A63]">
              {items.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 px-4 md:px-5 py-3 md:py-4">
                  <div
                    className={cn(
                      "size-2 rounded-full shrink-0",
                      tx.type === "INCOME" ? "bg-[#27C7B8]" : "bg-[#E61919]",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm md:text-base font-medium text-[#EAEAEA] truncate leading-tight">
                      {tx.description || tx.category}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] md:text-xs font-medium text-[#4A6B7A] uppercase tracking-wider">
                        {tx.category}
                      </span>
                      {tx.method && (
                        <span className="text-[10px] md:text-xs font-medium text-[#6B8A99]">
                          · {tx.method}
                        </span>
                      )}
                      {tx.user && (
                        <span className="text-[10px] md:text-xs font-medium text-[#6B8A99] truncate">
                          · {tx.user.name ?? tx.user.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={cn(
                        "text-sm md:text-base font-bold tabular-nums",
                        tx.type === "INCOME"
                          ? "text-[#27C7B8]"
                          : "text-[#E61919]",
                      )}
                    >
                      {tx.type === "INCOME" ? "+" : "-"}
                      {fmtMoney(tx.amount)}
                    </p>
                    <p className="text-[10px] md:text-xs font-medium text-[#4A6B7A]">
                      {new Date(tx.date).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                  {!tx.paymentId && (
                    <button
                      onClick={() => handleDelete(tx.id, !!tx.paymentId)}
                      className="p-1.5 text-[#4A6B7A] hover:text-[#E61919] transition-colors shrink-0"
                      title="Eliminar"
                    >
                      <Trash size={14} />
                    </button>
                  )}
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
                className="flex items-center gap-1 text-xs md:text-sm font-medium text-[#6B8A99] hover:text-[#EAEAEA] disabled:opacity-30 transition-colors"
              >
                <CaretLeft size={14} /> Anterior
              </button>
              <span className="text-xs md:text-sm font-medium text-[#4A6B7A]">
                {offset + 1} – {Math.min(offset + limit, total)} de {total}
              </span>
              <button
                disabled={offset + limit >= total || isPending}
                onClick={() => setOffset((o) => o + limit)}
                className="flex items-center gap-1 text-xs md:text-sm font-medium text-[#6B8A99] hover:text-[#EAEAEA] disabled:opacity-30 transition-colors"
              >
                Siguiente <CaretRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal egreso */}
      <Dialog
        open={showModal}
        onOpenChange={setShowModal}
        title="Registrar egreso"
        size="md"
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateExpense(new FormData(e.currentTarget));
          }}
        >
          <div>
            <label className="block text-xs font-medium text-[#4A6B7A] uppercase tracking-wider mb-1">
              Categoría
            </label>
            <Select
              value={expenseCategory}
              onChange={(v) => setExpenseCategory(v)}
              options={[
                { value: "", label: "Seleccionar…" },
                ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c })),
              ]}
            />
            <input type="hidden" name="category" value={expenseCategory} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4A6B7A] uppercase tracking-wider mb-1">
              Monto
            </label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min={0.01}
              required
              placeholder="0.00"
              className="w-full h-12 bg-[#0A1F2A] border border-[#1A4A63] rounded-[2px] px-3 text-sm text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837]/50"
            />
          </div>
          <div>
            <DateInput
              name="date"
              value={expenseDate}
              onChange={setExpenseDate}
              label="Fecha"
              allowFuture
              showYearPicker={false}
              hideYear
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4A6B7A] uppercase tracking-wider mb-1">
              Método de pago
            </label>
            <Select
              value={expenseMethod}
              onChange={(v) => setExpenseMethod(v)}
              options={[
                { value: "", label: "Seleccionar..." },
                ...PAYMENT_METHODS.map((m) => ({
                  value: m,
                  label: m.charAt(0) + m.slice(1).toLowerCase(),
                })),
              ]}
            />
            <input type="hidden" name="method" value={expenseMethod} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4A6B7A] uppercase tracking-wider mb-1">
              Descripción
            </label>
            <input
              name="description"
              type="text"
              placeholder="Opcional"
              className="w-full h-12 bg-[#0A1F2A] border border-[#1A4A63] rounded-[2px] px-3 text-sm text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837]/50"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="brand" size="sm" loading={modalPending}>
              Registrar egreso
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

function MetricCard({
  label,
  value,
  change,
  icon,
  color,
}: {
  label: string;
  value: string;
  change: number | null;
  icon: "up" | "down" | "wallet" | "list";
  color: "teal" | "rose" | "zinc";
}) {
  const colorClass = {
    teal: "text-[#27C7B8]",
    rose: "text-[#E61919]",
    zinc: "text-[#EAEAEA]",
  }[color];

  return (
    <div className="bg-[#0E2A38] border border-[#1A4A63] p-4">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs md:text-sm font-medium text-[#4A6B7A] uppercase tracking-wider">
          {label}
        </span>
        {icon === "up" && <TrendUp size={14} className="text-[#27C7B8]" />}
        {icon === "down" && <TrendDown size={14} className="text-[#E61919]" />}
        {icon === "wallet" && <Wallet size={14} className="text-[#6B8A99]" />}
        {icon === "list" && <ListDashes size={14} className="text-[#6B8A99]" />}
      </div>
      <p className={cn("text-lg md:text-xl font-bold tabular-nums", colorClass)}>
        {value}
      </p>
      {change !== null && (
        <p
          className={cn(
            "text-xs font-medium mt-1",
            change >= 0 ? "text-[#27C7B8]" : "text-[#E61919]",
          )}
        >
          {change >= 0 ? "+" : ""}
          {change}% vs mes anterior
        </p>
      )}
    </div>
  );
}
