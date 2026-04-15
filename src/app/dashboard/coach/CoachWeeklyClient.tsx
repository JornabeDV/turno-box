"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatTime } from "@/lib/utils";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { DisciplinesManager } from "@/components/admin/DisciplinesManager";
import type { ClassSlot } from "@/types";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lunes", TUESDAY: "Martes", WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves", FRIDAY: "Viernes", SATURDAY: "Sábado", SUNDAY: "Domingo",
};
const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

type Discipline = { id: string; name: string; color: string | null };

interface Props {
  disciplines: Discipline[];
  weekParam: string;
  prevWeek: string;
  nextWeek: string;
  filteredSlotsPerDay: ClassSlot[][];
  weekStart: Date;
  discipline?: string;
}

export function CoachWeeklyClient({
  disciplines,
  weekParam,
  prevWeek,
  nextWeek,
  filteredSlotsPerDay,
  weekStart,
  discipline,
}: Props) {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  function formatShortDate(date: Date): string {
    return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  }

  function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  function isoDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  const weekDays = DAY_ORDER.map((dayKey, i) => ({
    dayKey,
    date: addDays(weekStart, i),
  }));

  const totalClasses = filteredSlotsPerDay.reduce((sum, slots) => sum + slots.length, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Coach</p>
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Mis clases</h2>
      </div>

      {/* Badges de disciplinas */}
      <DisciplinesManager
        disciplines={disciplines}
        weekParam={weekParam}
        basePath="/dashboard/coach"
      />

      {/* Navegación de semana */}
      <div className="flex items-center justify-between gap-4">
        <Link href={`/dashboard/coach?week=${prevWeek}${discipline ? `&discipline=${encodeURIComponent(discipline)}` : ""}`}>
          <Button size="sm" variant="ghost">
            <CaretLeftIcon size={14} weight="bold" />
            Anterior
          </Button>
        </Link>
        <p className="text-sm font-medium text-zinc-300 tabular-nums">
          {formatShortDate(weekStart)} – {formatShortDate(addDays(weekStart, 6))}
        </p>
        <Link href={`/dashboard/coach?week=${nextWeek}${discipline ? `&discipline=${encodeURIComponent(discipline)}` : ""}`}>
          <Button size="sm" variant="ghost">
            Siguiente
            <CaretRightIcon size={14} weight="bold" />
          </Button>
        </Link>
      </div>

      {/* Grid semanal */}
      {totalClasses === 0 ? (
        <div className="glass-card rounded-2xl px-4 py-16 text-center">
          <p className="text-sm text-zinc-500">No tenés clases asignadas esta semana.</p>
        </div>
      ) : (
        <div className="md:overflow-x-auto md:-mx-4 md:px-4 md:pb-2">
          <div className="flex flex-col gap-4 md:grid md:grid-cols-7 md:gap-2.5 md:min-w-[700px]">
            {weekDays.map(({ dayKey, date }, i) => {
              const slots = filteredSlotsPerDay[i];
              const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
              const isToday = dateKey === todayKey;

              return (
                <div key={dayKey} className={slots.length === 0 ? "hidden md:flex md:flex-col md:gap-2" : "flex flex-col gap-2"}>
                  {/* Cabecera del día */}
                  <div className={`rounded-xl ${isToday ? "bg-orange-500/15" : "bg-zinc-800/40"}`}>
                    {/* Mobile */}
                    <div className="md:hidden flex items-center justify-between px-3 py-2.5">
                      <span className={`text-sm font-semibold ${isToday ? "text-orange-400" : "text-zinc-300"}`}>
                        {DAY_LABELS[dayKey]}
                        {isToday && <span className="ml-2 text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full font-medium">hoy</span>}
                      </span>
                      <span className={`text-xs font-mono tabular-nums ${isToday ? "text-orange-300" : "text-zinc-500"}`}>
                        {date.toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    {/* Desktop */}
                    <div className="hidden md:block text-center py-2">
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? "text-orange-400" : "text-zinc-500"}`}>
                        {DAY_LABELS[dayKey].slice(0, 3)}
                      </p>
                      <p className={`text-base font-semibold leading-tight ${isToday ? "text-orange-300" : "text-zinc-300"}`}>
                        {date.getDate()}
                      </p>
                    </div>
                  </div>

                  {/* Cards de turnos */}
                  {slots.length === 0 ? (
                    <div className="hidden md:flex items-center justify-center py-6">
                      <span className="text-xs text-zinc-700">—</span>
                    </div>
                  ) : (
                    slots.map((slot: ClassSlot) => {
                      const pct = Math.min(100, (slot.confirmedCount / slot.maxCapacity) * 100);
                      const isFull = slot.availableSpots === 0;
                      return (
                        <Link
                          key={slot.id}
                          href={`/dashboard/coach/classes/${slot.id}?date=${isoDate(date)}`}
                          className="glass-card glass-interactive rounded-xl p-3 flex flex-col gap-2.5"
                        >
                          {/* Color + nombre */}
                          <div className="flex items-start gap-2">
                            <span
                              className="size-2 rounded-full shrink-0 mt-1"
                              style={{ backgroundColor: slot.color ?? "#f97316" }}
                            />
                            <p className="text-sm font-semibold text-zinc-100 leading-tight line-clamp-2">
                              {slot.name}
                            </p>
                          </div>

                          {/* Horario */}
                          <p className="text-xs text-zinc-500 font-mono tabular-nums leading-none">
                            {formatTime(slot.startTime)}
                          </p>

                          {/* Ocupación */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-zinc-400 tabular-nums font-medium">
                                {slot.confirmedCount}/{slot.maxCapacity}
                              </span>
                              <span className={`text-xs font-semibold ${isFull ? "text-rose-400" : "text-emerald-400"}`}>
                                {isFull ? "Lleno" : `${slot.availableSpots} lib.`}
                              </span>
                            </div>
                            <div className="h-1.5 bg-zinc-700/60 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${isFull ? "bg-rose-500" : "bg-orange-500"}`}
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
    </div>
  );
}
