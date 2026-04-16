import { prisma } from "@/lib/prisma";
import { MercadoPagoConfig, Payment as MPPayment } from "mercadopago";

/**
 * Verifica el pago con MercadoPago y acredita los créditos si está aprobado.
 * Es idempotente: si el pago ya está APPROVED en la DB, no hace nada.
 * Retorna true si los créditos quedaron acreditados.
 */
export async function approvePaymentIfValid(paymentId: string): Promise<boolean> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });
  if (!payment) return false;

  // Ya procesado — idempotencia
  if (payment.status === "APPROVED") return true;

  // Consultar estado real en MP usando el providerOrderId (preference_id)
  // Si aún no tiene providerPaymentId, buscamos por external_reference
  const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
  const mpApi    = new MPPayment(mpClient);

  let mpStatus: string | null | undefined = null;
  let mpPaymentId: string | null = payment.providerPaymentId;

  if (mpPaymentId) {
    // Ya tenemos el ID del pago — consulta directa
    const mpData = await mpApi.get({ id: mpPaymentId });
    mpStatus = mpData.status;
  } else {
    // Buscamos por external_reference (nuestro payment.id)
    const results = await mpApi.search({
      options: { external_reference: paymentId, sort: "date_created", criteria: "desc" },
    });
    const latest = results.results?.[0];
    if (!latest?.id) return false;
    mpPaymentId = String(latest.id);
    mpStatus    = latest.status;
  }

  if (mpStatus !== "approved") return false;

  // Acreditar créditos en una transacción atómica
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status:            "APPROVED",
        providerPaymentId: mpPaymentId,
        paidAt:            new Date(),
      },
    });

    await tx.$executeRaw`
      INSERT INTO user_credit_balances (id, "userId", "gymId", "availableCredits", version, "updatedAt")
      VALUES (gen_random_uuid(), ${payment.userId}, ${payment.gymId}, ${payment.creditsGranted}, 1, now())
      ON CONFLICT ("userId", "gymId")
      DO UPDATE SET
        "availableCredits" = user_credit_balances."availableCredits" + ${payment.creditsGranted},
        version            = user_credit_balances.version + 1,
        "updatedAt"        = now()
    `;

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

  return true;
}
