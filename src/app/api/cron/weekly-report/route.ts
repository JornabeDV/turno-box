import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateMetricsReport } from "@/lib/queries/metrics";
import { sendMetricsReportEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Semana pasada: Lunes a Domingo
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Domingo, 1=Lunes
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const end = new Date(today);
  end.setDate(today.getDate() - daysSinceMonday - 1); // Domingo pasado
  end.setHours(23, 59, 59, 999);

  const start = new Date(end);
  start.setDate(end.getDate() - 6); // Lunes pasado
  start.setHours(0, 0, 0, 0);

  const periodLabel = `semanal (${start.toLocaleDateString("es-AR")} - ${end.toLocaleDateString("es-AR")})`;

  const gyms = await prisma.gym.findMany({ select: { id: true, name: true } });
  const results: { gym: string; sent: number; failed: number }[] = [];

  for (const gym of gyms) {
    const admins = await prisma.user.findMany({
      where: { gymId: gym.id, role: "ADMIN", isActive: true },
      select: { email: true },
    });

    if (admins.length === 0) {
      results.push({ gym: gym.name, sent: 0, failed: 0 });
      continue;
    }

    const report = await calculateMetricsReport(gym.id, start, end, periodLabel);

    let sent = 0;
    let failed = 0;
    for (const admin of admins) {
      if (!admin.email) continue;
      const ok = await sendMetricsReportEmail(admin.email, gym.name, report);
      ok ? sent++ : failed++;
    }

    results.push({ gym: gym.name, sent, failed });
  }

  return NextResponse.json({ ok: true, period: periodLabel, results });
}
