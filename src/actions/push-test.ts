"use server";

import { auth } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

export async function testPushNotificationAction() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;

  if (!user?.id) {
    return { success: false, error: "No estás autenticado" };
  }

  const result = await sendPushToUser(user.id, {
    title: "🔔 Test de notificación",
    body: "Si ves esto, las notificaciones push están funcionando correctamente.",
    url: "/",
    tag: "test-push",
  });

  return { success: true, result };
}
