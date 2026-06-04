import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

/**
 * Envía notificaciones push sobre abonos por vencer o vencidos.
 * Se ejecuta una vez al día (recomendado a las 9:00 AM).
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
    prisma.payment.findMany({
      where: { status: "APPROVED", expiresAt: { gte: d3, lt: d4 } },
      select: { userId: true, expiresAt: true },
    }),
    prisma.payment.findMany({
      where: { status: "APPROVED", expiresAt: { gte: d1, lt: d2 } },
      select: { userId: true, expiresAt: true },
    }),
    prisma.payment.findMany({
      where: { status: "APPROVED", expiresAt: { gte: dMinus1, lt: today } },
      select: { userId: true, expiresAt: true },
    }),
  ]);

  const userIds3d = new Set(payments3d.map((p) => p.userId));
  const userIds1d = new Set(payments1d.map((p) => p.userId));
  const userIdsExpired = new Set(paymentsExpired.map((p) => p.userId));

  const results3d: unknown[] = [];
  const results1d: unknown[] = [];
  const resultsExpired: unknown[] = [];

  for (const userId of userIds3d) {
    const r = await sendPushToUser(userId, {
      title: "⏳ Tus créditos vencen en 3 días",
      body: "Tenés abonos que vencen pronto. Asegurate de usarlos antes de que pierdas las clases.",
      url: "/credits",
      tag: "credit-expiry-3d",
    });
    results3d.push({ userId, ...r });
  }

  for (const userId of userIds1d) {
    const r = await sendPushToUser(userId, {
      title: "⚠️ Tus créditos vencen mañana",
      body: "Mañana vencen algunos de tus abonos. Reservá tu clase ahora.",
      url: "/credits",
      tag: "credit-expiry-1d",
    });
    results1d.push({ userId, ...r });
  }

  for (const userId of userIdsExpired) {
    const r = await sendPushToUser(userId, {
      title: "❌ Tus créditos vencieron",
      body: "Algunos de tus abonos ya vencieron. Comprá uno nuevo para seguir entrenando.",
      url: "/packs",
      tag: "credit-expired",
    });
    resultsExpired.push({ userId, ...r });
  }

  return NextResponse.json({
    ok: true,
    "3d": { users: userIds3d.size, payments: payments3d.length, results: results3d },
    "1d": { users: userIds1d.size, payments: payments1d.length, results: results1d },
    expired: { users: userIdsExpired.size, payments: paymentsExpired.length, results: resultsExpired },
  });
}
