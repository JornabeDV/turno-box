"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWelcomeInvitationEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import { z } from "zod";
import * as xlsx from "xlsx";
import crypto from "crypto";
import type { ActionResult } from "@/types";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as
    | { id?: string; role?: string; gymId?: string }
    | undefined;
  if (!user?.id || user.role !== "ADMIN" || !user.gymId)
    throw new Error("Unauthorized");
  return { userId: user.id, gymId: user.gymId };
}

export async function resendInvitationAction(
  studentId: string
): Promise<ActionResult> {
  const { gymId } = await requireAdmin();

  const student = await prisma.user.findFirst({
    where: { id: studentId, gymId, role: "STUDENT" },
    select: { id: true, email: true, name: true, gym: { select: { name: true } } },
  });

  if (!student) return { success: false, error: "Alumno no encontrado." };

  // Invalidate previous unused tokens
  await prisma.passwordResetToken.updateMany({
    where: { userId: student.id, used: false },
    data: { used: true },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: student.id, token, expiresAt },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_URL}/reset-password/${token}`;
  await sendWelcomeInvitationEmail(
    student.email,
    resetUrl,
    student.gym?.name || "tu gimnasio",
    student.name || undefined
  );

  await prisma.user.update({
    where: { id: student.id },
    data: { invitedAt: new Date() },
  });

  revalidatePath(`/dashboard/admin/students/${studentId}`);
  return { success: true, data: undefined };
}

const MAX_ROWS = 500;

export type ImportPreviewRow = {
  rowIndex: number;
  nombre: string;
  email: string;
  telefono?: string;
  fechaNacimiento?: string;
  creditosIniciales?: number;
  valid: boolean;
  errors: string[];
};

export type ImportResult = {
  created: number;
  updated: number;
  invited: number;
  failed: number;
  errors: { rowIndex: number; email: string; reason: string }[];
};

function normalizeEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) return null;
  return trimmed;
}

function normalizeName(name: unknown): string | null {
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  return trimmed.length >= 1 ? trimmed : null;
}

function parseDate(value: unknown): Date | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return undefined;
    return value;
  }
  if (typeof value === "number") {
    // Excel serial date
    const epoch = new Date(1899, 11, 30);
    const date = new Date(epoch.getTime() + value * 86400000);
    if (isNaN(date.getTime())) return undefined;
    return date;
  }
  if (typeof value === "string") {
    // Try DD/MM/YYYY first
    const parts = value.split(/[\/\-\.]/);
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const date = new Date(y, m, d);
      if (!isNaN(date.getTime()) && date.getDate() === d && date.getMonth() === m) {
        return date;
      }
    }
    // Fallback to ISO/standard parsing
    const date = new Date(value);
    if (!isNaN(date.getTime())) return date;
  }
  return undefined;
}

function parseCredits(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const num = typeof value === "number" ? value : parseInt(String(value), 10);
  if (isNaN(num) || num < 0 || num > 999) return undefined;
  return Math.floor(num);
}

export async function previewImportAction(
  formData: FormData
): Promise<ActionResult<ImportPreviewRow[]>> {
  const { gymId } = await requireAdmin();

  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "No se envió ningún archivo." };

  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
  ];
  if (!allowedTypes.includes(file.type) && !file.name.endsWith(".xlsx") && !file.name.endsWith(".csv")) {
    return { success: false, error: "Formato no válido. Usá .xlsx o .csv" };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = xlsx.read(arrayBuffer, { type: "array", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    });

    if (rawRows.length > MAX_ROWS) {
      return { success: false, error: `Máximo ${MAX_ROWS} filas permitidas.` };
    }

    const preview: ImportPreviewRow[] = [];
    const seenEmails = new Set<string>();

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowIndex = i + 2; // Excel row number (1-based + header)

      // Try common header variations
      const nombre =
        normalizeName(
          row["nombre"] ?? row["Nombre"] ?? row["NOMBRE"] ?? row["name"] ?? row["Name"]
        ) || "";
      const emailRaw =
        row["email"] ?? row["Email"] ?? row["EMAIL"] ?? row["correo"] ?? row["Correo"];
      const email = normalizeEmail(emailRaw) || "";
      const telefono =
        String(row["telefono"] ?? row["Telefono"] ?? row["TELEFONO"] ?? row["phone"] ?? row["Phone"] ?? "").trim() || undefined;
      const fechaNacimiento = parseDate(
        row["fecha_nacimiento"] ?? row["Fecha Nacimiento"] ?? row["fecha nacimiento"] ?? row["nacimiento"] ?? row["birthDate"]
      );
      const creditosIniciales = parseCredits(
        row["creditos_iniciales"] ?? row["Créditos Iniciales"] ?? row["creditos"] ?? row["Creditos"] ?? row["credits"]
      );

      const errors: string[] = [];
      if (!nombre) errors.push("Falta el nombre.");
      if (!email) errors.push("Email inválido o vacío.");
      else if (seenEmails.has(email)) errors.push("Email duplicado dentro del archivo.");

      if (email) seenEmails.add(email);

      preview.push({
        rowIndex,
        nombre,
        email,
        telefono,
        fechaNacimiento: fechaNacimiento?.toISOString().split("T")[0],
        creditosIniciales,
        valid: errors.length === 0,
        errors,
      });
    }

    return { success: true, data: preview };
  } catch {
    return { success: false, error: "Error al leer el archivo. Verificá el formato." };
  }
}

const BATCH_SIZE = 50;

type ImportCandidate = {
  rowIndex: number;
  nombre: string;
  email: string;
  telefono: string | null;
  birthDate: Date | undefined;
  credits: number | undefined;
};

export async function importStudentsAction(
  formData: FormData
): Promise<ActionResult<ImportResult>> {
  const { userId: adminUserId, gymId } = await requireAdmin();

  const gym = await prisma.gym.findUnique({
    where: { id: gymId },
    select: { name: true },
  });
  if (!gym) return { success: false, error: "Gimnasio no encontrado." };

  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "No se envió ningún archivo." };

  const arrayBuffer = await file.arrayBuffer();
  const workbook = xlsx.read(arrayBuffer, { type: "array", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  if (rawRows.length > MAX_ROWS) {
    return { success: false, error: `Máximo ${MAX_ROWS} filas permitidas.` };
  }

  const result: ImportResult = {
    created: 0,
    updated: 0,
    invited: 0,
    failed: 0,
    errors: [],
  };

  const seenEmails = new Set<string>();
  const candidates: ImportCandidate[] = [];

  // 1. Parsear y validar todas las filas una sola vez
  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const rowIndex = i + 2;

    const nombre =
      normalizeName(
        row["nombre"] ?? row["Nombre"] ?? row["NOMBRE"] ?? row["name"] ?? row["Name"]
      ) || "";
    const emailRaw =
      row["email"] ?? row["Email"] ?? row["EMAIL"] ?? row["correo"] ?? row["Correo"];
    const email = normalizeEmail(emailRaw);
    const telefono =
      String(row["telefono"] ?? row["Telefono"] ?? row["TELEFONO"] ?? row["phone"] ?? row["Phone"] ?? "").trim() || null;
    const birthDate = parseDate(
      row["fecha_nacimiento"] ?? row["Fecha Nacimiento"] ?? row["fecha nacimiento"] ?? row["nacimiento"] ?? row["birthDate"]
    );
    const credits = parseCredits(
      row["creditos_iniciales"] ?? row["Créditos Iniciales"] ?? row["creditos"] ?? row["Creditos"] ?? row["credits"]
    );

    if (!email || !nombre) {
      result.failed++;
      result.errors.push({
        rowIndex,
        email: email || "(vacío)",
        reason: !nombre ? "Nombre vacío" : "Email inválido",
      });
      continue;
    }

    if (seenEmails.has(email)) {
      result.failed++;
      result.errors.push({
        rowIndex,
        email,
        reason: "Email duplicado dentro del archivo",
      });
      continue;
    }
    seenEmails.add(email);

    candidates.push({ rowIndex, nombre, email, telefono, birthDate, credits });
  }

  if (candidates.length === 0) {
    revalidatePath("/dashboard/admin/students");
    return { success: true, data: result };
  }

  // 2. Precargar usuarios existentes en una sola query
  const existingUsers = await prisma.user.findMany({
    where: { email: { in: candidates.map((c) => c.email) } },
    select: { id: true, email: true, gymId: true, role: true },
  });
  const existingByEmail = new Map(existingUsers.map((u) => [u.email, u]));

  const expiresAt = new Date(Date.now() + 30 * 86_400_000);
  const now = new Date();

  // 3. Procesar en lotes para reducir transacciones
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);
    const batchCreates: Array<ImportCandidate & { userId: string; passwordHash: string }> = [];
    const batchUpdates: Array<ImportCandidate & { userId: string }> = [];

    // Preparar hash de contraseñas fuera de la transacción (bcrypt es CPU-bound)
    for (const candidate of batch) {
      const existing = existingByEmail.get(candidate.email);
      if (existing && existing.gymId && existing.gymId !== gymId) {
        result.failed++;
        result.errors.push({
          rowIndex: candidate.rowIndex,
          email: candidate.email,
          reason: "Email ya registrado en otro gimnasio",
        });
        continue;
      }

      const randomPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = await bcrypt.hash(randomPassword, 12);

      if (existing) {
        batchUpdates.push({ ...candidate, userId: existing.id });
        result.updated++;
      } else {
        batchCreates.push({ ...candidate, userId: crypto.randomUUID(), passwordHash });
        result.created++;
      }
    }

    if (batchCreates.length === 0 && batchUpdates.length === 0) continue;

    // 4. Una sola transacción por lote
    await prisma.$transaction(async (tx: Tx) => {
      if (batchCreates.length > 0) {
        await tx.user.createMany({
          data: batchCreates.map((c) => ({
            id: c.userId,
            name: c.nombre,
            email: c.email,
            passwordHash: c.passwordHash,
            role: "STUDENT" as const,
            gymId,
            phone: c.telefono,
            birthDate: c.birthDate || undefined,
          })),
        });
      }

      for (const c of batchUpdates) {
        await tx.user.update({
          where: { id: c.userId },
          data: {
            name: c.nombre,
            gymId,
            phone: c.telefono,
            birthDate: c.birthDate || undefined,
            role: existingByEmail.get(c.email)?.role === "STUDENT" ? undefined : "STUDENT",
          },
        });
      }

      // Procesar créditos iniciales en batch
      const withCredits = [...batchCreates, ...batchUpdates].filter((c) => c.credits && c.credits > 0);
      if (withCredits.length > 0) {
        const balances = await tx.userCreditBalance.findMany({
          where: {
            userId: { in: withCredits.map((c) => c.userId) },
            gymId,
          },
          select: { userId: true, availableCredits: true },
        });
        const balanceByUser = new Map(balances.map((b) => [b.userId, b.availableCredits]));

        await tx.userCreditBalance.createMany({
          data: withCredits
            .filter((c) => !balanceByUser.has(c.userId))
            .map((c) => ({
              userId: c.userId,
              gymId,
              availableCredits: c.credits!,
              version: 1,
            })),
          skipDuplicates: true,
        });

        for (const c of withCredits) {
          if (balanceByUser.has(c.userId)) {
            await tx.userCreditBalance.update({
              where: { userId_gymId: { userId: c.userId, gymId } },
              data: {
                availableCredits: { increment: c.credits! },
                version: { increment: 1 },
              },
            });
          }
        }

        const paymentData = withCredits.map((c) => ({
          id: crypto.randomUUID(),
          gymId,
          userId: c.userId,
          packId: null,
          creditsGranted: c.credits!,
          amountPaid: 0,
          currency: "ARS" as const,
          provider: "MANUAL" as const,
          status: "APPROVED" as const,
          paidAt: now,
          expiresAt,
        }));
        await tx.payment.createMany({ data: paymentData });

        await tx.creditTransaction.createMany({
          data: paymentData.map((p) => ({
            userId: p.userId,
            gymId,
            type: "ADJUSTMENT" as const,
            amount: p.creditsGranted,
            note: "Créditos iniciales — migración",
            paymentId: p.id,
          })),
        });

        await tx.gymTransaction.createMany({
          data: paymentData.map((p) => ({
            gymId,
            type: "INCOME" as const,
            category: "Migración",
            amount: 0,
            description: `Migración inicial — ${p.creditsGranted} crédito${p.creditsGranted !== 1 ? "s" : ""}`,
            method: "EFECTIVO" as const,
            userId: p.userId,
            paymentId: p.id,
            registeredBy: adminUserId,
            date: now,
          })),
        });
      }
    });

    // 5. Tokens y emails fuera de la transacción (no bloquean la base de datos)
    for (const c of [...batchCreates, ...batchUpdates]) {
      try {
        const token = crypto.randomBytes(32).toString("hex");
        const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await prisma.passwordResetToken.create({
          data: { userId: c.userId, token, expiresAt: tokenExpiresAt },
        });

        const resetUrl = `${process.env.NEXT_PUBLIC_URL}/reset-password/${token}`;
        await sendWelcomeInvitationEmail(c.email, resetUrl, gym.name, c.nombre);

        await prisma.user.update({
          where: { id: c.userId },
          data: { invitedAt: new Date() },
        });

        result.invited++;
      } catch (err) {
        console.error(`[IMPORT] Error enviando invitación para ${c.email}:`, err);
        result.failed++;
        result.errors.push({
          rowIndex: c.rowIndex,
          email: c.email,
          reason: "Error al enviar invitación",
        });
      }
    }
  }

  revalidatePath("/dashboard/admin/students");
  return { success: true, data: result };
}
