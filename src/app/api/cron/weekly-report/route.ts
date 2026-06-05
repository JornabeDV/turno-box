import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateMetricsReport } from "@/lib/queries/metrics";
import { sendMetricsReportEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const configCheck = {
    resendConfigured: !!process.env.RESEND_API_KEY,
    resendFrom: process.env.RESEND_FROM_EMAIL,
    appUrl: process.env.NEXT_PUBLIC_URL,
  };

  console.log("[WEEKLY REPORT] Config:", JSON.stringify(configCheck));

  // Semana pasada: Lunes a Domingo
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const end = new Date(today);
  end.setDate(today.getDate() - daysSinceMonday - 1);
  end.setHours(23, 59, 59, 999);

  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const periodLabel = `semanal (${start.toLocaleDateString("es-AR")} - ${end.toLocaleDateString("es-AR")})`;
  console.log("[WEEKLY REPORT] Period:", periodLabel);

  const gyms = await prisma.gym.findMany({ select: { id: true, name: true } });
  console.log("[WEEKLY REPORT] Gyms found:", gyms.length);

  const results: { gym: string; gymId: string; adminsFound: number; emails: string[]; sent: number; failed: number; errors: string[] }[] = [];

  for (const gym of gyms) {
    const admins = await prisma.user.findMany({
      where: { gymId: gym.id, role: "ADMIN", isActive: true },
      select: { email: true },
    });

    const emails = admins.map((a) => a.email).filter(Boolean) as string[];
    console.log(`[WEEKLY REPORT] Gym "${gym.name}" (${gym.id}): ${admins.length} admins, ${emails.length} valid emails`);

    if (emails.length === 0) {
      results.push({ gym: gym.name, gymId: gym.id, adminsFound: admins.length, emails: [], sent: 0, failed: 0, errors: ["No hay admins con email"] });
      continue;
    }

    const report = await calculateMetricsReport(gym.id, start, end, periodLabel);

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const email of emails) {
      try {
        const ok = await sendMetricsReportEmail(email, gym.name, report);
        if (ok) {
          sent++;
          console.log(`[WEEKLY REPORT] Email sent to ${email} for gym ${gym.name}`);
        } else {
          failed++;
          errors.push(`Failed to send to ${email}`);
          console.error(`[WEEKLY REPORT] Email failed to ${email} for gym ${gym.name}`);
        }
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Exception sending to ${email}: ${msg}`);
        console.error(`[WEEKLY REPORT] Exception sending to ${email}:`, msg);
      }
    }

    results.push({ gym: gym.name, gymId: gym.id, adminsFound: admins.length, emails, sent, failed, errors });
  }

  return NextResponse.json({ ok: true, period: periodLabel, config: configCheck, results });
}
