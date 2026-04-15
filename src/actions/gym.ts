"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";

const gymSettingsSchema = z.object({
  name:               z.string().min(1, "El nombre es requerido").max(100),
  logoUrl:            z.string().optional().or(z.literal("")),
  address:            z.string().max(200).optional().or(z.literal("")),
  phone:              z.string().max(30).optional().or(z.literal("")),
  cancelWindowHours:  z.coerce.number().refine((v) => [0.5, 1, 2].includes(v), "Valor de ventana inválido"),
  waitlistEnabled:    z.boolean(),
});

async function getAdminUser() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN" || !user.gymId) return null;
  return user as { id: string; role: string; gymId: string };
}

export async function updateGymSettingsAction(formData: FormData): Promise<ActionResult> {
  const user = await getAdminUser();
  if (!user) return { success: false, error: "No autorizado" };

  const parsed = gymSettingsSchema.safeParse({
    name:              formData.get("name"),
    logoUrl:           formData.get("logoUrl"),
    address:           formData.get("address"),
    phone:             formData.get("phone"),
    cancelWindowHours: formData.get("cancelWindowHours"),
    waitlistEnabled:   formData.get("waitlistEnabled") === "true",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await prisma.gym.update({
    where: { id: user.gymId },
    data: {
      name:              parsed.data.name,
      logoUrl:           parsed.data.logoUrl  || null,
      address:           parsed.data.address  || null,
      phone:             parsed.data.phone    || null,
      cancelWindowHours: parsed.data.cancelWindowHours,
      waitlistEnabled:   parsed.data.waitlistEnabled,
    },
  });

  revalidatePath("/dashboard/admin/settings");
  return { success: true, data: undefined };
}
