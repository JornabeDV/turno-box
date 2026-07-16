import { prisma } from "../src/lib/prisma";

/**
 * ============================================================================
 * MERGE DE DOS ADMINS DE UN MISMO GIMNASIO
 * ============================================================================
 *
 * Escenario: un mismo gimnasio tiene dos usuarios con role = ADMIN.
 * Este script transfiere TODO lo asociado al admin "source" hacia el
 * admin "target", y luego elimina el admin "source".
 *
 * Al final queda UN solo admin con el email del target.
 *
 * USO:
 *   npx tsx scripts/merge-gym-admins.ts
 *
 * IMPORTANTE: hacé un backup de la base de datos antes de ejecutar.
 */

const SOURCE_EMAIL = "anabelenbeja25@gmail.com"; // admin con datos históricos
const TARGET_EMAIL = "rm.box2021@gmail.com";   // admin que se usa actualmente

async function main() {
  const source = await prisma.user.findUnique({ where: { email: SOURCE_EMAIL } });
  const target = await prisma.user.findUnique({ where: { email: TARGET_EMAIL } });

  if (!source) throw new Error(`No existe el admin source: ${SOURCE_EMAIL}`);
  if (!target) throw new Error(`No existe el admin target: ${TARGET_EMAIL}`);

  if (source.role !== "ADMIN" || target.role !== "ADMIN") {
    throw new Error("Ambos usuarios deben tener role = ADMIN");
  }

  if (source.gymId !== target.gymId) {
    throw new Error(
      `Los admins no pertenecen al mismo gimnasio. Source gymId: ${source.gymId}, Target gymId: ${target.gymId}`
    );
  }

  if (source.id === target.id) {
    throw new Error("Source y target son el mismo usuario.");
  }

  const gymId = source.gymId!;

  console.log(`\n⚙️  Mergeando admins del gimnasio ${gymId}`);
  console.log(`   Source: ${SOURCE_EMAIL} (${source.id})`);
  console.log(`   Target: ${TARGET_EMAIL} (${target.id})`);

  await prisma.$transaction(async (tx) => {
    // ── Relaciones directas de User ───────────────────────────────────────
    await tx.gymClass.updateMany({
      where: { coachId: source.id },
      data: { coachId: target.id },
    });

    await tx.payment.updateMany({
      where: { userId: source.id },
      data: { userId: target.id },
    });

    await tx.creditTransaction.updateMany({
      where: { userId: source.id },
      data: { userId: target.id },
    });

    await tx.gymTransaction.updateMany({
      where: { userId: source.id },
      data: { userId: target.id },
    });

    await tx.booking.updateMany({
      where: { userId: source.id },
      data: { userId: target.id },
    });

    await tx.creditFreeze.updateMany({
      where: { userId: source.id },
      data: { userId: target.id },
    });

    await tx.pushSubscription.updateMany({
      where: { userId: source.id },
      data: { userId: target.id },
    });

    await tx.account.updateMany({
      where: { userId: source.id },
      data: { userId: target.id },
    });

    await tx.session.updateMany({
      where: { userId: source.id },
      data: { userId: target.id },
    });

    await tx.passwordResetToken.updateMany({
      where: { userId: source.id },
      data: { userId: target.id },
    });

    // ── Campos de texto que guardan el userId del admin ────────────────────
    await tx.gymTransaction.updateMany({
      where: { registeredBy: source.id },
      data: { registeredBy: target.id },
    });

    await tx.creditFreeze.updateMany({
      where: { createdBy: source.id },
      data: { createdBy: target.id },
    });

    // ── UserCreditBalance: merge porque tiene @@unique([userId, gymId]) ────
    const sourceBalance = await tx.userCreditBalance.findUnique({
      where: { userId_gymId: { userId: source.id, gymId } },
    });

    if (sourceBalance) {
      const targetBalance = await tx.userCreditBalance.findUnique({
        where: { userId_gymId: { userId: target.id, gymId } },
      });

      if (targetBalance) {
        // Sumar créditos del source al target y eliminar el balance duplicado
        await tx.userCreditBalance.update({
          where: { id: targetBalance.id },
          data: {
            availableCredits: {
              increment: sourceBalance.availableCredits,
            },
            version: { increment: 1 },
          },
        });
        await tx.userCreditBalance.delete({ where: { id: sourceBalance.id } });
      } else {
        // El target no tenía balance: simplemente transferir el del source
        await tx.userCreditBalance.update({
          where: { id: sourceBalance.id },
          data: { userId: target.id },
        });
      }
    }

    // ── Opcional: copiar nombre/password del source al target ─────────────
    // Si querés que el admin final conserve el nombre o la contraseña del
    // source, descomentá el bloque siguiente. Por defecto se conserva el
    // target tal cual (la contraseña que usa actualmente rm.box2021@gmail.com).
    //
    // await tx.user.update({
    //   where: { id: target.id },
    //   data: { name: source.name ?? target.name, passwordHash: source.passwordHash ?? target.passwordHash },
    // });

    // ── Eliminar el admin duplicado ───────────────────────────────────────
    await tx.user.delete({ where: { id: source.id } });
  });

  console.log(`\n✅ Merge completado. El admin unificado es: ${TARGET_EMAIL}`);
  console.log(`   El usuario ${SOURCE_EMAIL} fue eliminado.\n`);
}

main()
  .catch((e) => {
    console.error("\n❌ Error:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
