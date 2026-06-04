"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN" || !user.gymId) throw new Error("Unauthorized");
  return { userId: user.id, gymId: user.gymId };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildPaymentSnapshots(payments: { id: string; expiresAt: Date | null }[]) {
  const snapshots: Record<string, { originalExpiresAt: string | null }> = {};
  for (const p of payments) {
    snapshots[p.id] = { originalExpiresAt: p.expiresAt ? p.expiresAt.toISOString() : null };
  }
  return snapshots;
}

// ── Pausar créditos de un alumno ─────────────────────────────────────────────
export async function pauseStudentCreditsAction(
  studentId: string,
  reason: string
): Promise<ActionResult> {
  const { userId: adminId, gymId } = await requireAdmin();

  if (!reason.trim()) return { success: false, error: "El motivo es obligatorio." };

  const student = await prisma.user.findFirst({
    where: { id: studentId, gymId, role: "STUDENT" },
    select: { id: true },
  });
  if (!student) return { success: false, error: "Alumno no encontrado." };

  // Verificar que no haya ya una pausa activa para este alumno
  const existing = await prisma.creditFreeze.findFirst({
    where: { gymId, userId: studentId, endedAt: null },
  });
  if (existing) return { success: false, error: "Este alumno ya tiene una pausa activa." };

  const now = new Date();

  // Payments activos con fecha de vencimiento definida
  const activePayments = await prisma.payment.findMany({
    where: {
      userId: studentId,
      gymId,
      status: "APPROVED",
      expiresAt: { not: null },
    },
    select: { id: true, expiresAt: true },
  });

  await prisma.$transaction(async (tx: Tx) => {
    // Crear registro de pausa
    await tx.creditFreeze.create({
      data: {
        gymId,
        userId: studentId,
        startedAt: now,
        endedAt: null,
        reason: reason.trim(),
        createdBy: adminId,
        paymentSnapshots: buildPaymentSnapshots(activePayments),
      },
    });

    // Congelar: setear expiresAt = null (se restaura al reanudar)
    for (const p of activePayments) {
      await tx.payment.update({
        where: { id: p.id },
        data: { expiresAt: null },
      });
    }
  });

  revalidatePath(`/dashboard/admin/students/${studentId}`);
  revalidatePath(`/dashboard/admin/students/${studentId}/history/credits`);
  return { success: true, data: undefined };
}

// ── Reanudar créditos de un alumno ───────────────────────────────────────────
export async function resumeStudentCreditsAction(
  studentId: string
): Promise<ActionResult> {
  const { gymId } = await requireAdmin();

  const freeze = await prisma.creditFreeze.findFirst({
    where: { gymId, userId: studentId, endedAt: null },
  });
  if (!freeze) return { success: false, error: "No hay una pausa activa para este alumno." };

  const endedAt = new Date();
  const pauseDurationMs = endedAt.getTime() - freeze.startedAt.getTime();

  const snapshots = freeze.paymentSnapshots as Record<string, { originalExpiresAt: string | null }>;

  await prisma.$transaction(async (tx: Tx) => {
    await tx.creditFreeze.update({
      where: { id: freeze.id },
      data: { endedAt },
    });

    for (const [paymentId, snapshot] of Object.entries(snapshots)) {
      if (!snapshot.originalExpiresAt) continue;
      const originalExpiresAt = new Date(snapshot.originalExpiresAt);
      const newExpiresAt = new Date(originalExpiresAt.getTime() + pauseDurationMs);

      await tx.payment.update({
        where: { id: paymentId },
        data: { expiresAt: newExpiresAt },
      });
    }
  });

  revalidatePath(`/dashboard/admin/students/${studentId}`);
  revalidatePath(`/dashboard/admin/students/${studentId}/history/credits`);
  return { success: true, data: undefined };
}

