import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

/**
 * Envía notificaciones push a estudiantes que cumplen años hoy.
 * Se ejecuta una vez al día (recomendado a las 9:30 AM).
 */

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const birthdays = await prisma.$queryRaw<
    { id: string; name: string | null }[]
  >`
    SELECT id, name
    FROM users
    WHERE role = 'STUDENT'
      AND "isActive" = true
      AND "birthDate" IS NOT NULL
      AND EXTRACT(MONTH FROM "birthDate") = ${month}
      AND EXTRACT(DAY FROM "birthDate") = ${day}
  `;

  const results: { sent: boolean }[] = [];

  for (const student of birthdays) {
    const firstName = student.name?.split(" ")[0] ?? "Campeón";

    const pushResult = await sendPushToUser(student.id, {
      title: `🎉 ¡Feliz cumpleaños, ${firstName}!`,
      body: "El equipo te desea un gran día. Vení a entrenar y festejá con nosotros.",
      url: "/",
      tag: `birthday-${today.getFullYear()}`,
    });

    results.push({ sent: !!pushResult });
  }

  return NextResponse.json({
    ok: true,
    total: birthdays.length,
    sent: results.filter((r) => r.sent).length,
  });
}
