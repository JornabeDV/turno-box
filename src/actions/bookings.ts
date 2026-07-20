"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toClassDate } from "@/lib/utils";
import { sendPushToUser } from "@/lib/push";
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
    select: { id: true, maxCapacity: true, gym: { select: { waitlistEnabled: true } } },
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

      if (isFull && !gymClass.gym?.waitlistEnabled) {
        throw Object.assign(
          new Error("La clase está completa y la lista de espera no está habilitada."),
          { code: "CLASS_FULL_NO_WAITLIST" }
        );
      }

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

        // FIFO: consumir del payment con vencimiento más próximo primero
        // PostgreSQL ordena ASC con NULLs al final → sin vencimiento se usa último
        const now = new Date();
        const activePayments = await tx.payment.findMany({
          where: {
            userId,
            gymId,
            status: "APPROVED",
            OR: [{ expiresAt: { gt: now } }, { expiresAt: null }],
          },
          select: {
            id: true,
            creditsGranted: true,
            creditTxs: { select: { amount: true } },
          },
          orderBy: { expiresAt: "asc" },
        });

        let targetPaymentId: string | null = null;
        for (const p of activePayments) {
          const remaining = p.creditTxs.reduce((s, t) => s + t.amount, 0);
          if (remaining > 0) {
            targetPaymentId = p.id;
            break;
          }
        }

        await tx.creditTransaction.create({
          data: {
            userId,
            gymId,
            type:      "CONSUME",
            amount:    -1,
            bookingId: booking.id,
            ...(targetPaymentId ? { paymentId: targetPaymentId } : {}),
          },
        });
      }

      return { status, bookingId: booking.id };
    });

    revalidatePath("/");
    revalidatePath("/bookings");
    revalidatePath("/classes/[classId]");
    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/metrics");

    // Notificación push (no bloquea la respuesta)
    const pushBody =
      result.status === "CONFIRMED"
        ? "Tu reserva fue confirmada. ¡Nos vemos en el gym!"
        : "Estás en lista de espera. Te avisaremos si se libera un lugar.";
    sendPushToUser(userId, {
      title: result.status === "CONFIRMED" ? "Reserva confirmada ✓" : "En lista de espera",
      body: pushBody,
      url: "/bookings",
      tag: "booking",
    }).catch((err) => {
      console.error("[bookClassAction] push failed for user", userId, err);
    });

    return { success: true, data: { status: result.status as "CONFIRMED" | "WAITLISTED", bookingId: result.bookingId } };

  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === "NO_CREDITS")              return { success: false, error: err.message! };
    if (err.code === "CLASS_FULL_NO_WAITLIST")  return { success: false, error: err.message! };
    if (err.code === "P2002")                   return { success: false, error: "Ya tenés una reserva para esta clase." };
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

  const currentUserId = session.user.id;
  const currentUserRole = (session.user as { role?: string }).role ?? "";
  const gymId  = (session.user as { gymId?: string }).gymId ?? "";
  const isAdmin = currentUserRole === "ADMIN" || currentUserRole === "SUPER_ADMIN";

  const booking = await prisma.booking.findFirst({
    where: isAdmin
      ? { id: bookingId, deletedAt: null }
      : { id: bookingId, userId: currentUserId, deletedAt: null },
    select: {
      id: true, status: true, classId: true, classDate: true, userId: true,
      class: { select: { startTime: true, gym: { select: { cancelWindowHours: true } } } },
    },
  });
  if (!booking) return { success: false, error: "Reserva no encontrada." };

  return runCancelBooking(booking, gymId);
}

// ── HELPERS Y ACCIONES PARA COACHES / ADMINS ────────────────────────

async function requireClassManager(
  classId: string,
  classDate: Date,
  userId: string,
  gymId: string,
  role: string
): Promise<void> {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return;

  const gymClass = await prisma.gymClass.findFirst({
    where: { id: classId, gymId, deletedAt: null },
    select: { coachId: true },
  });
  if (!gymClass) throw new Error("Clase no encontrada.");

  if (gymClass.coachId === userId) return;

  const override = await prisma.classOverride.findUnique({
    where: { gymClassId_date: { gymClassId: classId, date: classDate } },
    select: { coachId: true },
  });
  if (override?.coachId === userId) return;

  throw new Error("No autorizado para gestionar esta clase.");
}

