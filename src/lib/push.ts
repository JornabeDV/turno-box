import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let vapidInitialized = false;

function initVapid() {
  if (vapidInitialized) return;
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) return;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidInitialized = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

type RawSub = { id: string; endpoint: string; p256dh: string; auth: string };

async function dispatchToSubs(subs: RawSub[], payload: PushPayload) {
  initVapid();
  if (!vapidInitialized || subs.length === 0) return;

  const expired: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err: unknown) {
        const e = err as { statusCode?: number };
        if (e.statusCode === 404 || e.statusCode === 410) {
          expired.push(sub.id);
        }
      }
    })
  );

  if (expired.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: expired } } });
  }
}

/** Envía una notificación push a todos los dispositivos de un usuario. */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subs = await prisma.pushSubscription.findMany({
    where: { userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });
  await dispatchToSubs(subs, payload);
}

/** Envía una notificación push a todos los usuarios con suscripción activa en un gym. */
export async function sendPushToGym(gymId: string, payload: PushPayload) {
  const subs = await prisma.pushSubscription.findMany({
    where: { user: { gymId } },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });
  await dispatchToSubs(subs, payload);
}