// ── Pausar TODOS los créditos del gym ────────────────────────────────────────
export async function pauseAllCreditsAction(
  reason: string
): Promise<ActionResult<{ affectedCount: number }>> {
  const { userId: adminId, gymId } = await requireAdmin();

  if (!reason.trim()) return { success: false, error: "El motivo es obligatorio." };

  // Verificar que no haya ya una pausa masiva activa
  const existing = await prisma.creditFreeze.findFirst({
    where: { gymId, userId: null, endedAt: null },
  });
  if (existing) return { success: false, error: "El gym ya tiene una pausa masiva activa." };

  const now = new Date();

  const activePayments = await prisma.payment.findMany({
    where: {
      gymId,
      status: "APPROVED",
      expiresAt: { not: null },
    },
    select: { id: true, expiresAt: true },
  });

  await prisma.$transaction(async (tx: Tx) => {
    await tx.creditFreeze.create({
      data: {
        gymId,
        userId: null,
        startedAt: now,
        endedAt: null,
        reason: reason.trim(),
        createdBy: adminId,
        paymentSnapshots: buildPaymentSnapshots(activePayments),
      },
    });

    for (const p of activePayments) {
      await tx.payment.update({
        where: { id: p.id },
        data: { expiresAt: null },
      });
    }
  });

  revalidatePath("/dashboard/admin/students");
  revalidatePath("/dashboard/admin/payments");
  revalidatePath("/dashboard/admin");
  return { success: true, data: { affectedCount: activePayments.length } };
}

// ── Reanudar TODOS los créditos del gym ──────────────────────────────────────
export async function resumeAllCreditsAction(): Promise<ActionResult<{ affectedCount: number }>> {
  const { gymId } = await requireAdmin();

  const freeze = await prisma.creditFreeze.findFirst({
    where: { gymId, userId: null, endedAt: null },
  });
  if (!freeze) return { success: false, error: "No hay una pausa masiva activa." };

  const endedAt = new Date();
  const pauseDurationMs = endedAt.getTime() - freeze.startedAt.getTime();

  const snapshots = freeze.paymentSnapshots as Record<string, { originalExpiresAt: string | null }>;

  let restoredCount = 0;

  await prisma.$transaction(async (tx: Tx) => {
    await tx.creditFreeze.update({
      where: { id: freeze.id },
      data: { endedAt },
    });

    for (const [paymentId, snapshot] of Object.entries(snapshots)) {
      if (!snapshot.originalExpiresAt) continue;
      const originalExpiresAt = new Date(snapshot.originalExpiresAt);
      const newExpiresAt = new Date(originalExpiresAt.getTime() + pauseDurationMs);

      await tx.payment.update({
        where: { id: paymentId },
        data: { expiresAt: newExpiresAt },
      });
      restoredCount++;
    }
  });

  revalidatePath("/dashboard/admin/students");
  revalidatePath("/dashboard/admin/payments");
  revalidatePath("/dashboard/admin");
  return { success: true, data: { affectedCount: restoredCount } };
}

// ── Obtener estado de pausa de un alumno ─────────────────────────────────────
export async function getStudentFreezeStatus(studentId: string): Promise<{
  isPaused: boolean;
  freeze?: { startedAt: Date; reason: string } | null;
}> {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.gymId) return { isPaused: false };

  const freeze = await prisma.creditFreeze.findFirst({
    where: { gymId: user.gymId, userId: studentId, endedAt: null },
    select: { startedAt: true, reason: true },
  });

  return { isPaused: !!freeze, freeze };
}

// ── Obtener estado de pausa masiva del gym ───────────────────────────────────
export async function getGlobalFreezeStatus(gymId: string): Promise<{
  isPaused: boolean;
  freeze?: { startedAt: Date; reason: string } | null;
}> {
  const freeze = await prisma.creditFreeze.findFirst({
    where: { gymId, userId: null, endedAt: null },
    select: { startedAt: true, reason: true },
  });

  return { isPaused: !!freeze, freeze };
}
