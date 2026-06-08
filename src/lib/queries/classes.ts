// Queries de clases con cupos calculados en el servidor
// Decisión: calculamos cupos en la query para evitar N+1 y tener datos frescos.

import { prisma } from "@/lib/prisma";
import { toClassDate } from "@/lib/utils";
import type { ClassSlot } from "@/types";

/**
 * Devuelve los números de día de semana (0=dom, 6=sáb) en los que el gym
 * tiene al menos una clase activa configurada.
 */
export async function getGymClassDays(gymId: string): Promise<number[]> {
  const rows = await prisma.gymClass.findMany({
    where: { gymId, isActive: true, deletedAt: null },
    select: { dayOfWeek: true },
    distinct: ["dayOfWeek"],
  });

  const dayMap: Record<string, number> = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
  };

  return rows.map((r) => dayMap[r.dayOfWeek]).sort((a, b) => a - b);
}

export async function getClassSlotsForDay(
  gymId: string,
  date: Date,
  userId: string,
  filterCoachId?: string
): Promise<ClassSlot[]> {
  const dayOfWeek = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ][date.getDay()] as ClassSlot["dayOfWeek"];

  const classDate = toClassDate(date);

  // 1. Si el gym está cerrado ese día, no hay slots
  const closure = await prisma.gymClosure.findUnique({
    where: { gymId_date: { gymId, date: classDate } },
  });
  if (closure) return [];

  const classes = await prisma.gymClass.findMany({
    where: {
      gymId,
      dayOfWeek,
      isActive: true,
      deletedAt: null,
      ...(filterCoachId ? { coachId: filterCoachId } : {}),
    },
    orderBy: { startTime: "asc" },
    select: {
      id: true,
      description: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      maxCapacity: true,
      color: true,
      coachId: true,
      disciplineId: true,
      coach: { select: { name: true } },
      discipline: { select: { name: true } },
      overrides: {
        where: { date: classDate },
        select: {
          isCancelled: true,
          startTime: true,
          endTime: true,
          maxCapacity: true,
          color: true,
          description: true,
          coachId: true,
          disciplineId: true,
        },
      },
      bookings: {
        where: {
          classDate,
          deletedAt: null,
        },
        select: {
          id: true,
          status: true,
          userId: true,
          waitlistPos: true,
        },
      },
    },
  });

  return classes
    .map((c) => {
      const override = c.overrides[0];
      if (override?.isCancelled) return null;

      type Booking = (typeof c.bookings)[number];
      const confirmed = c.bookings.filter(
        (b: Booking) => b.status === "CONFIRMED"
      );
      const confirmedCount = confirmed.length;
      const effectiveMaxCapacity = override?.maxCapacity ?? c.maxCapacity;
      const availableSpots = Math.max(0, effectiveMaxCapacity - confirmedCount);
      const userBooking = c.bookings.find((b: Booking) => b.userId === userId);

      return {
        id: c.id,
        name: c.discipline?.name ?? "Sin disciplina",
        description: override?.description ?? c.description,
        dayOfWeek: c.dayOfWeek,
        startTime: override?.startTime ?? c.startTime,
        endTime: override?.endTime ?? c.endTime,
        maxCapacity: effectiveMaxCapacity,
        color: override?.color ?? c.color,
        coachId: override?.coachId ?? c.coachId,
        disciplineId: override?.disciplineId ?? c.disciplineId,
        coachName: c.coach?.name ?? null,
        disciplineName: c.discipline?.name ?? null,
        confirmedCount,
        availableSpots,
        isFull: availableSpots === 0,
        userBooking: userBooking
          ? {
              id: userBooking.id,
              status: userBooking.status,
              waitlistPos: userBooking.waitlistPos,
            }
          : null,
      };
    })
    .filter(Boolean) as ClassSlot[];
}
