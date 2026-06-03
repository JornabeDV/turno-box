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

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];

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

    const rowIndex = i + 2;

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

    try {
      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true, gymId: true, role: true },
      });

      if (existing && existing.gymId && existing.gymId !== gymId) {
        result.failed++;
        result.errors.push({
          rowIndex,
          email,
          reason: "Email ya registrado en otro gimnasio",
        });
        continue;
      }

      let userId: string;
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = await bcrypt.hash(randomPassword, 12);

      if (existing) {
        // Update existing user (same gym or orphan)
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: nombre,
            gymId,
            phone: telefono,
            birthDate: birthDate || undefined,
            role: existing.role === "STUDENT" ? undefined : "STUDENT",
          },
        });
        userId = existing.id;
        result.updated++;
      } else {
        const created = await prisma.user.create({
          data: {
            name: nombre,
            email,
            passwordHash,
            role: "STUDENT",
            gymId,
            phone: telefono,
            birthDate: birthDate || undefined,
          },
        });
        userId = created.id;
        result.created++;
      }

      // Initial credits
      if (credits && credits > 0) {
        await prisma.$transaction(async (tx: Tx) => {
          const current = await tx.userCreditBalance.findUnique({
            where: { userId_gymId: { userId, gymId } },
            select: { availableCredits: true, version: true },
          });

          const newBalance = (current?.availableCredits ?? 0) + credits;

          await tx.userCreditBalance.upsert({
            where: { userId_gymId: { userId, gymId } },
            create: { userId, gymId, availableCredits: newBalance, version: 1 },
            update: { availableCredits: newBalance, version: { increment: 1 } },
          });

          const payment = await tx.payment.create({
            data: {
              gymId,
              userId,
              packId: null,
              creditsGranted: credits,
              amountPaid: 0,
              currency: "ARS",
              provider: "MANUAL",
              status: "APPROVED",
              paidAt: new Date(),
              expiresAt: new Date(Date.now() + 30 * 86_400_000),
            },
          });

          await tx.creditTransaction.create({
            data: {
              userId,
              gymId,
              type: "ADJUSTMENT",
              amount: credits,
              note: "Créditos iniciales — migración",
              paymentId: payment.id,
            },
          });

          await tx.gymTransaction.create({
            data: {
              gymId,
              type: "INCOME",
              category: "Migración",
              amount: 0,
              description: `Migración inicial — ${credits} crédito${credits !== 1 ? "s" : ""}`,
              method: "EFECTIVO",
              userId,
              paymentId: payment.id,
              registeredBy: adminUserId,
              date: new Date(),
            },
          });
        });
      }

      // Generate invitation token (7 days)
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.passwordResetToken.create({
        data: { userId, token, expiresAt },
      });

      // Send invitation email
      const resetUrl = `${process.env.NEXT_PUBLIC_URL}/reset-password/${token}`;
      await sendWelcomeInvitationEmail(email, resetUrl, gym.name, nombre);

      // Mark invitedAt
      await prisma.user.update({
        where: { id: userId },
        data: { invitedAt: new Date() },
      });

      result.invited++;
    } catch (err) {
      console.error(`[IMPORT] Error en fila ${rowIndex}:`, err);
      result.failed++;
      result.errors.push({
        rowIndex,
        email,
        reason: "Error interno al procesar la fila",
      });
    }
  }

  revalidatePath("/dashboard/admin/students");
  return { success: true, data: result };
}
