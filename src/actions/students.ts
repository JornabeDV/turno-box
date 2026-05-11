"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { z } from "zod";
import type { ActionResult } from "@/types";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN" || !user.gymId) throw new Error("Unauthorized");
  return { userId: user.id, gymId: user.gymId };
}

export async function toggleStudentActiveAction(
  studentId: string
): Promise<ActionResult<{ isActive: boolean }>> {
  const { gymId } = await requireAdmin();

  const student = await prisma.user.findFirst({
    where: { id: studentId, gymId, role: "STUDENT" },
    select: { isActive: true },
  });

  if (!student) return { success: false, error: "Alumno no encontrado." };

  const updated = await prisma.user.update({
    where: { id: studentId },
    data: { isActive: !student.isActive },
    select: { isActive: true },
  });

  revalidatePath("/dashboard/admin/students");
  return { success: true, data: { isActive: updated.isActive } };
}

// ── Ajuste manual de créditos (admin) ────────────────────────────────────────
export async function adjustCreditsAction(
  studentId: string,
  formData: FormData
): Promise<ActionResult<{ newBalance: number }>> {
  const { gymId } = await requireAdmin();

  const schema = z.object({
    amount:     z.coerce.number().int().min(-100).max(100).refine((n) => n !== 0, "El monto no puede ser 0"),
    note:       z.string().min(1, "La nota es requerida para ajustes manuales"),
    amountPaid: z.coerce.number().min(0).max(999999).default(0),
  });

  const parsed = schema.safeParse({
    amount:     formData.get("amount"),
    note:       formData.get("note"),
    amountPaid: formData.get("amountPaid"),
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const student = await prisma.user.findFirst({
    where: { id: studentId, gymId, role: "STUDENT" },
    select: { id: true },
  });
  if (!student) return { success: false, error: "Alumno no encontrado." };

  const { amount, note, amountPaid } = parsed.data;

  const result = await prisma.$transaction(async (tx: Tx) => {
    // Leer balance actual para calcular el nuevo valor
    const current = await tx.userCreditBalance.findUnique({
      where: { userId_gymId: { userId: studentId, gymId } },
      select: { availableCredits: true, version: true },
    });

    const newBalance = Math.max(0, (current?.availableCredits ?? 0) + amount);

    await tx.userCreditBalance.upsert({
      where: { userId_gymId: { userId: studentId, gymId } },
      create: { userId: studentId, gymId, availableCredits: newBalance, version: 1 },
      update: { availableCredits: newBalance, version: { increment: 1 } },
    });

    // Registrar el pago asociado (incluso si es $0, para trazabilidad completa)
    const payment = await tx.payment.create({
      data: {
        gymId,
        userId: studentId,
        packId: null,
        creditsGranted: amount,
        amountPaid,
        currency: "ARS",
        provider: "MANUAL",
        status: "APPROVED",
        paidAt: new Date(),
      },
    });

    await tx.creditTransaction.create({
      data: {
        userId: studentId,
        gymId,
        type:      "ADJUSTMENT",
        amount,
        note,
        paymentId: payment.id,
      },
    });

    return newBalance;
  });

  revalidatePath(`/dashboard/admin/students/${studentId}`);

  // Notificar al alumno del ajuste (fire-and-forget)
  const sign = amount > 0 ? "+" : "";
  sendPushToUser(studentId, {
    title: "El gym ajustó tu saldo",
    body: `${sign}${amount} crédito${Math.abs(amount) !== 1 ? "s" : ""}. Saldo actual: ${result}.`,
    url: "/packs",
    tag: "credit-adjustment",
  }).catch(() => {});

  return { success: true, data: { newBalance: result } };
}
