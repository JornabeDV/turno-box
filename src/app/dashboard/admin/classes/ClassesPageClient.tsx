"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatTime } from "@/lib/utils";
import {
  PlusIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import { DisciplinesManager } from "@/components/admin/DisciplinesManager";
import { ClassModal } from "@/components/admin/ClassModal";
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

interface Props {
  disciplines: Discipline[];
  coaches: Coach[];
  weekParam: string;
  prevWeek: string;
  nextWeek: string;
  filteredSlotsPerDay: ClassSlot[][];
  totalClasses: number;
  weekStart: Date;
  discipline?: string;
}

export function ClassesPageClient({
  disciplines,
  coaches,
  weekParam,
  prevWeek,
  nextWeek,
  filteredSlotsPerDay,
  totalClasses,
  weekStart,
  discipline,
}: Props) {
  const [showClassModal, setShowClassModal] = useState(false);
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#6B8A99] uppercase tracking-wider mb-0.5">
            Admin
          </p>
          <h2 className="text-xl font-bold text-[#EAEAEA] tracking-tight">
            Clases
          </h2>
        </div>
        <Button
          size="sm"
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
          <Button size="sm" variant="ghost">
            <CaretLeftIcon size={14} weight="bold" />
            Anterior
          </Button>
        </Link>
        <p className="text-sm font-medium text-[#EAEAEA] tabular-nums">
          {formatShortDate(weekStart)} –{" "}
          {formatShortDate(addDays(weekStart, 6))}
        </p>
        <Link
          href={`/dashboard/admin/classes?week=${nextWeek}${discipline ? `&discipline=${encodeURIComponent(discipline)}` : ""}`}
        >
          <Button size="sm" variant="ghost">
            Siguiente
            <CaretRightIcon size={14} weight="bold" />
          </Button>
        </Link>
      </div>

      {/* Grid semanal */}
      {totalClasses === 0 && disciplines.length === 0 ? (
        <div className="bg-[#0E2A38] border border-[#1A4A63] px-4 py-16 text-center">
          <p className="text-sm text-[#6B8A99] mb-4">
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

              return (
                <div
                  key={dayKey}
                  className={
                    slots.length === 0
                      ? "hidden md:flex md:flex-col md:gap-2"
                      : "flex flex-col gap-2"
                  }
                >
                  {/* Cabecera del día — horizontal en mobile, centrada en desktop */}
                  <div
                    className={`rounded-[2px] ${isToday ? "bg-[#F78837]/15" : "bg-[#0E2A38]/40"}`}
                  >
                    {/* Mobile */}
                    <div className="md:hidden flex items-center justify-between px-3 py-2.5">
                      <span
                        className={`text-sm font-semibold ${isToday ? "text-[#F78837]" : "text-[#EAEAEA]"}`}
                      >
                        {DAY_LABELS[dayKey]}
                        {isToday && (
                          <span className="ml-2 text-[10px] bg-[#F78837]/20 text-[#F78837] px-1.5 py-0.5 rounded-full font-medium">
                            hoy
                          </span>
                        )}
                      </span>
                      <span
                        className={`text-xs font-mono tabular-nums ${isToday ? "text-[#F78837]" : "text-[#6B8A99]"}`}
                      >
                        {date.toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    {/* Desktop */}
                    <div className="hidden md:block text-center py-2">
                      <p
                        className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? "text-[#F78837]" : "text-[#6B8A99]"}`}
                      >
                        {DAY_LABELS[dayKey].slice(0, 3)}
                      </p>
                      <p
                        className={`text-base font-semibold leading-tight ${isToday ? "text-[#F78837]" : "text-[#EAEAEA]"}`}
                      >
                        {date.getDate()}
                      </p>
                    </div>
                  </div>

                  {/* Cards de turnos */}
                  {slots.length === 0 ? (
                    <div className="flex items-center justify-center py-6">
                      <span className="text-xs text-[#4A6B7A]">—</span>
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
                            <p className="text-sm font-semibold text-[#EAEAEA] leading-tight line-clamp-2">
                              {slot.name}
                            </p>
                          </div>

                          {/* Horario */}
                          <p className="text-xs text-[#6B8A99] font-mono tabular-nums leading-none">
                            {formatTime(slot.startTime)}
                          </p>

                          {/* Ocupación */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-[#6B8A99] tabular-nums font-medium">
                                {slot.confirmedCount}/{slot.maxCapacity}
                              </span>
                              <span
                                className={`text-xs font-semibold ${isFull ? "text-[#E61919]" : "text-[#27C7B8]"}`}
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
    </div>
  );
}
