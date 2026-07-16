import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateMetricsReport } from "@/lib/queries/metrics";
import { sendMetricsReportEmail } from "@/lib/email";

/**
 * Endpoint de prueba para reportes de métricas.
 * Permite enviar un reporte de prueba a un email específico sin esperar al cron.
 *
 * Ejemplo de uso:
 * POST /api/cron/test-report
 * Headers: x-cron-secret: <CRON_SECRET>
 * Body: { "email": "admin@tugym.com", "days": 7 }
 */

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const testEmail = body.email as string | undefined;
  const days = typeof body.days === "number" ? body.days : 7;

  if (!testEmail) {
    return NextResponse.json({ error: "Falta el campo 'email' en el body" }, { status: 400 });
  }

  // Configuración
  const resendConfigured = !!process.env.RESEND_API_KEY;

  // Buscar el admin por email para saber a qué gym pertenece
  const admin = await prisma.user.findFirst({
    where: { email: testEmail, role: "ADMIN", isActive: true },
    select: { id: true, name: true, gymId: true },
  });

  if (!admin || !admin.gymId) {
    return NextResponse.json(
      { error: "No se encontró un admin activo con ese email" },
      { status: 404 }
    );
  }

  const gym = await prisma.gym.findUnique({
    where: { id: admin.gymId },
    select: { id: true, name: true },
  });

  if (!gym) {
    return NextResponse.json({ error: "Gimnasio no encontrado", gymId: admin.gymId }, { status: 404 });
  }

  // Calcular rango de fechas
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const periodLabel = `test (${start.toLocaleDateString("es-AR")} - ${end.toLocaleDateString("es-AR")})`;

  // Generar reporte
  const report = await calculateMetricsReport(gym.id, start, end, periodLabel);

  // Enviar email
  const emailResult = await sendMetricsReportEmail(testEmail, gym.name, report);

  return NextResponse.json({
    ok: true,
    resendConfigured,
    admin: { id: admin.id, name: admin.name, gymId: admin.gymId, gymName: gym.name },
    period: periodLabel,
    emailSent: emailResult,
    reportKpis: report.kpis,
  });
}
