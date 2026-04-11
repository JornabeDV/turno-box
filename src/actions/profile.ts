"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { ActionResult } from "@/types";

// ── Actualizar nombre y fecha de nacimiento ───────────────────────────────────
export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado." };

  const name      = String(formData.get("name") ?? "").trim();
  const birthRaw  = formData.get("birthDate");
  const birthDate = birthRaw ? new Date(String(birthRaw)) : null;

  if (!name) return { success: false, error: "El nombre es obligatorio." };
  if (birthDate && isNaN(birthDate.getTime())) return { success: false, error: "Fecha inválida." };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name, birthDate },
  });

  revalidatePath("/profile");
  return { success: true, data: undefined };
}

// ── Cambiar contraseña ────────────────────────────────────────────────────────
export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado." };

  const current  = String(formData.get("current")  ?? "");
  const next     = String(formData.get("next")      ?? "");
  const confirm  = String(formData.get("confirm")   ?? "");

  if (!current || !next || !confirm) return { success: false, error: "Completá todos los campos." };
  if (next.length < 6)               return { success: false, error: "La nueva contraseña debe tener al menos 6 caracteres." };
  if (next !== confirm)              return { success: false, error: "Las contraseñas no coinciden." };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) return { success: false, error: "Esta cuenta no usa contraseña." };

  const valid = await bcrypt.compare(current, user.passwordHash);
  if (!valid) return { success: false, error: "La contraseña actual es incorrecta." };

  const hash = await bcrypt.hash(next, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: hash },
  });

  return { success: true, data: undefined };
}