function revalidateBookingPaths(classId: string, userId?: string) {
  revalidatePath("/");
  revalidatePath("/bookings");
  revalidatePath("/dashboard/coach");
  revalidatePath(`/dashboard/coach/classes/${classId}`);
  revalidatePath(`/dashboard/admin/classes/${classId}`);
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/metrics");
  if (userId) revalidatePath(`/dashboard/admin/students/${userId}`);
}

async function runCancelBooking(
  booking: {
    id: string;
    status: string;
    classId: string;
    classDate: Date;
    userId: string;
    class: { startTime: string; gym?: { cancelWindowHours?: number | null } | null };
  },
  gymId: string
): Promise<ActionResult> {
  // El userId para reembolsos/créditos es el dueño de la reserva, no el admin/coach que cancela
  const bookingUserId = booking.userId;

  // No permitir cancelar si ya está cancelada
  if (booking.status === "CANCELLED") {
    return { success: true, data: undefined };
  }

  // ── Calcular si está dentro de la ventana de cancelación con reembolso ──
  // startTime está en hora de Argentina (UTC-3)
  const classDateStr = booking.classDate.toISOString().split("T")[0];
  const classStart = new Date(
    `${classDateStr}T${booking.class.startTime}:00-03:00`,
  );
  const msUntilClass  = classStart.getTime() - Date.now();
  const hoursUntil    = msUntilClass / 3_600_000;
  const windowHours   = booking.class.gym?.cancelWindowHours ?? 2;
  const canRefund     = hoursUntil >= windowHours && booking.status === "CONFIRMED";

  try {
    // La transacción retorna el userId del promovido (si hubo) para notificar fuera
    const promotedUserId = await prisma.$transaction(async (tx: Tx): Promise<string | null> => {
    // Cancelar reserva
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    // Devolver crédito si corresponde
    if (canRefund) {
      await tx.$executeRaw`
        UPDATE user_credit_balances
        SET "availableCredits" = "availableCredits" + 1,
            "version"           = "version" + 1,
            "updatedAt"        = now()
        WHERE "userId" = ${bookingUserId} AND "gymId" = ${gymId}
      `;

      // Recuperar el paymentId del CONSUME original para mantener trazabilidad
      const consumeTx = await tx.creditTransaction.findFirst({
        where: { bookingId: booking.id, type: "CONSUME" },
        select: { paymentId: true },
      });

      await tx.creditTransaction.create({
        data: {
          userId: bookingUserId,
          gymId,
          type:      "REFUND",
          amount:    +1,
          bookingId: booking.id,
          ...(consumeTx?.paymentId ? { paymentId: consumeTx.paymentId } : {}),
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

        // Descontar crédito al promovido (FIFO)
        await tx.$executeRaw`
          UPDATE user_credit_balances
          SET "availableCredits" = "availableCredits" - 1,
              "version"           = "version" + 1,
              "updatedAt"        = now()
          WHERE "userId" = ${candidate.userId} AND "gymId" = ${gymId}
        `;

        const candidateNow = new Date();
        const candidatePayments = await tx.payment.findMany({
          where: {
            userId: candidate.userId,
            gymId,
            status: "APPROVED",
            OR: [{ expiresAt: { gt: candidateNow } }, { expiresAt: null }],
          },
          select: {
            id: true,
            creditsGranted: true,
            creditTxs: { select: { amount: true } },
          },
          orderBy: { expiresAt: "asc" },
        });

        let candidatePaymentId: string | null = null;
        for (const p of candidatePayments) {
          const remaining = p.creditTxs.reduce((s, t) => s + t.amount, 0);
          if (remaining > 0) { candidatePaymentId = p.id; break; }
        }

        await tx.creditTransaction.create({
          data: {
            userId:    candidate.userId,
            gymId,
            type:      "CONSUME",
            amount:    -1,
            bookingId: candidate.id,
            ...(candidatePaymentId ? { paymentId: candidatePaymentId } : {}),
          },
        });

        return candidate.userId; // promovido — notificar fuera del tx
      }
    }

    return null;
  });

  revalidateBookingPaths(booking.classId, bookingUserId);

  // Push fuera del transaction para evitar conflictos con el connection pool
  if (promotedUserId) {
    sendPushToUser(promotedUserId, {
      title: "¡Conseguiste lugar! 🎉",
      body: "Se liberó un cupo y tu reserva fue confirmada.",
      url: "/bookings",
      tag: "waitlist-promoted",
    }).catch((err) => {
      console.error("[cancelBookingAction] push failed for promoted user", promotedUserId, err);
    });
  }

  return { success: true, data: undefined };
  } catch (e: unknown) {
    return { success: false, error: "Error al cancelar." };
  }
}

export async function removeBookingByCoachAction(
  bookingId: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado." };

  const userId = session.user.id;
  const role = (session.user as { role?: string }).role ?? "";
  const gymId = (session.user as { gymId?: string }).gymId ?? "";

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, deletedAt: null },
    select: {
      id: true, status: true, classId: true, classDate: true, userId: true,
      class: { select: { gymId: true, startTime: true, gym: { select: { cancelWindowHours: true } } } },
    },
  });
  if (!booking) return { success: false, error: "Reserva no encontrada." };
  if (booking.class.gymId !== gymId) return { success: false, error: "Gimnasio no coincide." };

  try {
    await requireClassManager(booking.classId, booking.classDate, userId, gymId, role);
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "No autorizado." };
  }

  // Un coach/admin siempre puede eliminar; el reembolso sigue la regla de ventana
  return runCancelBooking(booking, gymId);
}

