"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
    amount: z.coerce.number().int().min(-100).max(100).refine((n) => n !== 0, "El monto no puede ser 0"),
    note:   z.string().min(1, "La nota es requerida para ajustes manuales"),
  });

  const parsed = schema.safeParse({
    amount: formData.get("amount"),
    note:   formData.get("note"),
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const student = await prisma.user.findFirst({
    where: { id: studentId, gymId, role: "STUDENT" },
    select: { id: true },
  });
  if (!student) return { success: false, error: "Alumno no encontrado." };

  const { amount, note } = parsed.data;

  const result = await prisma.$transaction(async (tx: Tx) => {
    // UPSERT atómico del balance
    await tx.$executeRaw`
      INSERT INTO user_credit_balances (id, user_id, gym_id, available_credits, version, updated_at)
      VALUES (gen_random_uuid(), ${studentId}, ${gymId}, ${Math.max(0, amount)}, 1, now())
      ON CONFLICT (user_id, gym_id)
      DO UPDATE SET
        available_credits = GREATEST(0, user_credit_balances.available_credits + ${amount}),
        version           = user_credit_balances.version + 1,
        updated_at        = now()
    `;

    await tx.creditTransaction.create({
      data: {
        userId: studentId,
        gymId,
        type:   "ADJUSTMENT",
        amount,
        note,
      },
    });

    const bal = await tx.userCreditBalance.findUnique({
      where: { userId_gymId: { userId: studentId, gymId } },
      select: { availableCredits: true },
    });
    return bal?.availableCredits ?? 0;
  });

  revalidatePath(`/dashboard/admin/students/${studentId}`);
  return { success: true, data: { newBalance: result } };
}
