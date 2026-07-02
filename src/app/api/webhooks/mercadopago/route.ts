import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { approvePaymentIfValid } from "@/lib/approvePayment";
import { sendPushToUser, sendPushToGymAdmins } from "@/lib/push";
import {
  getMpAccessToken,
  getMpWebhookSecret,
  createMpClient,
  validateMpSignature,
} from "@/lib/mercadopago";
import { Payment as MPPayment } from "mercadopago";

export async function POST(req: NextRequest) {
  const body = await req.text();
  let event: { type?: string; data?: { id?: string } };

  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ ok: true });
  }

  const gymId = req.nextUrl.searchParams.get("gymId");
  if (!gymId) {
    console.error("[MP Webhook] Falta gymId en query string");
    return NextResponse.json({ ok: true });
  }

  const mpAccessToken = await getMpAccessToken(gymId);
  if (!mpAccessToken) {
    console.error(`[MP Webhook] Gimnasio ${gymId} no tiene MP configurado`);
    return NextResponse.json({ ok: true });
  }

  const xSignature = req.headers.get("x-signature") ?? "";
  const xRequestId = req.headers.get("x-request-id") ?? "";
  const dataId = req.nextUrl.searchParams.get("data.id") ?? event?.data?.id ?? "";

  const webhookSecret = await getMpWebhookSecret(gymId);
  if (webhookSecret && xSignature) {
    if (!validateMpSignature(webhookSecret, xSignature, xRequestId, String(dataId))) {
      console.error(`[MP Webhook] Firma inválida para gym ${gymId}`);
      return NextResponse.json({ ok: true });
    }
  }

  if (event.type !== "payment" || !event.data?.id) {
    return NextResponse.json({ ok: true });
  }

  const mpPaymentId = String(event.data.id);

  try {
    const mpClient = createMpClient(mpAccessToken);
    const mpApi = new MPPayment(mpClient);
    const mpData = await mpApi.get({ id: mpPaymentId });

    const paymentId = mpData.external_reference;
    if (!paymentId) return NextResponse.json({ ok: true });

    if (mpData.status === "approved") {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        select: {
          status: true,
          userId: true,
          creditsGranted: true,
          amountPaid: true,
          gymId: true,
          user: { select: { name: true, email: true } },
          pack: { select: { name: true } },
        },
      });

      if (!payment) return NextResponse.json({ ok: true });

      // credited = true solo si esta llamada hizo la acreditación
      // (false si la success page ya lo había hecho antes → no enviar push duplicada)
      const credited = await approvePaymentIfValid(paymentId, mpAccessToken);

      if (credited) {
        sendPushToUser(payment.userId, {
          title: "¡Abono acreditado! 🎉",
          body: `Se sumaron ${payment.creditsGranted} crédito${payment.creditsGranted !== 1 ? "s" : ""} a tu cuenta.`,
          url: "/packs",
          tag: "payment-approved",
        }).catch(() => {});

        const userName = payment.user?.name ?? "Un usuario";
        const amountStr = String(payment.amountPaid);
        const packName = payment.pack?.name ?? "";
        const packPart = packName ? ` · ${packName}` : "";
        sendPushToGymAdmins(payment.gymId, {
          title: "💰 Nuevo pago recibido",
          body: `${userName} · $${amountStr}${packPart}`,
          url: "/admin/payments",
          tag: "admin-payment",
        }).catch(() => {});
      }
    } else if (["rejected", "cancelled"].includes(mpData.status ?? "")) {
      await prisma.payment.updateMany({
        where: { id: paymentId, status: { not: "APPROVED" } },
        data: {
          status: mpData.status === "rejected" ? "REJECTED" : "CANCELLED",
          providerPaymentId: mpPaymentId,
          failureReason: String(mpData.status_detail ?? ""),
          rawWebhook: mpData as object,
        },
      });
    }
  } catch (err) {
    console.error("[MP Webhook]", err);
  }

  return NextResponse.json({ ok: true });
}
