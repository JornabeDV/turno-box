"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { sendWelcomeInvitationEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";
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
  const { userId, gymId } = await requireAdmin();

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
  const { userId, gymId } = await requireAdmin();

  const schema = z.object({
    amount:       z.coerce.number().int().min(-100).max(100).refine((n) => n !== 0, "El monto no puede ser 0"),
    note:         z.string().min(1, "La nota es requerida para ajustes manuales"),
    amountPaid:   z.coerce.number().min(0).max(999999).default(0),
    method:       z.string().optional(),
    validityDays: z.coerce.number().int().min(1).max(365).default(30),
  });

  const parsed = schema.safeParse({
    amount:       formData.get("amount"),
    note:         formData.get("note"),
    amountPaid:   formData.get("amountPaid"),
    method:       formData.get("method"),
    validityDays: formData.get("validityDays"),
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const student = await prisma.user.findFirst({
    where: { id: studentId, gymId, role: "STUDENT" },
    select: { id: true },
  });
  if (!student) return { success: false, error: "Alumno no encontrado." };

  const { amount, note, amountPaid, validityDays } = parsed.data;

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
    const expiresAt = new Date(Date.now() + validityDays * 86_400_000);
    const payment = await tx.payment.create({
      data: {
        gymId,
        userId: studentId,
        packId: null,
        creditsGranted: amount,
        amountPaid,
        currency: "ARS",
        provider: "MANUAL",
        method: parsed.data.method || null,
        status: "APPROVED",
        paidAt: new Date(),
        expiresAt,
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

    if (amountPaid > 0) {
      await tx.gymTransaction.create({
        data: {
          gymId,
          type: "INCOME",
          category: "Venta manual",
          amount: amountPaid,
          description: note,
          method: parsed.data.method || "EFECTIVO",
          userId: studentId,
          paymentId: payment.id,
          registeredBy: userId,
          date: new Date(),
        },
      });
    }

    return newBalance;
  });

  revalidatePath(`/dashboard/admin/students/${studentId}`);

  // Notificar al alumno del ajuste (fire-and-forget)
  const sign = amount > 0 ? "+" : "";
  sendPushToUser(studentId, {
    title: "El gym ajustó tu saldo",
    body: `${sign}${amount} crédito${Math.abs(amount) !== 1 ? "s" : ""}. Saldo actual: ${result}.`,
    url: "/credits",
    tag: "credit-adjustment",
  }).catch(() => {});

  return { success: true, data: { newBalance: result } };
}

// ── Crear alumno individual (admin) ────────────────────────────────────────────

const createStudentSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio.").max(120),
  email: z.string().email("Email inválido.").min(1).max(120),
  phone: z.string().max(30).optional().transform((v) => (v ? v.trim() : undefined)),
  birthDate: z.string().optional().transform((v) => {
    if (!v) return undefined;
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
  }),
  initialCredits: z.coerce.number().int().min(0).max(999).optional().default(0),
});

export async function createStudentAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const { userId: adminUserId, gymId } = await requireAdmin();

  const gym = await prisma.gym.findUnique({
    where: { id: gymId },
    select: { name: true },
  });
  if (!gym) return { success: false, error: "Gimnasio no encontrado." };

  const parsed = createStudentSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    birthDate: formData.get("birthDate") || undefined,
    initialCredits: formData.get("initialCredits") || 0,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Datos inválidos." };
  }

  const { name, email, phone, birthDate, initialCredits } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, gymId: true, role: true },
  });

  if (existing) {
    if (existing.gymId && existing.gymId !== gymId) {
      return { success: false, error: "Este email ya está registrado en otro gimnasio." };
    }
    return { success: false, error: "Este email ya está registrado en tu gimnasio." };
  }

  const randomPassword = crypto.randomBytes(32).toString("hex");
  const passwordHash = await bcrypt.hash(randomPassword, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      role: "STUDENT",
      gymId,
      phone: phone || null,
      birthDate: birthDate || undefined,
    },
  });

  // Créditos iniciales
  if (initialCredits > 0) {
    await prisma.$transaction(async (tx: Tx) => {
      await tx.userCreditBalance.upsert({
        where: { userId_gymId: { userId: user.id, gymId } },
        create: { userId: user.id, gymId, availableCredits: initialCredits, version: 1 },
        update: { availableCredits: { increment: initialCredits }, version: { increment: 1 } },
      });

      const payment = await tx.payment.create({
        data: {
          gymId,
          userId: user.id,
          packId: null,
          creditsGranted: initialCredits,
          amountPaid: 0,
          currency: "ARS",
          provider: "MANUAL",
          status: "APPROVED",
          paidAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 86_400_000),
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId: user.id,
          gymId,
          type: "ADJUSTMENT",
          amount: initialCredits,
          note: "Créditos iniciales — alta manual",
          paymentId: payment.id,
        },
      });

      await tx.gymTransaction.create({
        data: {
          gymId,
          type: "INCOME",
          category: "Alta manual",
          amount: 0,
          description: `Alta manual — ${initialCredits} crédito${initialCredits !== 1 ? "s" : ""}`,
          method: "EFECTIVO",
          userId: user.id,
          paymentId: payment.id,
          registeredBy: adminUserId,
          date: new Date(),
        },
      });
    });
  }

  // Generar token de invitación (7 días)
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  // Enviar email de bienvenida
  const resetUrl = `${process.env.NEXT_PUBLIC_URL}/reset-password/${token}`;
  await sendWelcomeInvitationEmail(normalizedEmail, resetUrl, gym.name, name);

  // Marcar invitedAt
  await prisma.user.update({
    where: { id: user.id },
    data: { invitedAt: new Date() },
  });

  revalidatePath("/dashboard/admin/students");
  return { success: true, data: { id: user.id } };
}
