"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { adjustCreditsAction } from "@/actions/students";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";

type Props = { studentId: string; currentBalance: number };

const QUICK_AMOUNTS = [4, 8, 12, 16];

function formatARS(value: string, cursorPos: number | null) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return { text: "", cursor: 0 };

  const num = Number(digits);
  const text = `$ ${new Intl.NumberFormat("es-AR").format(num)}`;

  // preservar posición del cursor basada en dígitos antes del cursor
  const beforeCursor = value.slice(0, cursorPos ?? 0);
  const digitsBefore = beforeCursor.replace(/\D/g, "").length;
  let newCursor = text.length;
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    if (/\d/.test(text[i])) count++;
    if (count === digitsBefore) {
      newCursor = i + 1;
      break;
    }
  }
  return { text, cursor: newCursor };
}

export function AdjustCreditsForm({ studentId, currentBalance }: Props) {
  const [balance, setBalance] = useState(currentBalance);
  const [amount, setAmount] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("amount", amount);
    fd.set("amountPaid", amountPaid.replace(/\D/g, ""));
    fd.set("note", note);

    startTransition(async () => {
      const res = await adjustCreditsAction(studentId, fd);
      if (res.success) {
        setBalance(res.data.newBalance);
        setAmount("");
        setAmountPaid("");
        setNote("");
        const delta = Number(amount);
        toast.success(
          delta > 0
            ? `+${delta} créditos acreditados`
            : `${delta} créditos descontados`,
        );
      } else {
        setError(res.error);
        toast.error(res.error);
      }
    });
  }

  const preview = amount ? balance + Number(amount) : null;
  const isNegative = Number(amount) < 0;

  return (
    <div className="bg-[#0E2A38] border border-[#1A4A63] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-[#6B8A99] uppercase tracking-wider">
          Créditos disponibles
        </h3>
        <span
          className={cn(
            "text-2xl font-black tabular-nums leading-none",
            balance === 0
              ? "text-[#E61919]"
              : balance <= 3
                ? "text-[#F78837]"
                : "text-[#27C7B8]",
          )}
        >
          {balance}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Atajos rápidos */}
        <div>
          <p className="text-[10px] text-[#4A6B7A] uppercase tracking-wider mb-2">
            Acreditar rápido
          </p>
          <div className="flex gap-2">
            {QUICK_AMOUNTS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setAmount(String(n))}
                className={cn(
                  "flex-1 py-1.5 rounded-[2px] border text-xs font-bold transition-all active:scale-95",
                  amount === String(n)
                    ? "bg-[#F78837]/10 border-orange-500/40 text-[#F78837]"
                    : "border-[#1A4A63] text-[#6B8A99] hover:border-white/20",
                )}
              >
                +{n}
              </button>
            ))}
          </div>
        </div>

        {/* Input manual */}
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Monto (+8 o -2)"
              required
              className="w-full h-10 bg-[#0A1F2A] border border-[#1A4A63] rounded-[2px] px-3 text-sm text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837]/50 transition-colors tabular-nums"
            />
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              inputMode="numeric"
              value={amountPaid}
              onChange={(e) => {
                const input = e.target;
                const start = input.selectionStart ?? 0;
                const { text, cursor } = formatARS(input.value, start);
                setAmountPaid(text);
                requestAnimationFrame(() => {
                  input.setSelectionRange(cursor, cursor);
                });
              }}
              placeholder="Monto pagado"
              className="w-full h-10 bg-[#0A1F2A] border border-[#1A4A63] rounded-[2px] px-3 text-sm text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837]/50 transition-colors tabular-nums"
            />
          </div>
          {preview !== null && (
            <div
              className={cn(
                "h-10 px-3 rounded-[2px] border flex items-center gap-1 text-xs font-bold tabular-nums shrink-0",
                isNegative
                  ? "bg-[#E61919]/10 border-[#E61919]/20 text-[#E61919]"
                  : "bg-[#27C7B8]/10 border-[#27C7B8]/20 text-[#27C7B8]",
              )}
            >
              <ArrowRightIcon size={10} />
              {Math.max(0, preview)}
            </div>
          )}
        </div>

        <p className="text-[10px] text-[#4A6B7A]">Dejar en 0 o vacío si no hubo pago.</p>

        {/* Nota obligatoria */}
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Motivo (requerido)"
          required
          className="w-full h-10 bg-[#0A1F2A] border border-[#1A4A63] rounded-[2px] px-3 text-sm text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837]/50 transition-colors"
        />

        {error && <p className="text-xs text-[#E61919]">{error}</p>}

        <button
          type="submit"
          disabled={isPending || !amount || !note}
          className="w-full h-10 rounded-[2px] bg-[#F78837] text-white text-sm hover:bg-[#E07A2E] active:scale-95 transition-all disabled:opacity-40"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="size-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Aplicando…
            </span>
          ) : (
            `Cargar créditos`
          )}
        </button>
      </form>
    </div>
  );
}
