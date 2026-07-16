import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let vapidInitialized = false;

function initVapid() {
  if (vapidInitialized) return;
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) {
    console.warn("[push] VAPID keys missing — push notifications disabled");
    return;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidInitialized = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export interface PushErrorDetail {
  subscriptionId: string;
  statusCode?: number;
  message?: string;
}

export interface PushResult {
  subscriptionsFound: number;
  sent: number;
  expired: number;
  errors: number;
  vapidReady: boolean;
  details?: PushErrorDetail[];
}

type RawSub = { id: string; endpoint: string; p256dh: string; auth: string };

async function dispatchToSubs(subs: RawSub[], payload: PushPayload): Promise<PushResult> {
  initVapid();
  if (!vapidInitialized) {
    return { subscriptionsFound: subs.length, sent: 0, expired: 0, errors: 0, vapidReady: false };
  }
  if (subs.length === 0) {
    return { subscriptionsFound: 0, sent: 0, expired: 0, errors: 0, vapidReady: true };
  }

  const expired: string[] = [];
  const details: PushErrorDetail[] = [];
  let sent = 0;
  let errors = 0;

  const results = await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
        return { ok: true };
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string; body?: string };
        const detail: PushErrorDetail = {
          subscriptionId: sub.id,
          statusCode: e.statusCode,
          message: e.message || (err instanceof Error ? err.message : String(err)),
        };
        details.push(detail);

        if (e.statusCode === 404 || e.statusCode === 410) {
          expired.push(sub.id);
        } else {
          console.error("[push] sendNotification failed:", e.statusCode, e.message);
        }
        return { ok: false, statusCode: e.statusCode };
      }
    })
  );

  for (const r of results) {
    if (r.status === "fulfilled" && r.value.ok) sent++;
    else errors++;
  }

  if (expired.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: expired } } });
  }

  return {
    subscriptionsFound: subs.length,
    sent,
    expired: expired.length,
    errors,
    vapidReady: true,
    details,
  };
}

/** Envía una notificación push a todos los dispositivos de un usuario. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<PushResult> {
  const subs = await prisma.pushSubscription.findMany({
    where: { userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });
  const result = await dispatchToSubs(subs, payload);
  if (result.subscriptionsFound === 0) {
    console.warn(`[push] No subscriptions found for user ${userId}`);
  }
  return result;
}

/** Envía una notificación push a todos los usuarios con suscripción activa en un gym. */
export async function sendPushToGym(gymId: string, payload: PushPayload): Promise<PushResult> {
  const subs = await prisma.pushSubscription.findMany({
    where: { user: { gymId } },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });
  return dispatchToSubs(subs, payload);
}

/** Envía una notificación push a todos los administradores de un gym. */
export async function sendPushToGymAdmins(gymId: string, payload: PushPayload): Promise<PushResult> {
  const subs = await prisma.pushSubscription.findMany({
    where: { user: { gymId, role: "ADMIN" } },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });
  return dispatchToSubs(subs, payload);
}
