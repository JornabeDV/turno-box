// Queries de clases con cupos calculados en el servidor
// Decisión: calculamos cupos en la query para evitar N+1 y tener datos frescos.

import { prisma } from "@/lib/prisma";
import { toClassDate } from "@/lib/utils";
import type { ClassSlot } from "@/types";

/**
 * Devuelve las clases del día indicado con:
 * - cupos confirmados (excluyendo cancelados)
 * - el booking del usuario autenticado (si existe)
 */
export async function getClassSlotsForDay(
  gymId: string,
  date: Date,
  userId: string
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

  const classes = await prisma.gymClass.findMany({
    where: {
      gymId,
      dayOfWeek,
      isActive: true,
      deletedAt: null,
    },
    orderBy: { startTime: "asc" },
    select: {
      id: true,
      name: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      maxCapacity: true,
      color: true,
      coach: { select: { name: true } },
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

  return classes.map((c) => {
    type Booking = typeof c.bookings[number];
    const confirmed = c.bookings.filter((b: Booking) => b.status === "CONFIRMED");
    const confirmedCount = confirmed.length;
    const availableSpots = Math.max(0, c.maxCapacity - confirmedCount);
    const userBooking = c.bookings.find((b: Booking) => b.userId === userId);

    return {
      id: c.id,
      name: c.name,
      dayOfWeek: c.dayOfWeek,
      startTime: c.startTime,
      endTime: c.endTime,
      maxCapacity: c.maxCapacity,
      color: c.color,
      coachName: c.coach?.name ?? null,
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
  });
}
