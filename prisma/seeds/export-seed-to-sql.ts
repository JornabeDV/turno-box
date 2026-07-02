/**
 * Exporta los datos del gym a un archivo SQL de INSERTs.
 * Ejecutar DESPUÉS de seed-metrics.ts
 *
 *   npx tsx prisma/export-seed-to-sql.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";

const url = process.env.DATABASE_URL!;
const adapter = new PrismaPg(url);
const prisma = new PrismaClient({ adapter });

function escapeSql(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "number") return String(val);
  if (val instanceof Date) return `'${val.toISOString()}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

function buildInsert(table: string, rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  let sql = `\n-- ${table} (${rows.length} rows)\n`;
  for (const row of rows) {
    const values = cols.map((c) => escapeSql(row[c])).join(", ");
    sql += `INSERT INTO ${table} (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${values});\n`;
  }
  return sql;
}

async function main() {
  const gym = await prisma.gym.findFirst({ where: { slug: "crossfit-demo" } });
  if (!gym) {
    console.error("❌ Gym no encontrado. Ejecutá seed-metrics.ts primero.");
    process.exit(1);
  }
  const gymId = gym.id;

  console.log(`📤 Exportando datos del gym: ${gym.name}...`);
  let sql = `-- ============================================================\n`;
  sql += `-- SQL GENERADO — Datos de métricas para "${gym.name}"\n`;
  sql += `-- Generado: ${new Date().toISOString()}\n`;
  sql += `-- ============================================================\n`;
  sql += `-- NOTA: Este SQL asume que el gym ya existe.\n`;
  sql += `-- Ejecutar DESPUÉS de prisma/seed.ts\n\n`;

  // Disciplines
  const disciplines = await prisma.discipline.findMany({ where: { gymId } });
  sql += buildInsert(
    "disciplines",
    disciplines.map((d) => ({
      id: d.id,
      name: d.name,
      color: d.color,
      description: d.description,
      isActive: d.isActive,
      gymId: d.gymId,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }))
  );

  // Coaches + Students
  const users = await prisma.user.findMany({ where: { gymId, role: { in: ["COACH", "STUDENT"] } } });
  sql += buildInsert(
    "users",
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      emailVerified: u.emailVerified,
      image: u.image,
      role: u.role,
      passwordHash: u.passwordHash,
      isActive: u.isActive,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      birthDate: u.birthDate,
      phone: u.phone,
      invitedAt: u.invitedAt,
      gender: u.gender,
      gymId: u.gymId,
    }))
  );

  // Classes
  const classes = await prisma.gymClass.findMany({
    where: { gymId, deletedAt: null },
    include: { discipline: true, coach: true },
  });
  sql += buildInsert(
    "gym_classes",
    classes.map((c) => ({
      id: c.id,
      description: c.description,
      dayOfWeek: c.dayOfWeek,
      startTime: c.startTime,
      endTime: c.endTime,
      maxCapacity: c.maxCapacity,
      color: c.color,
      isActive: c.isActive,
      deletedAt: c.deletedAt,
      gymId: c.gymId,
      coachId: c.coachId,
      disciplineId: c.disciplineId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }))
  );

  // Packs
  const packs = await prisma.pack.findMany({ where: { gymId } });
  sql += buildInsert(
    "packs",
    packs.map((p) => ({
      id: p.id,
      gymId: p.gymId,
      name: p.name,
      credits: p.credits,
      price: p.price,
      currency: p.currency,
      validityDays: p.validityDays,
      isActive: p.isActive,
      sortOrder: p.sortOrder,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }))
  );

  // Payments
  const payments = await prisma.payment.findMany({ where: { gymId } });
  sql += buildInsert(
    "payments",
    payments.map((p) => ({
      id: p.id,
      gymId: p.gymId,
      userId: p.userId,
      packId: p.packId,
      creditsGranted: p.creditsGranted,
      amountPaid: p.amountPaid,
      currency: p.currency,
      provider: p.provider,
      method: p.method,
      providerPaymentId: p.providerPaymentId,
      providerOrderId: p.providerOrderId,
      status: p.status,
      expiresAt: p.expiresAt,
      rawWebhook: p.rawWebhook,
      failureReason: p.failureReason,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }))
  );

  // Credit Transactions
  const creditTxs = await prisma.creditTransaction.findMany({ where: { gymId } });
  sql += buildInsert(
    "credit_transactions",
    creditTxs.map((t) => ({
      id: t.id,
      userId: t.userId,
      gymId: t.gymId,
      type: t.type,
      amount: t.amount,
      paymentId: t.paymentId,
      bookingId: t.bookingId,
      expiresAt: t.expiresAt,
      note: t.note,
      createdAt: t.createdAt,
    }))
  );

  // User Credit Balances
  const balances = await prisma.userCreditBalance.findMany({ where: { gymId } });
  sql += buildInsert(
    "user_credit_balances",
    balances.map((b) => ({
      id: b.id,
      userId: b.userId,
      gymId: b.gymId,
      availableCredits: b.availableCredits,
      version: b.version,
      updatedAt: b.updatedAt,
    }))
  );

  // Bookings (pueden ser muchos, los exportamos en batches)
  const bookingCount = await prisma.booking.count({ where: { class: { gymId } } });
  console.log(`   Exportando ${bookingCount} bookings...`);
  sql += `\n-- bookings (${bookingCount} rows)\n`;

  const BATCH = 500;
  for (let skip = 0; skip < bookingCount; skip += BATCH) {
    const bookings = await prisma.booking.findMany({
      where: { class: { gymId } },
      skip,
      take: BATCH,
    });
    for (const b of bookings) {
      sql += `INSERT INTO bookings ("id", "status", "classDate", "waitlistPos", "cancelledAt", "deletedAt", "userId", "classId", "createdAt", "updatedAt") VALUES `;
      sql += `(${escapeSql(b.id)}, ${escapeSql(b.status)}, ${escapeSql(b.classDate)}, ${escapeSql(b.waitlistPos)}, ${escapeSql(b.cancelledAt)}, ${escapeSql(b.deletedAt)}, ${escapeSql(b.userId)}, ${escapeSql(b.classId)}, ${escapeSql(b.createdAt)}, ${escapeSql(b.updatedAt)});\n`;
    }
  }

  // Gym Transactions
  const gymTxs = await prisma.gymTransaction.findMany({ where: { gymId } });
  sql += buildInsert(
    "gym_transactions",
    gymTxs.map((t) => ({
      id: t.id,
      gymId: t.gymId,
      type: t.type,
      category: t.category,
      amount: t.amount,
      description: t.description,
      method: t.method,
      userId: t.userId,
      paymentId: t.paymentId,
      registeredBy: t.registeredBy,
      date: t.date,
      createdAt: t.createdAt,
    }))
  );

  const outPath = path.resolve(process.cwd(), "prisma/seed-metrics-data.sql");
  fs.writeFileSync(outPath, sql, "utf-8");

  console.log(`\n✅ SQL exportado a: ${outPath}`);
  console.log(`   Tamaño: ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
