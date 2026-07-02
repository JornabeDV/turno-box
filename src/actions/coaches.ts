"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { ActionResult } from "@/types";

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN" || !user.gymId) throw new Error("Unauthorized");
  return { userId: user.id, gymId: user.gymId };
}

const createCoachSchema = z
  .object({
    name: z.string().min(1, "El nombre es requerido").max(100),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Debes confirmar la contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export async function createCoachAction(formData: FormData): Promise<ActionResult> {
  const { gymId } = await requireAdmin();

  const parsed = createCoachSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { success: false, error: "Ya existe un usuario con ese email." };

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { name, email, passwordHash, role: "COACH", gymId, isActive: true },
  });

  revalidatePath("/dashboard/admin/coaches");
  return { success: true, data: undefined };
}

export async function deleteCoachAction(coachId: string): Promise<ActionResult> {
  const { gymId } = await requireAdmin();

  const coach = await prisma.user.findFirst({
    where: { id: coachId, gymId, role: { in: ["COACH", "ADMIN"] } },
    select: { role: true },
  });

  if (!coach) return { success: false, error: "Profesor no encontrado." };
  if (coach.role === "ADMIN") {
    return { success: false, error: "No se puede eliminar un administrador desde el panel de profesores." };
  }

  await prisma.user.deleteMany({ where: { id: coachId, gymId, role: "COACH" } });

  revalidatePath("/dashboard/admin/coaches");
  return { success: true, data: undefined };
}

const updateCoachSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional().or(z.literal("")),
});

export async function updateCoachAction(coachId: string, formData: FormData): Promise<ActionResult> {
  const { gymId } = await requireAdmin();

  const parsed = updateCoachSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, email, password } = parsed.data;

  const coach = await prisma.user.findFirst({
    where: { id: coachId, gymId, role: { in: ["COACH", "ADMIN"] } },
    select: { id: true, email: true },
  });

  if (!coach) return { success: false, error: "Profesor no encontrado." };

  if (email !== coach.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { success: false, error: "Ya existe un usuario con ese email." };
  }

  const data: { name: string; email: string; passwordHash?: string } = { name, email };
  if (password) {
    data.passwordHash = await bcrypt.hash(password, 12);
  }

  await prisma.user.update({
    where: { id: coachId },
    data,
  });

  revalidatePath("/dashboard/admin/coaches");
  revalidatePath(`/dashboard/admin/coaches/${coachId}`);
  return { success: true, data: undefined };
}

export async function toggleCoachActiveAction(
  coachId: string
): Promise<ActionResult<{ isActive: boolean }>> {
  const { gymId } = await requireAdmin();

  const coach = await prisma.user.findFirst({
    where: { id: coachId, gymId, role: { in: ["COACH", "ADMIN"] } },
    select: { isActive: true },
  });

  if (!coach) return { success: false, error: "Profesor no encontrado." };

  const updated = await prisma.user.update({
    where: { id: coachId },
    data: { isActive: !coach.isActive },
    select: { isActive: true },
  });

  revalidatePath("/dashboard/admin/coaches");
  return { success: true, data: { isActive: updated.isActive } };
}
