"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MercadoPagoConfig, Preference } from "mercadopago";
import type { ActionResult } from "@/types";

async function requireStudent() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || !user.gymId) throw new Error("No autenticado.");
  return { userId: user.id, gymId: user.gymId };
}

// ── Iniciar checkout ──────────────────────────────────────────────────────────
export async function createCheckoutAction(
  packId: string
): Promise<ActionResult<{ checkoutUrl: string }>> {
  const { userId, gymId } = await requireStudent();

  const pack = await prisma.pack.findFirst({
    where: { id: packId, gymId, isActive: true },
  });
  if (!pack) return { success: false, error: "Abono no encontrado." };

  const expiresAt = pack.validityDays
    ? new Date(Date.now() + pack.validityDays * 86_400_000)
    : null;

  // Crear payment PENDING — su id es la external_reference en MP
  const payment = await prisma.payment.create({
    data: {
      gymId,
      userId,
      packId: pack.id,
      creditsGranted: pack.credits,
      amountPaid: pack.price,
      currency: pack.currency,
      provider: "MERCADOPAGO",
      expiresAt,
    },
  });

  const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
  });

  const preference = new Preference(mpClient);
  const result = await preference.create({
    body: {
      external_reference: payment.id,
      items: [
        {
          id:         pack.id,
          title:      pack.name,
          quantity:   1,
          unit_price: Number(pack.price),
          currency_id: pack.currency,
        },
      ],
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_URL}/packs/success?payment=${payment.id}`,
        failure: `${process.env.NEXT_PUBLIC_URL}/packs?error=rejected`,
        pending: `${process.env.NEXT_PUBLIC_URL}/packs?info=pending`,
      },
      // auto_return requiere HTTPS público — solo aplica en producción
      ...(process.env.NEXT_PUBLIC_URL?.startsWith("https") ? { auto_return: "approved" as const } : {}),
      notification_url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/mercadopago`,
    },
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { providerOrderId: result.id },
  });

  return { success: true, data: { checkoutUrl: result.init_point! } };
}

// ── Crear pack (admin) ────────────────────────────────────────────────────────
export async function createPackAction(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN" || !user.gymId)
    return { success: false, error: "No autorizado." };

  const name    = String(formData.get("name") ?? "").trim();
  const credits = Number(formData.get("credits"));
  const price   = Number(formData.get("price"));
  const validityDays = formData.get("validityDays") ? Number(formData.get("validityDays")) : null;

  if (!name || credits < 1 || price < 0)
    return { success: false, error: "Datos inválidos." };

  await prisma.pack.create({
    data: { gymId: user.gymId, name, credits, price, validityDays },
  });

  revalidatePath("/dashboard/admin/packs");
  return { success: true, data: undefined };
}

// ── Activar / desactivar pack (admin) ────────────────────────────────────────
export async function togglePackActiveAction(packId: string): Promise<ActionResult<{ isActive: boolean }>> {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN" || !user.gymId) {
    return { success: false, error: "No autorizado." };
  }

  const pack = await prisma.pack.findFirst({
    where: { id: packId, gymId: user.gymId },
    select: { isActive: true },
  });
  if (!pack) return { success: false, error: "Abono no encontrado." };

  const updated = await prisma.pack.update({
    where: { id: packId },
    data: { isActive: !pack.isActive },
    select: { isActive: true },
  });

  revalidatePath("/dashboard/admin/packs");
  return { success: true, data: { isActive: updated.isActive } };
}

// ── Editar pack (admin) ───────────────────────────────────────────────────────
export async function updatePackAction(packId: string, formData: FormData): Promise<ActionResult> {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN" || !user.gymId)
    return { success: false, error: "No autorizado." };

  const name        = String(formData.get("name") ?? "").trim();
  const credits     = Number(formData.get("credits"));
  const price       = Number(formData.get("price"));
  const validityDays = formData.get("validityDays") ? Number(formData.get("validityDays")) : null;
  const sortOrder   = formData.get("sortOrder") ? Number(formData.get("sortOrder")) : undefined;

  if (!name || credits < 1 || price < 0)
    return { success: false, error: "Datos inválidos." };

  await prisma.pack.updateMany({
    where: { id: packId, gymId: user.gymId },
    data: { name, credits, price, validityDays, ...(sortOrder !== undefined && { sortOrder }) },
  });

  revalidatePath("/dashboard/admin/packs");
  return { success: true, data: undefined };
}

// ── Eliminar pack (admin) ─────────────────────────────────────────────────────
export async function deletePackAction(packId: string): Promise<ActionResult> {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN" || !user.gymId)
    return { success: false, error: "No autorizado." };

  await prisma.pack.deleteMany({ where: { id: packId, gymId: user.gymId } });

  revalidatePath("/dashboard/admin/packs");
  return { success: true, data: undefined };
}

// ── Créditos disponibles del usuario ─────────────────────────────────────────
export async function getUserCreditsAction(): Promise<number> {
  const session = await auth();
  const user = session?.user as { id?: string; gymId?: string } | undefined;
  if (!user?.id || !user.gymId) return 0;

  const balance = await prisma.userCreditBalance.findUnique({
    where: { userId_gymId: { userId: user.id, gymId: user.gymId } },
    select: { availableCredits: true },
  });

  return balance?.availableCredits ?? 0;
}
