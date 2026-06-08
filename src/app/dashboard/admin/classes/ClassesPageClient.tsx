"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatTime, getTodayInGymTimezone, parseLocalDate } from "@/lib/utils";
import {
  PlusIcon,
  CaretLeftIcon,
  CaretRightIcon,
  LockSimpleIcon,
  LockSimpleOpenIcon,
} from "@phosphor-icons/react/dist/ssr";
import { DisciplinesManager } from "@/components/admin/DisciplinesManager";
import { ClassModal } from "@/components/admin/ClassModal";
import { Dialog } from "@/components/ui/Dialog";
import {
  createGymClosureAction,
  deleteGymClosureAction,
} from "@/actions/classes";
import type { ClassSlot } from "@/types";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lunes",
  TUESDAY: "Martes",
  WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves",
  FRIDAY: "Viernes",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};
const DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

type Coach = { id: string; name: string | null };
type Discipline = {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
};

type Closure = { date: Date | string; reason: string | null };

interface Props {
  disciplines: Discipline[];
  coaches: Coach[];
  weekParam: string;
  prevWeek: string;
  nextWeek: string;
  filteredSlotsPerDay: ClassSlot[][];
  totalClasses: number;
  weekStartStr: string;
  discipline?: string;
  closures: Closure[];
}

