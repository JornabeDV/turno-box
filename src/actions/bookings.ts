"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toClassDate } from "@/lib/utils";
import type { ActionResult } from "@/types";

/**
 * Reserva un turno para el usuario autenticado.
 * Si el cupo está lleno, lo agrega a la lista de espera.
 * Previene doble reserva con el unique constraint de BD.
 */
export async function bookClassAction(
  classId: string,
  dateStr: string // "2025-04-07" ISO
): Promise<ActionResult<{ status: "CONFIRMED" | "WAITLISTED" }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "No autenticado." };
  }

  const userId = session.user.id;
  const classDate = toClassDate(new Date(dateStr));

  // Verificar que la clase existe y pertenece al gym del usuario
  const gymClass = await prisma.gymClass.findFirst({
    where: { id: classId, isActive: true, deletedAt: null },
    select: { id: true, maxCapacity: true, gymId: true },
  });

  if (!gymClass) return { success: false, error: "Clase no encontrada." };

  // Verificar que el usuario pertenece al mismo gym
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { gymId: true },
  });

  if (user?.gymId !== gymClass.gymId) {
    return { success: false, error: "No tenés acceso a esta clase." };
  }

  // Contar confirmados para saber si hay cupo
  const confirmedCount = await prisma.booking.count({
    where: { classId, classDate, status: "CONFIRMED", deletedAt: null },
  });

  const isFull = confirmedCount >= gymClass.maxCapacity;

  // Calcular posición en lista de espera si hace falta
  let waitlistPos: number | null = null;
  if (isFull) {
    const maxPos = await prisma.booking.aggregate({
      where: { classId, classDate, status: "WAITLISTED", deletedAt: null },
      _max: { waitlistPos: true },
    });
    waitlistPos = (maxPos._max.waitlistPos ?? 0) + 1;
  }

  try {
    await prisma.booking.create({
      data: {
        userId,
        classId,
        classDate,
        status: isFull ? "WAITLISTED" : "CONFIRMED",
        waitlistPos,
      },
    });
  } catch (e: unknown) {
    // Unique constraint — ya tiene reserva para esa clase ese día
    if ((e as { code?: string }).code === "P2002") {
      return { success: false, error: "Ya tenés una reserva para esta clase." };
    }
    throw e;
  }

  revalidatePath("/");
  revalidatePath("/bookings");

  return {
    success: true,
    data: { status: isFull ? "WAITLISTED" : "CONFIRMED" },
  };
}

/**
 * Cancela un booking existente.
 * Si era CONFIRMED y hay waitlist, promueve al primero automáticamente.
 */
export async function cancelBookingAction(
  bookingId: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "No autenticado." };
  }

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      userId: session.user.id,
      deletedAt: null,
    },
    select: { id: true, status: true, classId: true, classDate: true },
  });

  if (!booking) return { success: false, error: "Reserva no encontrada." };

  // Cancelar
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  // Si era CONFIRMED → promover al primero de la lista de espera
  if (booking.status === "CONFIRMED") {
    const first = await prisma.booking.findFirst({
      where: {
        classId: booking.classId,
        classDate: booking.classDate,
        status: "WAITLISTED",
        deletedAt: null,
      },
      orderBy: { waitlistPos: "asc" },
    });

    if (first) {
      await prisma.booking.update({
        where: { id: first.id },
        data: { status: "CONFIRMED", waitlistPos: null },
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/bookings");

  return { success: true, data: undefined };
}