export async function addStudentToClassAction(
  classId: string,
  dateStr: string,
  targetUserId: string
): Promise<ActionResult<{ status: "CONFIRMED" | "WAITLISTED"; bookingId: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado." };

  const userId = session.user.id;
  const role = (session.user as { role?: string }).role ?? "";
  const gymId = (session.user as { gymId?: string }).gymId;
  const classDate = toClassDate(new Date(dateStr));

  if (!gymId) return { success: false, error: "Sin gimnasio asignado." };

  try {
    await requireClassManager(classId, classDate, userId, gymId, role);
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "No autorizado." };
  }

  const [gymClass, targetUser, existingBooking] = await Promise.all([
    prisma.gymClass.findFirst({
      where: { id: classId, gymId, isActive: true, deletedAt: null },
      select: { id: true, maxCapacity: true, gym: { select: { waitlistEnabled: true } } },
    }),
    prisma.user.findFirst({
      where: { id: targetUserId, gymId, role: "STUDENT" },
      select: { id: true },
    }),
    prisma.booking.findFirst({
      where: { userId: targetUserId, classId, classDate, deletedAt: null },
      select: { id: true, status: true },
    }),
  ]);

  if (!gymClass) return { success: false, error: "Clase no encontrada." };
  if (!targetUser) return { success: false, error: "Alumno no encontrado." };
  if (existingBooking && existingBooking.status !== "CANCELLED") {
    return { success: false, error: "El alumno ya tiene una reserva para esta clase." };
  }

  const existingBookingId = existingBooking?.id ?? null;

  try {
    const result = await prisma.$transaction(async (tx: Tx) => {
      // Verificar créditos del alumno
      const balanceRows = await tx.$queryRaw<{ availableCredits: number }[]>`
        SELECT "availableCredits"
        FROM user_credit_balances
        WHERE "userId" = ${targetUserId} AND "gymId" = ${gymId}
        FOR UPDATE
      `;

      const balance = balanceRows[0];
      if (!balance || balance.availableCredits < 1) {
        throw Object.assign(new Error("El alumno no tiene créditos disponibles."), { code: "NO_CREDITS" });
      }

      // Verificar cupo
      const confirmedCount = await tx.booking.count({
        where: { classId, classDate, status: "CONFIRMED", deletedAt: null },
      });
      const isFull = confirmedCount >= gymClass.maxCapacity;

      if (isFull && !gymClass.gym?.waitlistEnabled) {
        throw Object.assign(
          new Error("La clase está completa y la lista de espera no está habilitada."),
          { code: "CLASS_FULL_NO_WAITLIST" }
        );
      }

      let waitlistPos: number | null = null;
      if (isFull) {
        const agg = await tx.booking.aggregate({
          where: { classId, classDate, status: "WAITLISTED", deletedAt: null },
          _max: { waitlistPos: true },
        });
        waitlistPos = (agg._max.waitlistPos ?? 0) + 1;
      }

      const status = isFull ? "WAITLISTED" : "CONFIRMED";

      // Crear o reactivar reserva
      const booking = existingBookingId
        ? await tx.booking.update({
            where: { id: existingBookingId },
            data: { status, waitlistPos, cancelledAt: null },
          })
        : await tx.booking.create({
            data: { userId: targetUserId, classId, classDate, status, waitlistPos },
          });

      // Consumir crédito solo si CONFIRMED
      if (status === "CONFIRMED") {
        await tx.$executeRaw`
          UPDATE user_credit_balances
          SET "availableCredits" = "availableCredits" - 1,
              "version"           = "version" + 1,
              "updatedAt"        = now()
          WHERE "userId" = ${targetUserId} AND "gymId" = ${gymId}
        `;

        const now = new Date();
        const activePayments = await tx.payment.findMany({
          where: {
            userId: targetUserId,
            gymId,
            status: "APPROVED",
            OR: [{ expiresAt: { gt: now } }, { expiresAt: null }],
          },
          select: {
            id: true,
            creditsGranted: true,
            creditTxs: { select: { amount: true } },
          },
          orderBy: { expiresAt: "asc" },
        });

        let targetPaymentId: string | null = null;
        for (const p of activePayments) {
          const remaining = p.creditTxs.reduce((s, t) => s + t.amount, 0);
          if (remaining > 0) {
            targetPaymentId = p.id;
            break;
          }
        }

        await tx.creditTransaction.create({
          data: {
            userId: targetUserId,
            gymId,
            type: "CONSUME",
            amount: -1,
            bookingId: booking.id,
            ...(targetPaymentId ? { paymentId: targetPaymentId } : {}),
          },
        });
      }

      return { status, bookingId: booking.id };
    });

    revalidateBookingPaths(classId, targetUserId);

    return { success: true, data: { status: result.status as "CONFIRMED" | "WAITLISTED", bookingId: result.bookingId } };
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === "NO_CREDITS") return { success: false, error: err.message! };
    if (err.code === "CLASS_FULL_NO_WAITLIST") return { success: false, error: err.message! };
    if (err.code === "P2002") return { success: false, error: "El alumno ya tiene una reserva para esta clase." };
    console.error("[addStudentToClassAction]", e);
    return { success: false, error: "Error al agregar el alumno." };
  }
}

export async function toggleBookingAttendanceAction(
  bookingId: string,
): Promise<ActionResult<{ attendedAt: Date | null }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado." };

  const userId = session.user.id;
  const role = (session.user as { role?: string }).role ?? "";
  const gymId = (session.user as { gymId?: string }).gymId ?? "";

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, deletedAt: null },
    select: {
      id: true,
      attendedAt: true,
      classId: true,
      classDate: true,
      class: { select: { gymId: true } },
    },
  });
  if (!booking) return { success: false, error: "Reserva no encontrada." };
  if (booking.class.gymId !== gymId) return { success: false, error: "Gimnasio no coincide." };

  try {
    await requireClassManager(booking.classId, booking.classDate, userId, gymId, role);
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "No autorizado." };
  }

  const newAttendedAt = booking.attendedAt ? null : new Date();

  try {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { attendedAt: newAttendedAt },
    });

    revalidateBookingPaths(booking.classId);
    return { success: true, data: { attendedAt: newAttendedAt } };
  } catch (e: unknown) {
    console.error("[toggleBookingAttendanceAction]", e);
    return { success: false, error: "Error al actualizar la asistencia." };
  }
}
