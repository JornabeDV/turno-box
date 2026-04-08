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

export async function toggleStudentActiveAction(
  studentId: string
): Promise<ActionResult<{ isActive: boolean }>> {
  const { gymId } = await requireAdmin();

  const student = await prisma.user.findFirst({
    where: { id: studentId, gymId, role: "STUDENT" },
    select: { isActive: true },
  });

  if (!student) return { success: false, error: "Alumno no encontrado." };

  const updated = await prisma.user.update({
    where: { id: studentId },
    data: { isActive: !student.isActive },
    select: { isActive: true },
  });

  revalidatePath("/dashboard/admin/students");
  return { success: true, data: { isActive: updated.isActive } };
}
