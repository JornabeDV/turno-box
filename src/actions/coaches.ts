"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN" || !user.gymId) throw new Error("Unauthorized");
  return { userId: user.id, gymId: user.gymId };
}

export async function toggleCoachActiveAction(
  coachId: string
): Promise<ActionResult<{ isActive: boolean }>> {
  const { gymId } = await requireAdmin();

  const coach = await prisma.user.findFirst({
    where: { id: coachId, gymId, role: "COACH" },
    select: { isActive: true },
  });

  if (!coach) return { success: false, error: "Coach no encontrado." };

  const updated = await prisma.user.update({
    where: { id: coachId },
    data: { isActive: !coach.isActive },
    select: { isActive: true },
  });

  revalidatePath("/dashboard/admin/coaches");
  return { success: true, data: { isActive: updated.isActive } };
}
