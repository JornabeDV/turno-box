"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { ActionResult } from "@/types";

const genderValues = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"] as const;

const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Debes repetir la contraseña"),
  birthDate: z.string().min(1, "La fecha de nacimiento es requerida"),
  gender: z.enum(genderValues, { message: "Seleccioná una opción de género" }),
  gymId: z.string().optional(),
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
    gender: formData.get("gender"),
    gymId: formData.get("gymId"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, email, password, confirmPassword, birthDate, gender, gymId: formGymId } = parsed.data;

  if (password !== confirmPassword) {
    return { success: false, error: "Las contraseñas no coinciden" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "No se pudo completar el registro. Si ya tenés una cuenta, intentá iniciar sesión." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  let gymId = formGymId ?? null;

  if (gymId) {
    const gymExists = await prisma.gym.findUnique({ where: { id: gymId } });
    if (!gymExists) {
      return { success: false, error: "El gimnasio no existe." };
    }
  }

  await prisma.user.create({
    data: { name, email, passwordHash, role: "STUDENT", gymId, birthDate: new Date(birthDate), gender },
  });

  return { success: true, data: undefined };
}

const emailSchema = z.string().email("Email inválido");

export async function lookupGymForEmailAction(
  formData: FormData
): Promise<
  ActionResult<{
    gym: {
      id: string;
      name: string;
      logoUrl: string | null;
      slug: string;
    } | null;
    hasAccount: boolean;
  }>
> {
  const rawEmail = formData.get("email");
  const parsed = emailSchema.safeParse(rawEmail);
  if (!parsed.success) {
    return { success: false, error: "Email inválido" };
  }

  const email = parsed.data.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      role: true,
      gymId: true,
    },
  });

  if (!user) {
    return { success: true, data: { gym: null, hasAccount: false } };
  }

  if (!user.gymId) {
    return { success: true, data: { gym: null, hasAccount: true } };
  }

  const gym = await prisma.gym.findUnique({
    where: { id: user.gymId },
    select: { id: true, name: true, logoUrl: true, slug: true },
  });

  return { success: true, data: { gym, hasAccount: true } };
}
