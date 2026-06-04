import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

/**
 * Envía notificaciones push sobre abonos por vencer o vencidos.
 * Se ejecuta una vez al día (recomendado a las 9:00 AM).
 *
 * Tres rangos:
 *   - 3 días: expiresAt entre [hoy+3d, hoy+4d)
 *   - 1 día:  expiresAt entre [hoy+1d, hoy+2d)
 *   - Vencido: expiresAt entre [hoy-1d, hoy)  → venció en las últimas 24h
 */

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const today = startOfDay(new Date());

  const d3 = addDays(today, 3);
  const d4 = addDays(today, 4);
  const d1 = addDays(today, 1);
  const d2 = addDays(today, 2);
  const dMinus1 = addDays(today, -1);

  const [payments3d, payments1d, paymentsExpired] = await Promise.all([
    // Vencen en ~3 días
    prisma.payment.findMany({
      where: {
        status: "APPROVED",
        expiresAt: { gte: d3, lt: d4 },
      },
      select: { userId: true, expiresAt: true },
    }),
    // Vencen en ~1 día
    prisma.payment.findMany({
      where: {
        status: "APPROVED",
        expiresAt: { gte: d1, lt: d2 },
      },
      select: { userId: true, expiresAt: true },
    }),
    // Vencieron en las últimas 24h
    prisma.payment.findMany({
      where: {
        status: "APPROVED",
        expiresAt: { gte: dMinus1, lt: today },
      },
      select: { userId: true, expiresAt: true },
    }),
  ]);

  // Agrupar por usuario para no spamear
  const userIds3d = new Set(payments3d.map((p) => p.userId));
  const userIds1d = new Set(payments1d.map((p) => p.userId));
  const userIdsExpired = new Set(paymentsExpired.map((p) => p.userId));

  let sent3d = 0;
  let sent1d = 0;
  let sentExpired = 0;

  const dateStr = today.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });

  for (const userId of userIds3d) {
    sendPushToUser(userId, {
      title: "⏳ Tus créditos vencen en 3 días",
      body: `Tenés abonos que vencen el ${dateStr}. Asegurate de usarlos antes de que pierdas las clases.`,
      url: "/credits",
      tag: "credit-expiry-3d",
    }).catch(() => {});
    sent3d++;
  }

  for (const userId of userIds1d) {
    sendPushToUser(userId, {
      title: "⚠️ Tus créditos vencen mañana",
      body: `Mañana vencen algunos de tus abonos. Reservá tu clase ahora.`,
      url: "/credits",
      tag: "credit-expiry-1d",
    }).catch(() => {});
    sent1d++;
  }

  for (const userId of userIdsExpired) {
    sendPushToUser(userId, {
      title: "❌ Tus créditos vencieron",
      body: `Algunos de tus abonos ya vencieron. Comprá uno nuevo para seguir entrenando.`,
      url: "/packs",
      tag: "credit-expired",
    }).catch(() => {});
    sentExpired++;
  }

  return NextResponse.json({
    ok: true,
    "3d": { users: sent3d, payments: payments3d.length },
    "1d": { users: sent1d, payments: payments1d.length },
    expired: { users: sentExpired, payments: paymentsExpired.length },
  });
}
