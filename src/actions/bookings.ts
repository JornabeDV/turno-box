"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toClassDate } from "@/lib/utils";
import type { ActionResult } from "@/types";
type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export async function bookClassAction(
  classId: string,
  dateStr: string
): Promise<ActionResult<{ status: "CONFIRMED" | "WAITLISTED"; bookingId: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado." };

  const userId    = session.user.id;
  const gymId     = (session.user as { gymId?: string }).gymId;
  const classDate = toClassDate(new Date(dateStr));

  if (!gymId) return { success: false, error: "Sin gimnasio asignado." };

  const gymClass = await prisma.gymClass.findFirst({
    where: { id: classId, gymId, isActive: true, deletedAt: null },
    select: { id: true, maxCapacity: true },
  });
  if (!gymClass) return { success: false, error: "Clase no encontrada." };

  const existingBooking = await prisma.booking.findFirst({
    where: { userId, classId, classDate, deletedAt: null },
    select: { id: true, status: true },
  });

  if (existingBooking && existingBooking.status !== "CANCELLED") {
    return { success: false, error: "Ya tenés una reserva para esta clase." };
  }

  // existingBookingId presente solo cuando se reactiva uno cancelado
  const existingBookingId = existingBooking?.id ?? null;

  try {
    const result = await prisma.$transaction(async (tx: Tx) => {
      // ── 1. Bloquear fila de balance y verificar créditos (FOR UPDATE) ──────
      const balanceRows = await tx.$queryRaw<{ availableCredits: number }[]>`
        SELECT "availableCredits"
        FROM user_credit_balances
        WHERE "userId" = ${userId} AND "gymId" = ${gymId}
        FOR UPDATE
      `;

      const balance = balanceRows[0];
      if (!balance || balance.availableCredits < 1) {
        throw Object.assign(new Error("Sin créditos disponibles. Comprá un abono para reservar."), { code: "NO_CREDITS" });
      }

      // ── 2. Verificar cupo ────────────────────────────────────────────────
      const confirmedCount = await tx.booking.count({
        where: { classId, classDate, status: "CONFIRMED", deletedAt: null },
      });
      const isFull = confirmedCount >= gymClass.maxCapacity;

      let waitlistPos: number | null = null;
      if (isFull) {
        const agg = await tx.booking.aggregate({
          where: { classId, classDate, status: "WAITLISTED", deletedAt: null },
          _max: { waitlistPos: true },
        });
        waitlistPos = (agg._max.waitlistPos ?? 0) + 1;
      }

      const status = isFull ? "WAITLISTED" : "CONFIRMED";

      // ── 3. Crear o reactivar reserva ────────────────────────────────────
      const booking = existingBookingId
        ? await tx.booking.update({
            where: { id: existingBookingId },
            data: { status, waitlistPos, cancelledAt: null },
          })
        : await tx.booking.create({
            data: { userId, classId, classDate, status, waitlistPos },
          });

      // ── 4. Descontar crédito sólo si CONFIRMED (no waitlisted) ──────────
      if (status === "CONFIRMED") {
        await tx.$executeRaw`
          UPDATE user_credit_balances
          SET "availableCredits" = "availableCredits" - 1,
              "version"           = "version" + 1,
              "updatedAt"        = now()
          WHERE "userId" = ${userId} AND "gymId" = ${gymId}
        `;

        await tx.creditTransaction.create({
          data: {
            userId,
            gymId,
            type:      "CONSUME",
            amount:    -1,
            bookingId: booking.id,
          },
        });
      }

      return { status, bookingId: booking.id };
    });

    revalidatePath("/");
    revalidatePath("/bookings");
    return { success: true, data: { status: result.status as "CONFIRMED" | "WAITLISTED", bookingId: result.bookingId } };

  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === "NO_CREDITS") return { success: false, error: err.message! };
    if (err.code === "P2002")       return { success: false, error: "Ya tenés una reserva para esta clase." };
    // console.error("[bookClassAction]", e);
    return { success: false, error: "Error al reservar. Intentá de nuevo." };
  }
}

export async function cancelBookingAction(
  bookingId: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "No autenticado." };
  }

  const userId = session.user.id;
  const gymId  = (session.user as { gymId?: string }).gymId ?? "";

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId, deletedAt: null },
    select: {
      id: true, status: true, classId: true, classDate: true,
      class: { select: { startTime: true, gym: { select: { cancelWindowHours: true } } } },
    },
  });
  if (!booking) return { success: false, error: "Reserva no encontrada." };

  // No permitir cancelar si ya está cancelada
  if (booking.status === "CANCELLED") {
    return { success: true, data: undefined }; // No es error, ya está cancelada
  }

  // ── Calcular si está dentro de la ventana de cancelación con reembolso ──
  const [startHour, startMin] = booking.class.startTime.split(":").map(Number);
  const classStart = new Date(booking.classDate);
  classStart.setUTCHours(startHour, startMin, 0, 0);
  const msUntilClass  = classStart.getTime() - Date.now();
  const hoursUntil    = msUntilClass / 3_600_000;
  const windowHours   = booking.class.gym?.cancelWindowHours ?? 2;
  const canRefund     = hoursUntil >= windowHours && booking.status === "CONFIRMED";

  try {
    await prisma.$transaction(async (tx: Tx) => {
    // Cancelar reserva
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    // Devolver crédito si corresponde
    if (canRefund) {
      await tx.$executeRaw`
        UPDATE user_credit_balances
        SET "availableCredits" = "availableCredits" + 1,
            "version"           = "version" + 1,
            "updatedAt"        = now()
        WHERE "userId" = ${userId} AND "gymId" = ${gymId}
      `;

      await tx.creditTransaction.create({
        data: {
          userId,
          gymId,
          type:      "REFUND",
          amount:    +1,
          bookingId: booking.id,
        },
      });
    }

    // Si era CONFIRMED → promover primer waitlisted (que tenga créditos)
    if (booking.status === "CONFIRMED") {
      const waitlisted = await tx.booking.findMany({
        where: { classId: booking.classId, classDate: booking.classDate, status: "WAITLISTED", deletedAt: null },
        orderBy: { waitlistPos: "asc" },
        take: 5,
        select: { id: true, userId: true },
      });

      for (const candidate of waitlisted) {
        // Verificar que el candidato tenga créditos antes de promover
        const rows = await tx.$queryRaw<{ availableCredits: number }[]>`
          SELECT "availableCredits" FROM user_credit_balances
          WHERE "userId" = ${candidate.userId} AND "gymId" = ${gymId}
          FOR UPDATE
        `;
        const creds = rows[0]?.availableCredits ?? 0;
        if (creds < 1) continue; // saltear — sin créditos

        // Promover
        await tx.booking.update({
          where: { id: candidate.id },
          data: { status: "CONFIRMED", waitlistPos: null },
        });

        // Descontar crédito al promovido
        await tx.$executeRaw`
          UPDATE user_credit_balances
          SET "availableCredits" = "availableCredits" - 1,
              "version"           = "version" + 1,
              "updatedAt"        = now()
          WHERE "userId" = ${candidate.userId} AND "gymId" = ${gymId}
        `;
        await tx.creditTransaction.create({
          data: {
            userId:    candidate.userId,
            gymId,
            type:      "CONSUME",
            amount:    -1,
            bookingId: candidate.id,
          },
        });
        break; // sólo promover uno
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/bookings");
  return { success: true, data: undefined };
  } catch (e: unknown) {
    return { success: false, error: "Error al cancelar." };
  }
}
