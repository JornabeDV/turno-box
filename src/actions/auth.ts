"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { ActionResult } from "@/types";

const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Debes repetir la contraseña"),
  birthDate: z.string().min(1, "La fecha de nacimiento es requerida"),
});

export async function registerAction(
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    birthDate: formData.get("birthDate"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, email, password, confirmPassword, birthDate } = parsed.data;

  if (password !== confirmPassword) {
    return { success: false, error: "Las contraseñas no coinciden" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "Ya existe una cuenta con ese email." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const defaultGym = await prisma.gym.findFirst({
    orderBy: { createdAt: "asc" },
  });

  const gymId = defaultGym?.id ?? null;

  await prisma.user.create({
    data: { name, email, passwordHash, role: "STUDENT", gymId, birthDate: new Date(birthDate) },
  });

  return { success: true, data: undefined };
}
