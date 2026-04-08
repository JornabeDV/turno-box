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
): Promise<ActionResult<{ status: "CONFIRMED" | "WAITLISTED" }>> {
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

  try {
    const result = await prisma.$transaction(async (tx: Tx) => {
      // ── 1. Bloquear fila de balance y verificar créditos (FOR UPDATE) ──────
      const balanceRows = await tx.$queryRaw<{ available_credits: number }[]>`
        SELECT available_credits
        FROM user_credit_balances
        WHERE user_id = ${userId} AND gym_id = ${gymId}
        FOR UPDATE
      `;

      const balance = balanceRows[0];
      if (!balance || balance.available_credits < 1) {
        throw Object.assign(new Error("Sin créditos disponibles. Comprá un pack para reservar."), { code: "NO_CREDITS" });
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

      // ── 3. Crear reserva ─────────────────────────────────────────────────
      const booking = await tx.booking.create({
        data: { userId, classId, classDate, status, waitlistPos },
      });

      // ── 4. Descontar crédito sólo si CONFIRMED (no waitlisted) ──────────
      if (status === "CONFIRMED") {
        await tx.$executeRaw`
          UPDATE user_credit_balances
          SET available_credits = available_credits - 1,
              version           = version + 1,
              updated_at        = now()
          WHERE user_id = ${userId} AND gym_id = ${gymId}
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

      return status;
    });

    revalidatePath("/");
    revalidatePath("/bookings");
    return { success: true, data: { status: result as "CONFIRMED" | "WAITLISTED" } };

  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === "NO_CREDITS") return { success: false, error: err.message! };
    if (err.code === "P2002")       return { success: false, error: "Ya tenés una reserva para esta clase." };
    console.error("[bookClassAction]", e);
    return { success: false, error: "Error al reservar. Intentá de nuevo." };
  }
}

export async function cancelBookingAction(
  bookingId: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado." };

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

  // ── Calcular si está dentro de la ventana de cancelación con reembolso ──
  const [startHour, startMin] = booking.class.startTime.split(":").map(Number);
  const classStart = new Date(booking.classDate);
  classStart.setUTCHours(startHour, startMin, 0, 0);
  const msUntilClass  = classStart.getTime() - Date.now();
  const hoursUntil    = msUntilClass / 3_600_000;
  const windowHours   = booking.class.gym?.cancelWindowHours ?? 2;
  const canRefund     = hoursUntil >= windowHours && booking.status === "CONFIRMED";

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
        SET available_credits = available_credits + 1,
            version           = version + 1,
            updated_at        = now()
        WHERE user_id = ${userId} AND gym_id = ${gymId}
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
        const rows = await tx.$queryRaw<{ available_credits: number }[]>`
          SELECT available_credits FROM user_credit_balances
          WHERE user_id = ${candidate.userId} AND gym_id = ${gymId}
          FOR UPDATE
        `;
        const creds = rows[0]?.available_credits ?? 0;
        if (creds < 1) continue; // saltear — sin créditos

        // Promover
        await tx.booking.update({
          where: { id: candidate.id },
          data: { status: "CONFIRMED", waitlistPos: null },
        });

        // Descontar crédito al promovido
        await tx.$executeRaw`
          UPDATE user_credit_balances
          SET available_credits = available_credits - 1,
              version           = version + 1,
              updated_at        = now()
          WHERE user_id = ${candidate.userId} AND gym_id = ${gymId}
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
}
