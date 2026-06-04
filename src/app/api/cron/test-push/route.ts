import { NextRequest, NextResponse } from "next/server";
import { sendPushToUser } from "@/lib/push";

/**
 * Endpoint de test para verificar que un usuario recibe notificaciones push.
 *
 * Uso:
 *   curl -X POST https://tu-app.com/api/cron/test-push \
 *     -H "x-cron-secret: TU_CRON_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"userId":"USER_ID_AQUI"}'
 */

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { userId?: string };
  const userId = body.userId;

  if (!userId) {
    return NextResponse.json(
      { error: "Falta userId en el body" },
      { status: 400 }
    );
  }

  const result = await sendPushToUser(userId, {
    title: "🔔 Test de notificación",
    body: "Si ves esto, las notificaciones push están funcionando correctamente.",
    url: "/",
    tag: "test-push",
  });

  return NextResponse.json({
    ok: true,
    userId,
    result,
  });
}