export function ClassesPageClient({
  disciplines,
  coaches,
  weekParam,
  prevWeek,
  nextWeek,
  filteredSlotsPerDay,
  totalClasses,
  weekStartStr,
  discipline,
  closures,
}: Props) {
  const [showClassModal, setShowClassModal] = useState(false);
  const weekStart = parseLocalDate(weekStartStr);
  const today = getTodayInGymTimezone();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const [pendingClosure, startClosureTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDate, setConfirmDate] = useState<Date | null>(null);
  const [confirmAction, setConfirmAction] = useState<"close" | "open" | null>(null);
  const [closureReason, setClosureReason] = useState("Cierre administrativo");

  function formatShortDate(date: Date): string {
    return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  }

  function formatWeekRange(start: Date, end: Date): string {
    const sameMonth =
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear();
    if (sameMonth) {
      return `${start.getDate()} – ${end.toLocaleDateString("es-AR", { day: "numeric", month: "short" })}`;
    }
    return `${start.toLocaleDateString("es-AR", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("es-AR", { day: "numeric", month: "short" })}`;
  }

  function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  function isoDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    // Siempre usar UTC para evitar desfases de zona horaria
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  }

  function closureKey(date: Date | string): string {
    return isoDate(date);
  }

  const weekDays = DAY_ORDER.map((dayKey, i) => ({
    dayKey,
    date: addDays(weekStart, i),
  }));

  const closureMap = new Map(closures.map((c) => [closureKey(c.date), c]));

  function askCloseDay(date: Date) {
    setConfirmDate(date);
    setConfirmAction("close");
    setClosureReason("Cierre administrativo");
    setConfirmOpen(true);
  }

  function askOpenDay(date: Date) {
    setConfirmDate(date);
    setConfirmAction("open");
    setConfirmOpen(true);
  }

  function executeConfirm() {
    if (!confirmDate || !confirmAction) return;
    const dateStr = isoDate(confirmDate);
    startClosureTransition(async () => {
      if (confirmAction === "close") {
        await createGymClosureAction(dateStr, closureReason.trim() || "Cierre administrativo");
      } else {
        await deleteGymClosureAction(dateStr);
      }
      setConfirmOpen(false);
      setConfirmDate(null);
      setConfirmAction(null);
      setClosureReason("Cierre administrativo");
    });
  }

  function cancelConfirm() {
    setConfirmOpen(false);
    setConfirmDate(null);
    setConfirmAction(null);
    setClosureReason("Cierre administrativo");
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs md:text-sm text-[#6B8A99] uppercase tracking-wider mb-0.5">
            Admin
          </p>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#EAEAEA] tracking-tight">
            Clases
          </h2>
        </div>
        <Button
          size="md"
          variant="brand"
          onClick={() => setShowClassModal(true)}
        >
          <PlusIcon size={14} weight="bold" />
          Nueva clase
        </Button>
      </div>

      {/* Badges de disciplinas */}
      <DisciplinesManager disciplines={disciplines} weekParam={weekParam} />

      {/* Navegación de semana */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/dashboard/admin/classes?week=${prevWeek}${discipline ? `&discipline=${encodeURIComponent(discipline)}` : ""}`}
        >
          <Button size="md" variant="outline" className="px-3 md:px-5" aria-label="Semana anterior">
            <CaretLeftIcon size={20} weight="bold" />
          </Button>
        </Link>
        <p className="text-lg md:text-xl font-medium text-[#EAEAEA] tabular-nums whitespace-nowrap">
          {formatWeekRange(weekStart, addDays(weekStart, 6))}
        </p>
        <Link
          href={`/dashboard/admin/classes?week=${nextWeek}${discipline ? `&discipline=${encodeURIComponent(discipline)}` : ""}`}
        >
          <Button size="md" variant="outline" className="px-3 md:px-5" aria-label="Semana siguiente">
            <CaretRightIcon size={20} weight="bold" />
          </Button>
        </Link>
      </div>

      {/* Grid semanal */}
      {totalClasses === 0 && disciplines.length === 0 ? (
        <div className="bg-[#0E2A38] border border-[#1A4A63] px-4 py-16 text-center">
          <p className="text-sm md:text-base text-[#6B8A99] mb-4">
            No hay clases creadas todavía.
          </p>
          <Button
            variant="brand"
            size="md"
            onClick={() => setShowClassModal(true)}
          >
            Crear primera clase
          </Button>
        </div>
      ) : (
        <div className="md:overflow-x-auto md:-mx-4 md:px-4 md:pb-2">
          <div className="flex flex-col gap-4 md:grid md:grid-cols-7 md:gap-2.5 md:min-w-[700px]">
            {weekDays.map(({ dayKey, date }, i) => {
              const slots = filteredSlotsPerDay[i];
              const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
              const isToday = dateKey === todayKey;
              const closure = closureMap.get(isoDate(date));

              return (
                <div
                  key={dayKey}
                  className={
                    slots.length === 0 && !closure
                      ? "hidden md:flex md:flex-col md:gap-2"
                      : "flex flex-col gap-2"
                  }
                >
                  {/* Cabecera del día */}
                  <div
                    className={`rounded-[2px] ${isToday ? "bg-[#F78837]/15" : closure ? "bg-[#E61919]/15" : "bg-[#0E2A38]/40"}`}
                  >
                    {/* Mobile */}
                    <div className="md:hidden flex items-center justify-between px-3 py-2.5">
                      <span
                        className={`text-sm md:text-base font-semibold ${isToday ? "text-[#F78837]" : closure ? "text-[#E61919]" : "text-[#EAEAEA]"}`}
                      >
                        {DAY_LABELS[dayKey]}
                        {isToday && (
                          <span className="ml-2 text-[10px] md:text-xs bg-[#F78837]/20 text-[#F78837] px-1.5 py-0.5 rounded-full font-medium">
                            hoy
                          </span>
                        )}
                        {closure && (
                          <span className="ml-2 size-2 rounded-full bg-[#E61919]" />
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        {closure ? (
                          <button
                            onClick={() => askOpenDay(date)}
                            disabled={pendingClosure}
                            className="text-[#E61919] hover:text-[#ff4444] disabled:opacity-50 cursor-pointer"
                            title="Reabrir día"
                          >
                            <LockSimpleOpenIcon size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => askCloseDay(date)}
                            disabled={pendingClosure}
                            className="text-[#6B8A99] hover:text-[#EAEAEA] disabled:opacity-50 cursor-pointer"
                            title="Cerrar día"
                          >
                            <LockSimpleIcon size={16} />
                          </button>
                        )}
                        <span
                          className={`text-xs md:text-sm font-mono tabular-nums ${isToday ? "text-[#F78837]" : closure ? "text-[#E61919]" : "text-[#6B8A99]"}`}
                        >
                          {date.toLocaleDateString("es-AR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </div>
                    {/* Desktop */}
                    <div className="hidden md:block text-center py-2 relative">
                      <div className="absolute right-1 top-1">
                        {closure ? (
                          <button
                            onClick={() => askOpenDay(date)}
                            disabled={pendingClosure}
                            className="text-[#E61919] hover:text-[#ff4444] disabled:opacity-50 p-1 cursor-pointer"
                            title="Reabrir día"
                          >
                            <LockSimpleOpenIcon size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => askCloseDay(date)}
                            disabled={pendingClosure}
                            className="text-[#4A6B7A] hover:text-[#EAEAEA] disabled:opacity-50 p-1 cursor-pointer"
                            title="Cerrar día"
                          >
                            <LockSimpleIcon size={14} />
                          </button>
                        )}
                      </div>
                      <p
                        className={`text-[10px] md:text-xs font-bold uppercase tracking-widest ${isToday ? "text-[#F78837]" : closure ? "text-[#E61919]" : "text-[#6B8A99]"}`}
                      >
                        {DAY_LABELS[dayKey].slice(0, 3)}
                      </p>
                      <p
                        className={`text-base font-semibold leading-tight ${isToday ? "text-[#F78837]" : closure ? "text-[#E61919]" : "text-[#EAEAEA]"}`}
                      >
                        {date.getDate()}
                      </p>

                    </div>
                  </div>

                  {/* Cards de turnos */}
                  {closure ? (
                    <div className="flex items-center justify-center py-6">
                      <span className="text-xs sm:text-sm text-[#E61919] font-medium text-center px-2">
                        {closure.reason || "Cerrado"}
                      </span>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="flex items-center justify-center py-6">
                      <span className="text-xs md:text-sm text-[#4A6B7A]">—</span>
                    </div>
                  ) : (
                    slots.map((slot: ClassSlot) => {
                      const pct = Math.min(
                        100,
                        (slot.confirmedCount / slot.maxCapacity) * 100,
                      );
                      const isFull = slot.availableSpots === 0;
                      return (
                        <Link
                          key={slot.id}
                          href={`/dashboard/admin/classes/${slot.id}?date=${isoDate(date)}`}
                          className="bg-[#0E2A38] border border-[#1A4A63] p-3 flex flex-col gap-2.5"
                        >
                          {/* Color + nombre */}
                          <div className="flex items-start gap-2">
                            <span
                              className="size-2 rounded-full shrink-0 mt-1"
                              style={{
                                backgroundColor: slot.color ?? "#f97316",
                              }}
                            />
                            <p className="text-sm md:text-base font-semibold text-[#EAEAEA] leading-tight line-clamp-2">
                              {slot.name}
                            </p>
                          </div>

                          {/* Horario */}
                          <p className="text-xs md:text-sm text-[#6B8A99] font-mono tabular-nums leading-none">
                            {formatTime(slot.startTime)}
                          </p>

                          {/* Ocupación */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs md:text-sm text-[#6B8A99] tabular-nums font-medium">
                                {slot.confirmedCount}/{slot.maxCapacity}
                              </span>
                              <span
                                className={`text-xs md:text-sm font-semibold ${isFull ? "text-[#E61919]" : "text-[#27C7B8]"}`}
                              >
                                {isFull
                                  ? "Lleno"
                                  : `${slot.availableSpots} lib.`}
                              </span>
                            </div>
                            <div className="h-1.5 bg-zinc-700/60 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${isFull ? "bg-[#E61919]" : "bg-[#F78837]"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ClassModal
        open={showClassModal}
        onClose={() => setShowClassModal(false)}
        coaches={coaches}
        disciplines={disciplines}
      />

      {/* Confirmación cerrar/reabrir día */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(o) => !o && cancelConfirm()}
        title={
          confirmAction === "close"
            ? `¿Cerrar ${confirmDate ? formatShortDate(confirmDate) : ""}?`
            : `¿Reabrir ${confirmDate ? formatShortDate(confirmDate) : ""}?`
        }
        description={
          confirmAction === "close"
            ? "No se mostrarán clases este día y las reservas existentes quedarán en el historial."
            : "El día volverá a mostrar las clases configuradas normalmente."
        }
        size="md"
      >
        {confirmAction === "close" && (
          <div className="mb-4 max-sm:mt-4">
            <label htmlFor="closureReason" className="block text-xs sm:text-sm text-[#6B8A99] uppercase tracking-wider mb-1.5">
              Motivo del cierre
            </label>
            <input
              id="closureReason"
              type="text"
              value={closureReason}
              onChange={(e) => setClosureReason(e.target.value)}
              placeholder="Ej: Feriado, mantenimiento..."
              className="w-full h-12 rounded-[2px] bg-[#0A1F2A] border border-[#1A4A63] px-3.5 text-sm sm:text-base text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837] transition-colors"
            />
          </div>
        )}
        <div className="flex max-md:flex-col gap-2 max-md:mt-6">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="md:flex-1"
            onClick={cancelConfirm}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant={confirmAction === "close" ? "danger" : "brand"}
            size="md"
            className="md:flex-1"
            loading={pendingClosure}
            onClick={executeConfirm}
          >
            {confirmAction === "close" ? "Cerrar día" : "Reabrir día"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
