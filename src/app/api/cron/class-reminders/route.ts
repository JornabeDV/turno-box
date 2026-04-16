import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

// Endpoint llamado por GitHub Actions cada hora.
// Busca reservas confirmadas para clases que empiezan en ~2 horas y notifica.

const REMINDER_WINDOW_MINUTES = 120; // avisar 2 horas antes
const TOLERANCE_MINUTES = 30;        // margen para no enviar duplicados si el cron se retrasa

export async function POST(req: NextRequest) {
  // Verificar secret para que nadie más pueda dispararlo
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const now = new Date();

  // Ventana: entre (ahora + 2h - 30min) y (ahora + 2h + 30min)
  const windowStart = new Date(now.getTime() + (REMINDER_WINDOW_MINUTES - TOLERANCE_MINUTES) * 60_000);
  const windowEnd   = new Date(now.getTime() + (REMINDER_WINDOW_MINUTES + TOLERANCE_MINUTES) * 60_000);

  // Traer todas las reservas confirmadas cuya clase empieza dentro de la ventana
  // startTime es "HH:MM" en el timezone del gym — comparamos a nivel de fecha + hora UTC
  const bookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      deletedAt: null,
      classDate: {
        // La classDate está guardada a medianoche UTC del día — filtramos por fecha del día
        gte: new Date(windowStart.toISOString().split("T")[0] + "T00:00:00.000Z"),
        lte: new Date(windowEnd.toISOString().split("T")[0]   + "T23:59:59.999Z"),
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

  for (const booking of bookings) {
    const [h, m] = booking.class.startTime.split(":").map(Number);

    // Reconstruir el datetime real de inicio de la clase
    const classStart = new Date(booking.classDate);
    classStart.setUTCHours(h, m, 0, 0);

    const minutesUntil = (classStart.getTime() - now.getTime()) / 60_000;

    // Solo avisar si cae dentro de la ventana
    if (minutesUntil < REMINDER_WINDOW_MINUTES - TOLERANCE_MINUTES) continue;
    if (minutesUntil > REMINDER_WINDOW_MINUTES + TOLERANCE_MINUTES) continue;

    const label = booking.class.discipline?.name ?? "Clase";

    sendPushToUser(booking.userId, {
      title: `Recordatorio: ${label} en 2 horas ⏰`,
      body: `Tu clase de ${label} empieza a las ${booking.class.startTime}hs. ¡Preparate!`,
      url: "/bookings",
      tag: "class-reminder",
    }).catch(() => {});

    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
