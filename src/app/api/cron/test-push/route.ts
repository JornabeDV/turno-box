import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

/**
 * Endpoint de test para verificar que un usuario recibe notificaciones push.
 * Solo funciona si estás logueado como ADMIN o STUDENT.
 *
 * curl -X POST https://tu-app.com/api/cron/test-push \
 *   -H "x-cron-secret: TU_CRON_SECRET"
 */

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id) {
    return NextResponse.json(
      { error: "No hay sesión activa. Este endpoint requiere que estés logueado en el navegador." },
      { status: 401 }
    );
  }

  const result = await sendPushToUser(user.id, {
    title: "🔔 Test de notificación",
    body: "Si ves esto, las notificaciones push están funcionando correctamente.",
    url: "/",
    tag: "test-push",
  });

  return NextResponse.json({
    ok: true,
    userId: user.id,
    result,
  });
}
