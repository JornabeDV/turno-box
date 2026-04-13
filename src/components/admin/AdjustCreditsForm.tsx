"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { adjustCreditsAction } from "@/actions/students";
import { cn } from "@/lib/utils";

type Props = { studentId: string; currentBalance: number };

const QUICK_AMOUNTS = [4, 8, 12, 16];

export function AdjustCreditsForm({ studentId, currentBalance }: Props) {
  const [balance, setBalance]     = useState(currentBalance);
  const [amount, setAmount]       = useState("");
  const [note, setNote]           = useState("");
  const [error, setError]         = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("amount", amount);
    fd.set("note", note);

    startTransition(async () => {
      const res = await adjustCreditsAction(studentId, fd);
      if (res.success) {
        setBalance(res.data.newBalance);
        setAmount("");
        setNote("");
        const delta = Number(amount);
        toast.success(delta > 0 ? `+${delta} créditos acreditados` : `${delta} créditos descontados`);
      } else {
        setError(res.error);
        toast.error(res.error);
      }
    });
  }

  const preview = amount ? balance + Number(amount) : null;
  const isNegative = Number(amount) < 0;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Créditos disponibles
        </h3>
        <span className={cn(
          "text-2xl font-black tabular-nums leading-none",
          balance === 0 ? "text-rose-400" : balance <= 3 ? "text-amber-400" : "text-emerald-400"
        )}>
          {balance}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Atajos rápidos */}
        <div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Acreditar rápido</p>
          <div className="flex gap-2">
            {QUICK_AMOUNTS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setAmount(String(n))}
                className={cn(
                  "flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all active:scale-95",
                  amount === String(n)
                    ? "bg-orange-500/10 border-orange-500/40 text-orange-400"
                    : "border-white/[0.08] text-zinc-400 hover:border-white/20"
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
              className="w-full h-10 bg-zinc-900 border border-white/[0.08] rounded-xl px-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 transition-colors tabular-nums"
            />
          </div>
          {preview !== null && (
            <div className={cn(
              "h-10 px-3 rounded-xl border flex items-center text-xs font-bold tabular-nums shrink-0",
              isNegative
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            )}>
              → {Math.max(0, preview)}
            </div>
          )}
        </div>

        {/* Nota obligatoria */}
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Motivo (requerido)"
          required
          className="w-full h-10 bg-zinc-900 border border-white/[0.08] rounded-xl px-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 transition-colors"
        />

        {error && <p className="text-xs text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={isPending || !amount || !note}
          className="w-full h-10 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-400 active:scale-95 transition-all disabled:opacity-40"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="size-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Aplicando…
            </span>
          ) : (
            `Aplicar ajuste`
          )}
        </button>
      </form>
    </div>
  );
}
