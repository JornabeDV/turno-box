"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const disciplineSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido").optional().or(z.literal("")),
  description: z.string().max(200).optional().or(z.literal("")),
});

async function getAdminUser() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN" || !user.gymId) return null;
  return user as { id: string; role: string; gymId: string };
}

export async function createDisciplineAction(formData: FormData) {
  const user = await getAdminUser();
  if (!user) throw new Error("No autorizado");

  // Verificar que el gym existe
  const gym = await prisma.gym.findUnique({ where: { id: user.gymId } });
  if (!gym) throw new Error("Gym no encontrado. Contacta al administrador.");

  const parsed = disciplineSchema.parse({
    name: formData.get("name"),
    color: formData.get("color"),
    description: formData.get("description"),
  });

  await prisma.discipline.create({
    data: {
      gymId: user.gymId,
      name: parsed.name,
      color: parsed.color || null,
      description: parsed.description || null,
    },
  });

  revalidatePath("/dashboard/admin/classes");
}

export async function updateDisciplineAction(disciplineId: string, formData: FormData) {
  const user = await getAdminUser();
  if (!user) throw new Error("No autorizado");

  // Verificar que el gym existe
  const gym = await prisma.gym.findUnique({ where: { id: user.gymId } });
  if (!gym) throw new Error("Gym no encontrado. Contacta al administrador.");

  const parsed = disciplineSchema.parse({
    name: formData.get("name"),
    color: formData.get("color"),
    description: formData.get("description"),
  });

  await prisma.discipline.updateMany({
    where: { id: disciplineId, gymId: user.gymId },
    data: {
      name: parsed.name,
      color: parsed.color || null,
      description: parsed.description || null,
    },
  });

  revalidatePath("/dashboard/admin/classes");
}

export async function deleteDisciplineAction(disciplineId: string) {
  const user = await getAdminUser();
  if (!user) throw new Error("No autorizado");

  // Verificar que el gym existe
  const gym = await prisma.gym.findUnique({ where: { id: user.gymId } });
  if (!gym) throw new Error("Gym no encontrado. Contacta al administrador.");

  // Las clases que usaban esta disciplina quedan con disciplineId = null (SetNull)
  await prisma.discipline.deleteMany({
    where: { id: disciplineId, gymId: user.gymId },
  });

  revalidatePath("/dashboard/admin/classes");
}
