"use client";

import { useState, useTransition } from "react";
import { duplicateDayAction } from "@/actions/classes";
import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

const DAYS = [
  { key: "MONDAY", label: "Lun", full: "Lunes" },
  { key: "TUESDAY", label: "Mar", full: "Martes" },
  { key: "WEDNESDAY", label: "Mié", full: "Miércoles" },
  { key: "THURSDAY", label: "Jue", full: "Jueves" },
  { key: "FRIDAY", label: "Vie", full: "Viernes" },
  { key: "SATURDAY", label: "Sáb", full: "Sábado" },
  { key: "SUNDAY", label: "Dom", full: "Domingo" },
] as const;

type DayKey = (typeof DAYS)[number]["key"];

type ClassSummary = {
  name: string;
  startTime: string;
  endTime: string;
  color: string | null;
};

type Props = {
  classesByDay: Record<string, ClassSummary[]>;
};

export function DuplicateDayForm({ classesByDay }: Props) {
  const [sourceDay, setSourceDay] = useState<DayKey | null>(null);
  const [targetDays, setTargetDays] = useState<Set<DayKey>>(new Set());
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sourceClasses = sourceDay ? (classesByDay[sourceDay] ?? []) : [];
  const totalToCreate = sourceClasses.length * targetDays.size;

  function selectSource(day: DayKey) {
    setSourceDay(day);
    setTargetDays((prev) => {
      const n = new Set(prev);
      n.delete(day);
      return n;
    });
    setResult(null);
    setError(null);
  }

  function toggleTarget(day: DayKey) {
    setTargetDays((prev) => {
      const n = new Set(prev);
      n.has(day) ? n.delete(day) : n.add(day);
      return n;
    });
  }

  function toggleAll() {
    const available = DAYS.filter((d) => d.key !== sourceDay).map((d) => d.key);
    const allSelected = available.every((d) => targetDays.has(d));
    setTargetDays(allSelected ? new Set() : new Set(available));
  }

  function handleSubmit() {
    if (!sourceDay || targetDays.size === 0) return;
    setError(null);
    startTransition(async () => {
      const res = await duplicateDayAction(sourceDay, Array.from(targetDays));
      if (res.success) {
        setResult(res.data);
      } else {
        setError(res.error);
      }
    });
  }

  if (result) {
    return (
      <div className="bg-[#0E2A38] border border-[#1A4A63] p-8 text-center space-y-4">
        <div className="size-14 bg-[#27C7B8]/10 border border-[#27C7B8]/20 flex items-center justify-center mx-auto">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div>
          <p className="text-xl font-bold text-[#EAEAEA]">
            {result.created}{" "}
            {result.created === 1 ? "clase creada" : "clases creadas"}
          </p>
          {result.skipped > 0 && (
            <p className="text-xs text-[#6B8A99] mt-1">
              {result.skipped}{" "}
              {result.skipped === 1 ? "clase ya existía" : "clases ya existían"}{" "}
              y fueron omitidas
            </p>
          )}
        </div>
        <Link
          href="/dashboard/admin/classes"
          className="inline-flex items-center gap-1.5 text-sm text-[#F78837] hover:text-[#F78837] transition-colors"
        >
          Ver todas las clases →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* ── Día origen ── */}
      <div>
        <p className="text-xs font-semibold text-[#6B8A99] uppercase tracking-wider mb-3 px-1">
          Día origen
        </p>
        <div className="flex gap-2 flex-wrap">
          {DAYS.map(({ key, label }) => {
            const count = classesByDay[key]?.length ?? 0;
            const isSelected = sourceDay === key;
            return (
              <button
                key={key}
                onClick={() => selectSource(key)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3.5 py-2.5 rounded-[2px] border text-sm font-medium transition-all active:scale-95",
                  isSelected
                    ? "bg-[#F78837]/10 border-orange-500/40 text-[#F78837]"
                    : count > 0
                      ? "border-[#1A4A63] text-[#EAEAEA] hover:border-white/20 hover:bg-white/[0.03]"
                      : "border-[#1A4A63] text-[#4A6B7A] hover:border-white/10",
                )}
              >
                {label}
                <span
                  className={cn(
                    "text-[10px] font-mono tabular-nums",
                    isSelected ? "text-[#F78837]" : "text-[#4A6B7A]",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Preview clases del día origen ── */}
      {sourceDay && (
        <div className="bg-[#0E2A38] border border-[#1A4A63] overflow-hidden">
          {sourceClasses.length === 0 ? (
            <p className="text-xs text-[#4A6B7A] text-center py-8">
              Este día no tiene clases para copiar.
            </p>
          ) : (
            <div className="divide-y divide-[#1A4A63]">
              {sourceClasses.map((c, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    className="size-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: c.color ?? "#f97316" }}
                  />
                  <span className="text-sm text-[#EAEAEA] flex-1 truncate">
                    {c.name}
                  </span>
                  <span className="text-xs font-mono text-[#6B8A99] shrink-0 tabular-nums">
                    {formatTime(c.startTime)} – {formatTime(c.endTime)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Días destino ── */}
      {sourceDay && sourceClasses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-xs font-semibold text-[#6B8A99] uppercase tracking-wider">
              Copiar a
            </p>
            <button
              onClick={toggleAll}
              className="text-xs text-[#6B8A99] hover:text-[#EAEAEA] transition-colors"
            >
              {DAYS.filter((d) => d.key !== sourceDay).every((d) =>
                targetDays.has(d.key),
              )
                ? "Deseleccionar todos"
                : "Seleccionar todos"}
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {DAYS.filter((d) => d.key !== sourceDay).map(
              ({ key, label, full }) => {
                const checked = targetDays.has(key);
                const existing = classesByDay[key]?.length ?? 0;
                return (
                  <button
                    key={key}
                    onClick={() => toggleTarget(key)}
                    title={
                      existing > 0
                        ? `${full} ya tiene ${existing} clases (se omitirán duplicados)`
                        : full
                    }
                    className={cn(
                      "flex flex-col items-center gap-0.5 px-3.5 py-2.5 rounded-[2px] border text-sm font-medium transition-all active:scale-95",
                      checked
                        ? "bg-[#F78837]/10 border-orange-500/40 text-[#F78837]"
                        : "border-[#1A4A63] text-[#EAEAEA] hover:border-white/20 hover:bg-white/[0.03]",
                    )}
                  >
                    {label}
                    {existing > 0 && (
                      <span
                        className={cn(
                          "text-[10px] font-mono tabular-nums",
                          checked ? "text-[#F78837]" : "text-[#4A6B7A]",
                        )}
                      >
                        {existing}
                      </span>
                    )}
                  </button>
                );
              },
            )}
          </div>
        </div>
      )}

      {/* ── Resumen + submit ── */}
      {targetDays.size > 0 && sourceClasses.length > 0 && (
        <div className="bg-[#0E2A38] border border-[#1A4A63] p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-[#EAEAEA] leading-snug">
            Se crearán hasta{" "}
            <span className="font-bold text-[#F78837] tabular-nums">
              {totalToCreate}
            </span>{" "}
            {totalToCreate === 1 ? "clase" : "clases"} en{" "}
            <span className="font-bold text-[#EAEAEA]">{targetDays.size}</span>{" "}
            {targetDays.size === 1 ? "día" : "días"}
          </p>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="px-5 py-2 rounded-[2px] bg-[#F78837] text-white text-sm font-semibold hover:bg-[#E07A2E] active:scale-95 transition-all disabled:opacity-50 shrink-0"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="size-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Creando…
              </span>
            ) : (
              "Duplicar"
            )}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-[#E61919] px-1">{error}</p>}
    </div>
  );
}
