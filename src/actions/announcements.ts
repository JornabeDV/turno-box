"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushToGym } from "@/lib/push";
import { uploadAnnouncementImage } from "@/lib/cloudinary";
import type { ActionResult } from "@/types";

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN" || !user.gymId)
    throw new Error("No autorizado.");
  return { adminId: user.id, gymId: user.gymId };
}

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

async function processImage(
  formData: FormData,
  gymId: string,
  announcementId: string,
  existingImageUrl?: string | null
): Promise<string | null | undefined> {
  const imageFile = formData.get("imageFile") as File | null;
  const removeImage = formData.get("removeImage") === "true";

  // Si se marca para eliminar, retornar null para borrar la URL
  if (removeImage) return null;

  // Si no hay archivo nuevo, mantener la existente (undefined = no tocar el campo)
  if (!imageFile || imageFile.size === 0) return existingImageUrl ?? undefined;

  if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
    throw new Error("La imagen debe ser PNG, JPG o WEBP.");
  }
  if (imageFile.size > MAX_IMAGE_SIZE) {
    throw new Error("La imagen no puede superar los 5MB.");
  }

  const buffer = Buffer.from(await imageFile.arrayBuffer());
  const { secureUrl } = await uploadAnnouncementImage(buffer, gymId, announcementId);
  return secureUrl;
}

export async function createAnnouncementAction(
  formData: FormData
): Promise<ActionResult> {
  const { gymId } = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const pinned = formData.get("pinned") === "true";
  const publishAt = formData.get("publishAt")
    ? new Date(`${String(formData.get("publishAt"))}T12:00:00Z`)
    : new Date();
  const expiresAt = formData.get("expiresAt")
    ? new Date(`${String(formData.get("expiresAt"))}T12:00:00Z`)
    : null;

  if (!title || !body) return { success: false, error: "Título y contenido son obligatorios." };

  // Creamos primero la noticia para obtener el ID
  const announcement = await prisma.announcement.create({
    data: { gymId, title, body, pinned, publishAt, expiresAt },
  });

  // Procesamos la imagen ahora que tenemos el ID
  try {
    const imageUrl = await processImage(formData, gymId, announcement.id, undefined);
    if (imageUrl !== undefined) {
      await prisma.announcement.update({
        where: { id: announcement.id },
        data: { imageUrl: imageUrl ?? null },
      });
    }
  } catch (err) {
    // Si falla la imagen, la noticia igual se creó. No es crítico.
    console.error("Error al subir imagen de noticia:", err);
  }

  revalidatePath("/");
  revalidatePath("/dashboard/admin/news");

  // Solo notificar si el aviso se publica ahora (no programado para el futuro)
  if (publishAt <= new Date()) {
    sendPushToGym(gymId, {
      title: pinned ? `📌 ${title}` : title,
      body: body.length > 100 ? body.slice(0, 97) + "..." : body,
      url: "/",
      tag: "announcement",
    }).catch(() => {});
  }

  return { success: true, data: undefined };
}

export async function updateAnnouncementAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const { gymId } = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const pinned = formData.get("pinned") === "true";
  const publishAt = formData.get("publishAt")
    ? new Date(`${String(formData.get("publishAt"))}T12:00:00Z`)
    : new Date();
  const expiresAt = formData.get("expiresAt")
    ? new Date(`${String(formData.get("expiresAt"))}T12:00:00Z`)
    : null;

  if (!title || !body) return { success: false, error: "Título y contenido son obligatorios." };

  const existing = await prisma.announcement.findFirst({
    where: { id, gymId },
    select: { imageUrl: true },
  });

  if (!existing) return { success: false, error: "Noticia no encontrada." };

  let imageUrl: string | null | undefined = undefined;
  try {
    imageUrl = await processImage(formData, gymId, id, existing.imageUrl);
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Error al procesar imagen." };
  }

  const data: Record<string, unknown> = { title, body, pinned, publishAt, expiresAt };
  if (imageUrl !== undefined) data.imageUrl = imageUrl;

  await prisma.announcement.updateMany({
    where: { id, gymId },
    data,
  });

  revalidatePath("/");
  revalidatePath("/dashboard/admin/news");
  return { success: true, data: undefined };
}

export async function deleteAnnouncementAction(
  id: string
): Promise<ActionResult> {
  const { gymId } = await requireAdmin();

  await prisma.announcement.deleteMany({ where: { id, gymId } });

  revalidatePath("/");
  revalidatePath("/dashboard/admin/news");
  return { success: true, data: undefined };
}
