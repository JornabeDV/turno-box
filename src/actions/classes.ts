"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { ActionResult } from "@/types";

const classSchema = z.object({
  description: z.string().optional(),
  dayOfWeek: z.enum(["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM requerido"),
  endTime:   z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM requerido"),
  maxCapacity: z.coerce.number().int().min(1).max(100),
  color: z.string().optional(),
  coachId: z.string().optional(),
  disciplineId: z.string().min(1, "La disciplina es requerida"),
});

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN" || !user.gymId) {
    throw new Error("No autorizado");
  }
  return { userId: user.id, gymId: user.gymId };
}

export async function createClassAction(formData: FormData) {
  const { gymId } = await requireAdmin();

  // Verificar que el gym existe
  const gym = await prisma.gym.findUnique({ where: { id: gymId } });
  if (!gym) throw new Error("Gym no encontrado. Contacta al administrador.");

  const raw = {
    description: formData.get("description"),
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    maxCapacity: formData.get("maxCapacity"),
    color: formData.get("color"),
    coachId: formData.get("coachId") || undefined,
    disciplineId: formData.get("disciplineId"),
  };

  const parsed = classSchema.parse(raw);

  await prisma.gymClass.create({
    data: { ...parsed, gymId },
  });

  revalidatePath("/dashboard/admin/classes");
}

export async function updateClassAction(classId: string, formData: FormData) {
  const { gymId } = await requireAdmin();

  // Verificar que el gym existe
  const gym = await prisma.gym.findUnique({ where: { id: gymId } });
  if (!gym) throw new Error("Gym no encontrado. Contacta al administrador.");

  const existing = await prisma.gymClass.findFirst({
    where: { id: classId, gymId, deletedAt: null },
  });
  if (!existing) throw new Error("Clase no encontrada.");

  const raw = {
    description: formData.get("description"),
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    maxCapacity: formData.get("maxCapacity"),
    color: formData.get("color"),
    coachId: formData.get("coachId") || undefined,
    disciplineId: formData.get("disciplineId"),
  };

  const parsed = classSchema.parse(raw);

  await prisma.gymClass.update({
    where: { id: classId },
    data: parsed,
  });

  revalidatePath("/dashboard/admin/classes");
}

export async function duplicateDayAction(
  sourceDay: string,
  targetDays: string[]
): Promise<ActionResult<{ created: number; skipped: number }>> {
  const { gymId } = await requireAdmin();

  // Verificar que el gym existe
  const gym = await prisma.gym.findUnique({ where: { id: gymId } });
  if (!gym) return { success: false, error: "Gym no encontrado. Contacta al administrador." };

  const dayEnum = z.enum(["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"]);

  const parsedSource = dayEnum.safeParse(sourceDay);
  if (!parsedSource.success) return { success: false, error: "Día origen inválido." };

  const parsedTargets = z.array(dayEnum).min(1).safeParse(targetDays);
  if (!parsedTargets.success) return { success: false, error: "Seleccioná al menos un día destino." };

  const sourceClasses = await prisma.gymClass.findMany({
    where: { gymId, dayOfWeek: parsedSource.data, isActive: true, deletedAt: null },
    select: { description: true, startTime: true, endTime: true, maxCapacity: true, color: true, coachId: true, disciplineId: true },
  });

  if (sourceClasses.length === 0) return { success: false, error: "El día origen no tiene clases." };

  let created = 0;
  let skipped = 0;

  for (const targetDay of parsedTargets.data) {
    const existing = await prisma.gymClass.findMany({
      where: { gymId, dayOfWeek: targetDay, deletedAt: null },
      select: { disciplineId: true, startTime: true },
    });
    const existingKeys = new Set(existing.map((c: { disciplineId: string; startTime: string }) => `${c.disciplineId}|${c.startTime}`));

    for (const cls of sourceClasses) {
      if (existingKeys.has(`${cls.disciplineId}|${cls.startTime}`)) {
        skipped++;
        continue;
      }
      await prisma.gymClass.create({ data: { ...cls, dayOfWeek: targetDay, gymId } });
      created++;
    }
  }

  revalidatePath("/dashboard/admin/classes");
  return { success: true, data: { created, skipped } };
}

// Soft delete — preserva historial de bookings
export async function deleteClassAction(classId: string): Promise<void> {
  const { gymId } = await requireAdmin();

  // Verificar que el gym existe
  const gym = await prisma.gym.findUnique({ where: { id: gymId } });
  if (!gym) throw new Error("Gym no encontrado. Contacta al administrador.");

  await prisma.gymClass.update({
    where: { id: classId },
    data: { deletedAt: new Date(), isActive: false },
  });

  revalidatePath("/dashboard/admin/classes");
}
