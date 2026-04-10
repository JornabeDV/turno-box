"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatTime } from "@/lib/utils";
import { deleteClassAction } from "@/actions/classes";
import {
  PlusIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import { DisciplinesManager } from "@/components/admin/DisciplinesManager";
import { ClassModal, type ClassData } from "@/components/admin/ClassModal";
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
  const [editingClass, setEditingClass] = useState<ClassData | undefined>(
    undefined,
  );
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

  function handleEditClass(slot: ClassSlot) {
    setEditingClass({
      id: slot.id,
      description: slot.description,
      dayOfWeek: slot.dayOfWeek as any,
      startTime: slot.startTime,
      endTime: slot.endTime,
      maxCapacity: slot.maxCapacity,
      color: slot.color,
      coachId: slot.coachId,
      disciplineId: slot.disciplineId,
    });
    setShowClassModal(true);
  }

  function handleCloseModal() {
    setShowClassModal(false);
    setEditingClass(undefined);
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
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">
            Admin
          </p>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
            Clases
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="brand"
            className="cursor-pointer"
            onClick={() => setShowClassModal(true)}
          >
            <PlusIcon size={14} weight="bold" />
            Nueva clase
          </Button>
        </div>
      </div>

      {/* Badges de disciplinas con gestión */}
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
        <p className="text-sm font-medium text-zinc-300 tabular-nums">
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
        <div className="glass-card rounded-2xl px-4 py-16 text-center">
          <p className="text-sm text-zinc-500 mb-4">
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
        <div className="overflow-x-auto -mx-4 px-4 pb-2">
          <div className="grid grid-cols-7 gap-2.5 min-w-[700px]">
            {weekDays.map(({ dayKey, date }, i) => {
              const slots = filteredSlotsPerDay[i];
              const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
              const isToday = dateKey === todayKey;

              return (
                <div key={dayKey} className="flex flex-col gap-2">
                  {/* Cabecera del día */}
                  <div
                    className={`text-center py-2 rounded-xl ${isToday ? "bg-orange-500/15" : "bg-zinc-800/40"}`}
                  >
                    <p
                      className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? "text-orange-400" : "text-zinc-500"}`}
                    >
                      {DAY_LABELS[dayKey].slice(0, 3)}
                    </p>
                    <p
                      className={`text-base font-semibold leading-tight ${isToday ? "text-orange-300" : "text-zinc-300"}`}
                    >
                      {date.getDate()}
                    </p>
                  </div>

                  {/* Cards de turnos */}
                  {slots.length === 0 ? (
                    <div className="flex items-center justify-center py-6">
                      <span className="text-xs text-zinc-700">—</span>
                    </div>
                  ) : (
                    slots.map((slot: ClassSlot) => {
                      const pct = Math.min(
                        100,
                        (slot.confirmedCount / slot.maxCapacity) * 100,
                      );
                      const isFull = slot.availableSpots === 0;
                      return (
                        <div
                          key={slot.id}
                          className="glass-card rounded-xl p-2.5 flex flex-col gap-2"
                        >
                          {/* Color + nombre */}
                          <div className="flex items-start gap-1.5">
                            <span
                              className="size-1.5 rounded-full shrink-0 mt-1"
                              style={{
                                backgroundColor: slot.color ?? "#f97316",
                              }}
                            />
                            <p className="text-xs font-semibold text-zinc-100 leading-tight line-clamp-2">
                              {slot.name}
                            </p>
                          </div>

                          {/* Disciplina */}
                          {slot.disciplineName && (
                            <p className="text-[10px] text-zinc-600 leading-none">
                              {slot.disciplineName}
                            </p>
                          )}

                          {/* Horario */}
                          <p className="text-[10px] text-zinc-500 font-mono tabular-nums leading-none">
                            {formatTime(slot.startTime)}–
                            {formatTime(slot.endTime)}
                          </p>

                          {/* Coach */}
                          {slot.coachName && (
                            <p className="text-[10px] text-zinc-500 truncate leading-none">
                              {slot.coachName}
                            </p>
                          )}

                          {/* Ocupación */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-zinc-400 tabular-nums">
                                {slot.confirmedCount}/{slot.maxCapacity} ocup.
                              </span>
                              <span
                                className={`text-[10px] font-medium ${isFull ? "text-rose-400" : "text-emerald-400"}`}
                              >
                                {isFull
                                  ? "Lleno"
                                  : `${slot.availableSpots} lib.`}
                              </span>
                            </div>
                            <div className="h-1 bg-zinc-700/60 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${isFull ? "bg-rose-500" : "bg-orange-500"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          {/* Acciones */}
                          <div className="flex gap-1 pt-0.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClass(slot)}
                              className="flex-1 text-[10px] h-7 px-2"
                            >
                              Editar
                            </Button>
                            <form
                              action={deleteClassAction.bind(null, slot.id)}
                            >
                              <Button
                                variant="danger"
                                size="sm"
                                type="submit"
                                className="text-[10px] h-7 px-2"
                              >
                                ×
                              </Button>
                            </form>
                          </div>
                        </div>
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
        onClose={handleCloseModal}
        class={editingClass}
        coaches={coaches}
        disciplines={disciplines}
      />
    </div>
  );
}
