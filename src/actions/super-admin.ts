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
      admin: { id: string; email: string } | null;
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
      users: {
        where: { role: "ADMIN" },
        select: { id: true, email: true },
        take: 1,
      },
    },
  });

  return {
    success: true,
    data: gyms.map((gym) => ({
      ...gym,
      admin: gym.users[0] ?? null,
    })),
  };
}

export async function getGymByIdAction(
  id: string
): Promise<
  ActionResult<{
    id: string;
    name: string;
    slug: string;
    address: string | null;
    phone: string | null;
  }>
> {
  await requireSuperAdmin();

  const gym = await prisma.gym.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, address: true, phone: true },
  });

  if (!gym) {
    return { success: false, error: "Gimnasio no encontrado" };
  }

  return { success: true, data: gym };
}

const updateGymSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  slug: z
    .string()
    .min(1, "El slug es requerido")
    .max(50)
    .regex(slugRegex, "El slug solo puede contener letras minúsculas, números y guiones"),
  address: z.string().max(200).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  adminEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  adminPassword: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .optional()
    .or(z.literal("")),
  confirmAdminPassword: z.string().optional().or(z.literal("")),
});

export async function updateGymAction(
  id: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  await requireSuperAdmin();

  const raw = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    adminEmail: formData.get("adminEmail"),
    adminPassword: formData.get("adminPassword"),
    confirmAdminPassword: formData.get("confirmAdminPassword"),
  };

  const parsed = updateGymSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, slug, address, phone, adminEmail, adminPassword, confirmAdminPassword } =
    parsed.data;
  const normalizedSlug = slug.toLowerCase().trim();

  // Verificar que el gym existe
  const existingGym = await prisma.gym.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existingGym) {
    return { success: false, error: "Gimnasio no encontrado" };
  }

  // Verificar que el slug no esté en uso por OTRO gimnasio
  const slugConflict = await prisma.gym.findUnique({
    where: { slug: normalizedSlug },
    select: { id: true },
  });
  if (slugConflict && slugConflict.id !== id) {
    return { success: false, error: "Ya existe un gimnasio con ese slug. Elegí otro." };
  }

  const wantsAdminUpdate = adminEmail || adminPassword;

  if (wantsAdminUpdate && adminPassword !== confirmAdminPassword) {
    return { success: false, error: "Las contraseñas del admin no coinciden" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.gym.update({
        where: { id },
        data: {
          name,
          slug: normalizedSlug,
          address: address || null,
          phone: phone || null,
        },
      });

      if (!wantsAdminUpdate) return;

      const normalizedEmail = adminEmail ? adminEmail.toLowerCase().trim() : undefined;
      const existingAdmins = await tx.user.findMany({
        where: { gymId: id, role: "ADMIN" },
        select: { id: true, email: true },
      });

      if (existingAdmins.length > 1) {
        throw new Error(
          "El gimnasio tiene más de un admin. Unificá los admins antes de continuar."
        );
      }

      const existingAdmin = existingAdmins[0] ?? null;

      if (normalizedEmail) {
        const emailConflict = await tx.user.findFirst({
          where: {
            email: normalizedEmail,
            NOT: existingAdmin ? { id: existingAdmin.id } : undefined,
          },
          select: { id: true },
        });
        if (emailConflict) {
          throw new Error("Ya existe un usuario con ese email.");
        }
      }

      if (existingAdmin) {
        const data: { email?: string; passwordHash?: string } = {};
        if (normalizedEmail && normalizedEmail !== existingAdmin.email) {
          data.email = normalizedEmail;
        }
        if (adminPassword) {
          data.passwordHash = await bcrypt.hash(adminPassword, 12);
        }
        if (Object.keys(data).length > 0) {
          await tx.user.update({
            where: { id: existingAdmin.id },
            data,
          });
        }
      } else {
        if (!normalizedEmail || !adminPassword) {
          throw new Error("Para crear un admin debés proporcionar email y contraseña.");
        }
        await tx.user.create({
          data: {
            email: normalizedEmail,
            passwordHash: await bcrypt.hash(adminPassword, 12),
            role: "ADMIN",
            gymId: id,
            isActive: true,
          },
        });
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al actualizar el gimnasio";
    return { success: false, error: message };
  }

  return { success: true, data: { id } };
}

export async function deleteGymAction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  await requireSuperAdmin();

  const gym = await prisma.gym.findUnique({
    where: { id },
    include: {
      _count: {
        select: { users: true, classes: true, payments: true },
      },
    },
  });

  if (!gym) {
    return { success: false, error: "Gimnasio no encontrado" };
  }

  if (gym._count.users > 0) {
    return {
      success: false,
      error: `No se puede eliminar el gimnasio porque tiene ${gym._count.users} usuario(s) asociados.`,
    };
  }

  if (gym._count.payments > 0) {
    return {
      success: false,
      error: `No se puede eliminar el gimnasio porque tiene pagos registrados.`,
    };
  }

  await prisma.gym.delete({ where: { id } });

  return { success: true, data: { id } };
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
