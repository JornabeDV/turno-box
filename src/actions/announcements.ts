"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN" || !user.gymId)
    throw new Error("No autorizado.");
  return { adminId: user.id, gymId: user.gymId };
}

export async function createAnnouncementAction(
  formData: FormData
): Promise<ActionResult> {
  const { gymId } = await requireAdmin();

  const title     = String(formData.get("title") ?? "").trim();
  const body      = String(formData.get("body") ?? "").trim();
  const pinned    = formData.get("pinned") === "true";
  const publishAt = formData.get("publishAt")
    ? new Date(String(formData.get("publishAt")))
    : new Date();
  const expiresAt = formData.get("expiresAt")
    ? new Date(String(formData.get("expiresAt")))
    : null;

  if (!title || !body) return { success: false, error: "Título y contenido son obligatorios." };

  await prisma.announcement.create({
    data: { gymId, title, body, pinned, publishAt, expiresAt },
  });

  revalidatePath("/");
  revalidatePath("/dashboard/admin/news");
  return { success: true, data: undefined };
}

export async function updateAnnouncementAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const { gymId } = await requireAdmin();

  const title     = String(formData.get("title") ?? "").trim();
  const body      = String(formData.get("body") ?? "").trim();
  const pinned    = formData.get("pinned") === "true";
  const publishAt = formData.get("publishAt")
    ? new Date(String(formData.get("publishAt")))
    : new Date();
  const expiresAt = formData.get("expiresAt")
    ? new Date(String(formData.get("expiresAt")))
    : null;

  if (!title || !body) return { success: false, error: "Título y contenido son obligatorios." };

  await prisma.announcement.updateMany({
    where: { id, gymId },
    data: { title, body, pinned, publishAt, expiresAt },
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
