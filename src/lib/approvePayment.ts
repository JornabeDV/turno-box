import { prisma } from "@/lib/prisma";
import { createMpClient } from "@/lib/mercadopago";
import { Payment as MPPayment } from "mercadopago";

/**
 * Verifica el pago con MercadoPago y acredita los créditos si está aprobado.
 * Es idempotente: si el pago ya está APPROVED en la DB, no hace nada.
 * Retorna true si los créditos quedaron acreditados.
 */
export async function approvePaymentIfValid(
  paymentId: string,
  accessToken: string
): Promise<boolean> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });
  if (!payment) return false;

  // Ya procesado — idempotencia
  if (payment.status === "APPROVED") return true;

  // Consultar estado real en MP usando el providerOrderId (preference_id)
  // Si aún no tiene providerPaymentId, buscamos por external_reference
  const mpClient = createMpClient(accessToken);
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

  // Acreditar créditos solo si el pago sigue PENDING, de forma atómica
  const result = await prisma.$transaction(async (tx) => {
    // updateMany con status=PENDING actúa como bloqueo: solo un proceso gana
    const updated = await tx.payment.updateMany({
      where: { id: paymentId, status: "PENDING" },
      data: {
        status:            "APPROVED",
        providerPaymentId: mpPaymentId,
        paidAt:            new Date(),
      },
    });

    if (updated.count === 0) {
      // Otro proceso ya acreditó este pago
      return { credited: false };
    }

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

    await tx.gymTransaction.create({
      data: {
        gymId: payment.gymId,
        type: "INCOME",
        category: "Venta de abono",
        amount: payment.amountPaid,
        description: `Compra de abono (${payment.creditsGranted} créditos)`,
        method: "MERCADOPAGO",
        userId: payment.userId,
        paymentId: payment.id,
        registeredBy: "system-mp",
        date: new Date(),
      },
    });

    return { credited: true };
  });

  return result.credited;
}
