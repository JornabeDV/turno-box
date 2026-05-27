"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { ActionResult } from "@/types";

async function requireSuperAdmin() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "SUPER_ADMIN") {
    throw new Error("No autorizado");
  }
  return user as { id: string; role: string };
}

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const createGymSchema = z.object({
  gymName: z.string().min(1, "El nombre del gimnasio es requerido").max(100),
  slug: z
    .string()
    .min(1, "El slug es requerido")
    .max(50)
    .regex(slugRegex, "El slug solo puede contener letras minúsculas, números y guiones"),
  address: z.string().max(200).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  adminName: z.string().min(1, "El nombre del admin es requerido").max(100),
  adminEmail: z.string().email("Email inválido"),
  adminPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Debes confirmar la contraseña"),
});

export async function createGymWithAdminAction(
  formData: FormData
): Promise<ActionResult<{ gymId: string; slug: string }>> {
  await requireSuperAdmin();

  const raw = {
    gymName: formData.get("gymName"),
    slug: formData.get("slug"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    adminName: formData.get("adminName"),
    adminEmail: formData.get("adminEmail"),
    adminPassword: formData.get("adminPassword"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = createGymSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const {
    gymName,
    slug,
    address,
    phone,
    adminName,
    adminEmail,
    adminPassword,
    confirmPassword,
  } = parsed.data;

  if (adminPassword !== confirmPassword) {
    return { success: false, error: "Las contraseñas no coinciden" };
  }

  const normalizedSlug = slug.toLowerCase().trim();
  const normalizedEmail = adminEmail.toLowerCase().trim();

  // Verificar slug único
  const existingSlug = await prisma.gym.findUnique({
    where: { slug: normalizedSlug },
    select: { id: true },
  });
  if (existingSlug) {
    return { success: false, error: "Ya existe un gimnasio con ese slug. Elegí otro." };
  }

  // Verificar email único
  const existingEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existingEmail) {
    return { success: false, error: "Ya existe un usuario con ese email." };
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const result = await prisma.$transaction(async (tx) => {
    const gym = await tx.gym.create({
      data: {
        name: gymName,
        slug: normalizedSlug,
        address: address || null,
        phone: phone || null,
      },
    });

    const admin = await tx.user.create({
      data: {
        name: adminName,
        email: normalizedEmail,
        passwordHash,
        role: "ADMIN",
        gymId: gym.id,
        isActive: true,
      },
    });

    return { gym, admin };
  });

  return {
    success: true,
    data: { gymId: result.gym.id, slug: result.gym.slug },
  };
}

export async function getGymsListAction(): Promise<
  ActionResult<
    Array<{
      id: string;
      name: string;
      slug: string;
      address: string | null;
      phone: string | null;
      createdAt: Date;
      _count: { users: number };
    }>
  >
> {
  await requireSuperAdmin();

  const gyms = await prisma.gym.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { users: true },
      },
    },
  });

  return { success: true, data: gyms };
}

export async function getSuperAdminStatsAction(): Promise<
  ActionResult<{
    totalGyms: number;
    totalUsers: number;
    totalAdmins: number;
    totalCoaches: number;
    totalStudents: number;
  }>
> {
  await requireSuperAdmin();

  const [totalGyms, totalUsers, totalAdmins, totalCoaches, totalStudents] =
    await Promise.all([
      prisma.gym.count(),
      prisma.user.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { role: "COACH" } }),
      prisma.user.count({ where: { role: "STUDENT" } }),
    ]);

  return {
    success: true,
    data: {
      totalGyms,
      totalUsers,
      totalAdmins,
      totalCoaches,
      totalStudents,
    },
  };
}
