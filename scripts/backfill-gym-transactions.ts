import { prisma } from "../src/lib/prisma";

/**
 * Backfill: crea un GymTransaction INCOME para cada Payment APPROVED existente
 * que aún no tenga vinculación con el ledger contable.
 *
 * Ejecutar:
 *   npx tsx scripts/backfill-gym-transactions.ts
 */

async function main() {
  const payments = await prisma.payment.findMany({
    where: { status: "APPROVED", gymTransaction: null },
    select: {
      id: true,
      gymId: true,
      userId: true,
      amountPaid: true,
      provider: true,
      paidAt: true,
      pack: { select: { name: true } },
    },
  });

  console.log(`Encontrados ${payments.length} payments APPROVED sin GymTransaction.`);

  let created = 0;
  for (const p of payments) {
    const isManual = p.provider === "MANUAL";
    const category = isManual ? "Venta manual" : "Venta de abono";
    const method = isManual ? undefined : "MERCADOPAGO";

    await prisma.gymTransaction.create({
      data: {
        gymId: p.gymId,
        type: "INCOME",
        category,
        amount: p.amountPaid,
        description: isManual
          ? `Ajuste manual de créditos`
          : `Compra de ${p.pack?.name ?? "abono"}`,
        method,
        userId: p.userId,
        paymentId: p.id,
        registeredBy: "system-backfill",
        date: p.paidAt ?? new Date(),
      },
    });
    created++;
  }

  console.log(`✔ Creados ${created} GymTransaction(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
