import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { MercadoPagoConfig, Payment as MPPayment } from "mercadopago";
import crypto from "crypto";

// Verifica la firma HMAC-SHA256 que envía MercadoPago en el header x-signature
function validateSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string
): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // en dev sin secret, aceptar todo

  const ts = xSignature.split(",").find((p) => p.startsWith("ts="))?.slice(3) ?? "";
  const v1 = xSignature.split(",").find((p) => p.startsWith("v1="))?.slice(3) ?? "";
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");
  return expected === v1;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  let event: { type?: string; data?: { id?: string } };

  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ ok: true }); // ignorar payloads malformados
  }

  // Validar firma
  const xSignature = req.headers.get("x-signature") ?? "";
  const xRequestId = req.headers.get("x-request-id") ?? "";
  const dataId     = req.nextUrl.searchParams.get("data.id") ?? event?.data?.id ?? "";

  if (!validateSignature(xSignature, xRequestId, String(dataId))) {
    // Devolver 200 igualmente — no revelar que el endpoint existe
    return NextResponse.json({ ok: true });
  }

  // Solo procesar eventos de pago
  if (event.type !== "payment" || !event.data?.id) {
    return NextResponse.json({ ok: true });
  }

  const mpPaymentId = String(event.data.id);

  try {
    // ── Idempotencia: si ya está APPROVED, no procesar de nuevo ──
    const existing = await prisma.payment.findUnique({
      where: { providerPaymentId: mpPaymentId },
    });
    if (existing?.status === "APPROVED") {
      return NextResponse.json({ ok: true });
    }

    // ── Verificar el estado real en la API de MP ──
    const mpClient  = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
    const mpApi     = new MPPayment(mpClient);
    const mpData    = await mpApi.get({ id: mpPaymentId });

    const paymentId = mpData.external_reference; // = nuestro Payment.id
    if (!paymentId) return NextResponse.json({ ok: true });

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) return NextResponse.json({ ok: true });

    if (mpData.status === "approved") {
      await prisma.$transaction(async (tx) => {
        // 1. Marcar pago como aprobado
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status:            "APPROVED",
            providerPaymentId: mpPaymentId,
            paidAt:            new Date(),
            rawWebhook:        mpData as object,
          },
        });

        // 2. Acreditar créditos — UPSERT atómico sobre el balance materializado
        await tx.$executeRaw`
          INSERT INTO user_credit_balances (id, user_id, gym_id, available_credits, version, updated_at)
          VALUES (gen_random_uuid(), ${payment.userId}, ${payment.gymId}, ${payment.creditsGranted}, 1, now())
          ON CONFLICT (user_id, gym_id)
          DO UPDATE SET
            available_credits = user_credit_balances.available_credits + ${payment.creditsGranted},
            version           = user_credit_balances.version + 1,
            updated_at        = now()
        `;

        // 3. Registrar en el ledger
        await tx.creditTransaction.create({
          data: {
            userId:    payment.userId,
            gymId:     payment.gymId,
            type:      "PURCHASE",
            amount:    payment.creditsGranted,
            paymentId: payment.id,
            expiresAt: payment.expiresAt,
          },
        });
      });

      // Notificar al usuario que sus créditos fueron acreditados
      sendPushToUser(payment.userId, {
        title: "¡Abono acreditado! 🎉",
        body: `Se sumaron ${payment.creditsGranted} crédito${payment.creditsGranted !== 1 ? "s" : ""} a tu cuenta.`,
        url: "/packs",
        tag: "payment-approved",
      }).catch(() => {});

    } else if (["rejected", "cancelled"].includes(mpData.status ?? "")) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status:           mpData.status === "rejected" ? "REJECTED" : "CANCELLED",
          providerPaymentId: mpPaymentId,
          failureReason:    String(mpData.status_detail ?? ""),
          rawWebhook:       mpData as object,
        },
      });
    }
    // status "pending" o "in_process" → no hacer nada, esperar próximo webhook

  } catch (err) {
    console.error("[MP Webhook]", err);
    // Devolver 200 para que MP no reintente indefinidamente en errores nuestros
    // Si el error es transitorio, el siguiente webhook lo resolverá
  }

  return NextResponse.json({ ok: true });
}
