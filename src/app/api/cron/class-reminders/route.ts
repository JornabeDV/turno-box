import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

const REMINDER_WINDOW_MINUTES = 120; // avisar 2 horas antes
const TOLERANCE_MINUTES = 30;        // margen para el delay del cron

/**
 * Convierte una hora local (HH:MM) en una fecha concreta dentro de un timezone
 * a su equivalente UTC. Necesario porque classDate es medianoche UTC y
 * startTime está en el timezone del gym (ej: America/Argentina/Buenos_Aires = UTC-3).
 */
function localTimeToUTC(dateStr: string, timeStr: string, timezone: string): Date {
  // Punto de partida: la fecha+hora tratada como si fuera UTC
  const naive = new Date(`${dateStr}T${timeStr}:00.000Z`);

  // ¿A qué hora local corresponde ese momento UTC en el timezone del gym?
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const localStr = formatter.format(naive).replace("24:", "00:");
  const [lh, lm] = localStr.split(":").map(Number);
  const [th, tm] = timeStr.split(":").map(Number);

  // Diferencia entre la hora deseada y la hora local resultante → offset real
  const diffMs = ((th * 60 + tm) - (lh * 60 + lm)) * 60_000;
  return new Date(naive.getTime() + diffMs);
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const now = new Date();
  const windowMinFrom = REMINDER_WINDOW_MINUTES - TOLERANCE_MINUTES; // 90 min
  const windowMinTo   = REMINDER_WINDOW_MINUTES + TOLERANCE_MINUTES; // 150 min

  // Rango de fechas amplio para la query (hoy y mañana)
  const todayStr    = now.toISOString().split("T")[0];
  const tomorrowStr = new Date(now.getTime() + 86_400_000).toISOString().split("T")[0];

  const bookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      deletedAt: null,
      classDate: {
        gte: new Date(`${todayStr}T00:00:00.000Z`),
        lte: new Date(`${tomorrowStr}T23:59:59.999Z`),
      },
    },
    select: {
      userId: true,
      classDate: true,
      class: {
        select: {
          startTime: true,
          discipline: { select: { name: true } },
          gym: { select: { timezone: true } },
        },
      },
    },
  });

  let sent = 0;
  const skipped: string[] = [];

  for (const booking of bookings) {
    const dateStr    = booking.classDate.toISOString().split("T")[0];
    const timezone   = booking.class.gym?.timezone ?? "America/Argentina/Buenos_Aires";
    const classStart = localTimeToUTC(dateStr, booking.class.startTime, timezone);

    const minutesUntil = (classStart.getTime() - now.getTime()) / 60_000;

    if (minutesUntil < windowMinFrom || minutesUntil > windowMinTo) {
      skipped.push(`${booking.class.startTime} (${Math.round(minutesUntil)}min away)`);
      continue;
    }

    const label = booking.class.discipline?.name ?? "Clase";

    sendPushToUser(booking.userId, {
      title: `Recordatorio: ${label} en 2 horas ⏰`,
      body: `Tu clase de ${label} empieza a las ${booking.class.startTime}hs. ¡Preparate!`,
      url: "/bookings",
      tag: "class-reminder",
    }).catch(() => {});

    sent++;
  }

  return NextResponse.json({ ok: true, sent, total_bookings: bookings.length, skipped });
}
