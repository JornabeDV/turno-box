import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { approvePaymentIfValid } from "@/lib/approvePayment";
import { sendPushToUser, sendPushToGymAdmins } from "@/lib/push";
import { MercadoPagoConfig, Payment as MPPayment } from "mercadopago";
import crypto from "crypto";

function validateSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string
): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true;

  const ts = xSignature.split(",").find((p) => p.startsWith("ts="))?.slice(3) ?? "";
  const v1 = xSignature.split(",").find((p) => p.startsWith("v1="))?.slice(3) ?? "";
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  return expected === v1;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  let event: { type?: string; data?: { id?: string } };

  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ ok: true });
  }

  const xSignature = req.headers.get("x-signature") ?? "";
  const xRequestId = req.headers.get("x-request-id") ?? "";
  const dataId     = req.nextUrl.searchParams.get("data.id") ?? event?.data?.id ?? "";

  if (!validateSignature(xSignature, xRequestId, String(dataId))) {
    return NextResponse.json({ ok: true });
  }

  if (event.type !== "payment" || !event.data?.id) {
    return NextResponse.json({ ok: true });
  }

  const mpPaymentId = String(event.data.id);

  try {
    // Buscar nuestro payment por providerPaymentId o por external_reference
    const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
    const mpApi    = new MPPayment(mpClient);
    const mpData   = await mpApi.get({ id: mpPaymentId });

    const paymentId = mpData.external_reference;
    if (!paymentId) return NextResponse.json({ ok: true });

    if (mpData.status === "approved") {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        select: { status: true, userId: true, creditsGranted: true, amountPaid: true, gymId: true, user: { select: { name: true } } },
      });

      // credited = true solo si esta llamada hizo la acreditación
      // (false si la success page ya lo había hecho antes → no enviar push duplicada)
      const credited = await approvePaymentIfValid(paymentId);

      if (credited) {
        sendPushToUser(payment!.userId, {
          title: "¡Abono acreditado! 🎉",
          body: `Se sumaron ${payment!.creditsGranted} crédito${payment!.creditsGranted !== 1 ? "s" : ""} a tu cuenta.`,
          url: "/packs",
          tag: "payment-approved",
        }).catch(() => {});

        const userName = payment!.user?.name ?? "Un usuario";
        const amountStr = String(payment!.amountPaid);
        sendPushToGymAdmins(payment!.gymId, {
          title: "💰 Nuevo pago recibido",
          body: `${userName} pagó $${amountStr}`,
          url: "/admin/payments",
          tag: "admin-payment",
        }).catch(() => {});
      }
    } else if (["rejected", "cancelled"].includes(mpData.status ?? "")) {
      await prisma.payment.updateMany({
        where: { id: paymentId, status: { not: "APPROVED" } },
        data: {
          status:            mpData.status === "rejected" ? "REJECTED" : "CANCELLED",
          providerPaymentId: mpPaymentId,
          failureReason:     String(mpData.status_detail ?? ""),
          rawWebhook:        mpData as object,
        },
      });
    }

  } catch (err) {
    console.error("[MP Webhook]", err);
  }

  return NextResponse.json({ ok: true });
}
