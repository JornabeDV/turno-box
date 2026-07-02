"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";
import { uploadGymLogo } from "@/lib/cloudinary";

const gymSettingsSchema = z.object({
  name:               z.string().min(1, "El nombre es requerido").max(100),
  logoUrl:            z.string().optional().or(z.literal("")),
  address:            z.string().max(200).optional().or(z.literal("")),
  phone:              z.string().max(30).optional().or(z.literal("")),
  cancelWindowHours:  z.coerce.number().refine((v) => [0.5, 1, 2].includes(v), "Valor de ventana inválido"),
  waitlistEnabled:    z.boolean(),
  mpAccessToken:      z.string().max(500).optional().or(z.literal("")),
  mpWebhookSecret:    z.string().max(500).optional().or(z.literal("")),
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

  const logoFile = formData.get("logoFile") as File | null;
  let logoUrl = formData.get("logoUrl") as string | null;

  // Si se subió un archivo de logo, subirlo a Cloudinary
  if (logoFile && logoFile.size > 0) {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(logoFile.type)) {
      return { success: false, error: "El logo debe ser una imagen (PNG, JPG, WEBP o SVG)" };
    }
    if (logoFile.size > 2 * 1024 * 1024) {
      return { success: false, error: "El logo no puede superar los 2MB" };
    }

    const gym = await prisma.gym.findUnique({
      where: { id: user.gymId },
      select: { slug: true },
    });
    if (!gym) return { success: false, error: "Gimnasio no encontrado" };

    const buffer = Buffer.from(await logoFile.arrayBuffer());
    const { secureUrl } = await uploadGymLogo(buffer, gym.slug);
    logoUrl = secureUrl;
  }

  const parsed = gymSettingsSchema.safeParse({
    name:              formData.get("name"),
    logoUrl:           logoUrl ?? "",
    address:           formData.get("address"),
    phone:             formData.get("phone"),
    cancelWindowHours: formData.get("cancelWindowHours"),
    waitlistEnabled:   formData.get("waitlistEnabled") === "true",
    mpAccessToken:     formData.get("mpAccessToken"),
    mpWebhookSecret:   formData.get("mpWebhookSecret"),
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
      mpAccessToken:     parsed.data.mpAccessToken?.trim() || null,
      mpWebhookSecret:   parsed.data.mpWebhookSecret?.trim() || null,
    },
  });

  revalidatePath("/dashboard/admin/settings");
  return { success: true, data: undefined };
}
