/**
 * SEED DE MÉTRICAS — CrossFit Turnos
 * Genera datos realistas para probar todas las métricas del dashboard.
 *
 * Ejecutar:
 *   npx tsx prisma/seed-metrics.ts
 *
 * También genera: prisma/seed-metrics-output.sql (los INSERTs crudos)
 */
import "dotenv/config";
import { PrismaClient, BookingStatus, PaymentStatus, CreditTxType, TransactionType, DayOfWeek, Gender } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL!;
const adapter = new PrismaPg(url);
const prisma = new PrismaClient({ adapter });

// ─── CONFIGURACIÓN ───────────────────────────────────────────────────────────
let GYM_ID = "gym-demo-001";
let ADMIN_ID = "user-admin-001";
const DAYS_OF_HISTORY = 75; // días de bookings hacia atrás
const DAYS_OF_FUTURE = 14;  // días de bookings hacia adelante (para ver en la app)
const STUDENT_COUNT = 45;

// ─── UTILS ───────────────────────────────────────────────────────────────────
function cuid(prefix: string, idx: number) {
  // IDs deterministas para referencias cruzadas
  return `${prefix}-${String(idx).padStart(4, "0")}`;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickWeighted<T>(items: { value: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

function dateDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISODate(d: Date) {
  return d.toISOString().split("T")[0];
}

// ─── DATOS BASE ──────────────────────────────────────────────────────────────
const DISCIPLINES = [
  { id: cuid("disc", 1), name: "CrossFit", color: "#f97316" },
  { id: cuid("disc", 2), name: "Weightlifting", color: "#10b981" },
  { id: cuid("disc", 3), name: "Open Box", color: "#3b82f6" },
  { id: cuid("disc", 4), name: "Mobility", color: "#8b5cf6" },
  { id: cuid("disc", 5), name: "Gymnastics", color: "#ef4444" },
];

const COACHES_DATA = [
  { id: cuid("coach", 1), name: "Lucas Pérez", email: "coach.lucas@crossfit.demo" },
  { id: cuid("coach", 2), name: "Ana Rodríguez", email: "coach.ana@crossfit.demo" },
  { id: cuid("coach", 3), name: "Martín Sánchez", email: "coach.martin@crossfit.demo" },
];

const FIRST_NAMES_M = [
  "Juan", "Martín", "Lucas", "Mateo", "Leo", "Tomás", "Nicolás", "Santiago",
  "Franco", "Bruno", "Agustín", "Emiliano", "Benjamín", "Bautista", "Joaquín",
  "Maximiliano", "Facundo", "Gonzalo", "Ezequiel", "Cristian",
];
const FIRST_NAMES_F = [
  "María", "Lucía", "Martina", "Sofía", "Emilia", "Valentina", "Victoria",
  "Julieta", "Morena", "Alma", "Catalina", "Elena", "Paula", "Camila",
  "Agustina", "Romina", "Florencia", "Daniela", "Carolina", "Natalia",
];
const LAST_NAMES = [
  "González", "Rodríguez", "Gómez", "Fernández", "López", "Martínez",
  "Pérez", "García", "Sánchez", "Romero", "Sosa", "Torres", "Álvarez",
  "Ruiz", "Ramírez", "Flores", "Benítez", "Acosta", "Medina", "Herrera",
  "Aguirre", "Vargas", "Mendoza", "Castro", "Ortiz",
];

const GENDERS: Gender[] = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"];
const GENDER_WEIGHTS = [0.42, 0.48, 0.02, 0.08];

const PACKS_DATA = [
  { id: cuid("pack", 8), name: "Pack 8 clases", credits: 8, price: 14000, validityDays: 30, sortOrder: 0 },
  { id: cuid("pack", 12), name: "Pack 12 clases", credits: 12, price: 19000, validityDays: 45, sortOrder: 1 },
  { id: cuid("pack", 16), name: "Pack 16 clases", credits: 16, price: 24000, validityDays: 60, sortOrder: 2 },
  { id: cuid("pack", 20), name: "Pack 20 clases", credits: 20, price: 28000, validityDays: 90, sortOrder: 3 },
];

const EXPENSE_CATS = ["Alquiler", "Sueldos", "Insumos", "Servicios", "Otro egreso"];
const METHODS = ["EFECTIVO", "TRANSFERENCIA", "TARJETA", "MERCADOPAGO"];

// ─── GENERADORES ─────────────────────────────────────────────────────────────
function generateStudents(count: number) {
  const students = [];
  for (let i = 0; i < count; i++) {
    const g = pickWeighted(GENDERS.map((v, idx) => ({ value: v, weight: GENDER_WEIGHTS[idx] })));
    const first = g === "FEMALE" ? pick(FIRST_NAMES_F) : pick(FIRST_NAMES_M);
    const last = pick(LAST_NAMES);
    const name = `${first} ${last}`;
    const email = `alumno.${i + 1}@crossfit.demo`;
    const birthDate = new Date(randInt(1980, 2005), randInt(0, 11), randInt(1, 28));
    students.push({
      id: cuid("student", i + 1),
      name,
      email,
      gender: g,
      birthDate,
      isActive: Math.random() > 0.08, // 8% inactivos
    });
  }
  return students;
}

function generateClasses(disciplines: typeof DISCIPLINES, coaches: typeof COACHES_DATA) {
  const classes: {
    id: string;
    disciplineId: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    maxCapacity: number;
    coachId: string;
  }[] = [];

  const slots: { day: DayOfWeek; time: string; end: string; cap: number; disciplineIdx: number; coachIdx: number }[] = [
    { day: "MONDAY", time: "06:00", end: "07:00", cap: 10, disciplineIdx: 0, coachIdx: 0 },
    { day: "MONDAY", time: "07:00", end: "08:00", cap: 14, disciplineIdx: 0, coachIdx: 0 },
    { day: "MONDAY", time: "08:00", end: "09:00", cap: 12, disciplineIdx: 0, coachIdx: 1 },
    { day: "MONDAY", time: "18:00", end: "19:00", cap: 16, disciplineIdx: 0, coachIdx: 0 },
    { day: "MONDAY", time: "19:30", end: "21:00", cap: 10, disciplineIdx: 1, coachIdx: 2 },
    { day: "TUESDAY", time: "07:00", end: "08:00", cap: 12, disciplineIdx: 0, coachIdx: 1 },
    { day: "TUESDAY", time: "10:00", end: "12:00", cap: 20, disciplineIdx: 2, coachIdx: 2 },
    { day: "TUESDAY", time: "18:00", end: "19:00", cap: 14, disciplineIdx: 0, coachIdx: 1 },
    { day: "TUESDAY", time: "20:00", end: "21:00", cap: 12, disciplineIdx: 3, coachIdx: 0 },
    { day: "WEDNESDAY", time: "06:00", end: "07:00", cap: 10, disciplineIdx: 0, coachIdx: 0 },
    { day: "WEDNESDAY", time: "07:00", end: "08:00", cap: 14, disciplineIdx: 0, coachIdx: 0 },
    { day: "WEDNESDAY", time: "18:00", end: "19:00", cap: 16, disciplineIdx: 0, coachIdx: 1 },
    { day: "WEDNESDAY", time: "19:30", end: "20:30", cap: 10, disciplineIdx: 4, coachIdx: 2 },
    { day: "THURSDAY", time: "07:00", end: "08:00", cap: 12, disciplineIdx: 0, coachIdx: 1 },
    { day: "THURSDAY", time: "10:00", end: "12:00", cap: 18, disciplineIdx: 2, coachIdx: 2 },
    { day: "THURSDAY", time: "18:00", end: "19:00", cap: 14, disciplineIdx: 0, coachIdx: 0 },
    { day: "THURSDAY", time: "19:30", end: "20:30", cap: 10, disciplineIdx: 3, coachIdx: 1 },
    { day: "FRIDAY", time: "07:00", end: "08:00", cap: 14, disciplineIdx: 0, coachIdx: 0 },
    { day: "FRIDAY", time: "08:00", end: "09:00", cap: 12, disciplineIdx: 0, coachIdx: 1 },
    { day: "FRIDAY", time: "18:00", end: "19:00", cap: 16, disciplineIdx: 0, coachIdx: 0 },
    { day: "FRIDAY", time: "19:30", end: "21:00", cap: 10, disciplineIdx: 1, coachIdx: 2 },
    { day: "SATURDAY", time: "09:00", end: "11:00", cap: 24, disciplineIdx: 2, coachIdx: 2 },
    { day: "SATURDAY", time: "11:00", end: "12:00", cap: 14, disciplineIdx: 0, coachIdx: 0 },
    { day: "SUNDAY", time: "10:00", end: "11:30", cap: 12, disciplineIdx: 3, coachIdx: 1 },
  ];

  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    classes.push({
      id: cuid("class", i + 1),
      disciplineId: disciplines[s.disciplineIdx].id,
      dayOfWeek: s.day,
      startTime: s.time,
      endTime: s.end,
      maxCapacity: s.cap,
      coachId: coaches[s.coachIdx].id,
    });
  }
  return classes;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Iniciando seed de métricas...\n");

  // Buscar gym por slug (el seed.ts crea 'crossfit-demo')
  let gym = await prisma.gym.findUnique({ where: { slug: "crossfit-demo" } });
  if (!gym) {
    gym = await prisma.gym.findFirst();
  }
  if (!gym) {
    console.error("❌ No se encontró ningún gym. Ejecutá primero: npx tsx prisma/seed.ts");
    process.exit(1);
  }
  GYM_ID = gym.id;

  // Buscar admin del gym
  const admin = await prisma.user.findFirst({
    where: { gymId: GYM_ID, role: "ADMIN" },
    orderBy: { createdAt: "asc" },
  });
  if (admin) ADMIN_ID = admin.id;

  console.log(`✓ Gym: ${gym.name} (${GYM_ID})`);
  console.log(`✓ Admin: ${admin?.name || "N/A"} (${ADMIN_ID})`);

  // ─── 1. LIMPIEZA ─────────────────────────────────────────────────────────
  console.log("\n🧹 Limpiando datos previos del gym...");
  await prisma.creditTransaction.deleteMany({ where: { gymId: GYM_ID } });
  await prisma.userCreditBalance.deleteMany({ where: { gymId: GYM_ID } });
  await prisma.gymTransaction.deleteMany({ where: { gymId: GYM_ID } });
  await prisma.payment.deleteMany({ where: { gymId: GYM_ID } });
  await prisma.booking.deleteMany({ where: { class: { gymId: GYM_ID } } });
  await prisma.gymClass.deleteMany({ where: { gymId: GYM_ID } });
  await prisma.pack.deleteMany({ where: { gymId: GYM_ID } });
  // Borrar alumnos y coaches del gym (pero no el admin)
  await prisma.user.deleteMany({ where: { gymId: GYM_ID, role: { in: ["STUDENT", "COACH"] } } });
  await prisma.discipline.deleteMany({ where: { gymId: GYM_ID } });
  console.log("✓ Limpieza completada");

  // ─── 2. DISCIPLINAS ──────────────────────────────────────────────────────
  console.log("\n📚 Creando disciplinas...");
  for (const d of DISCIPLINES) {
    await prisma.discipline.create({
      data: { id: d.id, name: d.name, color: d.color, gymId: GYM_ID },
    });
  }
  console.log(`✓ ${DISCIPLINES.length} disciplinas`);

  // ─── 3. COACHES ──────────────────────────────────────────────────────────
  console.log("\n💪 Creando coaches...");
  const coaches = [];
  for (const c of COACHES_DATA) {
    const coach = await prisma.user.create({
      data: {
        id: c.id,
        name: c.name,
        email: c.email,
        role: "COACH",
        gymId: GYM_ID,
        isActive: true,
        emailVerified: new Date(),
        passwordHash: null,
      },
    });
    coaches.push(coach);
  }
  console.log(`✓ ${coaches.length} coaches`);

  // ─── 4. ALUMNOS ──────────────────────────────────────────────────────────
  console.log(`\n🎓 Creando ${STUDENT_COUNT} alumnos...`);
  const students = generateStudents(STUDENT_COUNT);
  const createdStudents = [];
  for (const s of students) {
    const student = await prisma.user.create({
      data: {
        id: s.id,
        name: s.name,
        email: s.email,
        role: "STUDENT",
        gymId: GYM_ID,
        isActive: s.isActive,
        gender: s.gender,
        birthDate: s.birthDate,
        emailVerified: new Date(),
        passwordHash: null,
      },
    });
    createdStudents.push(student);
  }
  console.log(`✓ ${createdStudents.length} alumnos creados`);

  // ─── 5. CLASES ───────────────────────────────────────────────────────────
  console.log("\n📅 Creando clases semanales...");
  const classes = generateClasses(DISCIPLINES, COACHES_DATA);
  for (const c of classes) {
    await prisma.gymClass.create({
      data: {
        id: c.id,
        dayOfWeek: c.dayOfWeek,
        startTime: c.startTime,
        endTime: c.endTime,
        maxCapacity: c.maxCapacity,
        gymId: GYM_ID,
        coachId: c.coachId,
        disciplineId: c.disciplineId,
        isActive: true,
      },
    });
  }
  console.log(`✓ ${classes.length} clases creadas`);

  // ─── 6. PACKS ────────────────────────────────────────────────────────────
  console.log("\n📦 Creando packs...");
  for (const p of PACKS_DATA) {
    await prisma.pack.create({
      data: { ...p, gymId: GYM_ID, currency: "ARS", isActive: true },
    });
  }
  console.log(`✓ ${PACKS_DATA.length} packs`);

  // ─── 7. PAGOS & CRÉDITOS ─────────────────────────────────────────────────
  console.log("\n💳 Generando pagos y créditos...");
  const activeStudents = createdStudents.filter((s) => s.isActive);
  const payments = [];

  for (let i = 0; i < activeStudents.length; i++) {
    const student = activeStudents[i];
    // 70% de alumnos tienen al menos 1 pago
    if (Math.random() > 0.3) {
      const pack = pick(PACKS_DATA);
      const paidDaysAgo = randInt(1, DAYS_OF_HISTORY);
      const paidAt = dateDaysAgo(paidDaysAgo);
      paidAt.setHours(randInt(8, 22), randInt(0, 59), 0, 0);

      const payment = await prisma.payment.create({
        data: {
          gymId: GYM_ID,
          userId: student.id,
          packId: pack.id,
          creditsGranted: pack.credits,
          amountPaid: pack.price,
          currency: "ARS",
          provider: "MERCADOPAGO",
          method: pick(METHODS),
          status: "APPROVED",
          paidAt,
          expiresAt: new Date(paidAt.getTime() + pack.validityDays * 86400000),
        },
      });
      payments.push({ payment, pack, student });

      // Transacción de crédito PURCHASE
      await prisma.creditTransaction.create({
        data: {
          userId: student.id,
          gymId: GYM_ID,
          type: "PURCHASE",
          amount: pack.credits,
          paymentId: payment.id,
          expiresAt: payment.expiresAt,
        },
      });

      // Transacción financiera INCOME
      await prisma.gymTransaction.create({
        data: {
          gymId: GYM_ID,
          type: "INCOME",
          category: "Venta de abono",
          amount: pack.price,
          description: `${pack.name} — ${student.name}`,
          method: payment.method,
          userId: student.id,
          paymentId: payment.id,
          registeredBy: ADMIN_ID,
          date: paidAt,
        },
      });
    }
  }
  console.log(`✓ ${payments.length} pagos aprobados + créditos + ingresos`);

  // ─── 8. BALANCES DE CRÉDITO ──────────────────────────────────────────────
  console.log("\n💰 Calculando balances de crédito...");
  const creditTotals = new Map<string, number>();
  for (const { payment } of payments) {
    creditTotals.set(payment.userId, (creditTotals.get(payment.userId) || 0) + payment.creditsGranted);
  }

  for (const [userId, credits] of creditTotals) {
    await prisma.userCreditBalance.create({
      data: {
        userId,
        gymId: GYM_ID,
        availableCredits: credits,
        version: 1,
      },
    });
  }
  console.log(`✓ ${creditTotals.size} balances de crédito`);

  // ─── 9. BOOKINGS ─────────────────────────────────────────────────────────
  console.log(`\n📋 Generando bookings (${DAYS_OF_HISTORY} días pasados + ${DAYS_OF_FUTURE} días futuros)...`);
  const dayOrder = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as DayOfWeek[];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bookingsData: {
    id: string;
    userId: string;
    classId: string;
    classDate: Date;
    status: BookingStatus;
    cancelledAt?: Date;
  }[] = [];

  let bookingIdCounter = 1;

  for (let dayOffset = -DAYS_OF_FUTURE; dayOffset < DAYS_OF_HISTORY; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    const dow = dayOrder[date.getDay()];
    const isFuture = dayOffset < 0;

    const dayClasses = classes.filter((c) => c.dayOfWeek === dow);
    if (dayClasses.length === 0) continue;

    // TRACKING: alumnos que ya reservaron este día (máx 1 por día, como en la vida real)
    const studentsBookedToday = new Set<string>();

    // Ordenar clases: horarios pico primero (se llenan antes)
    const sortedClasses = [...dayClasses].sort((a, b) => {
      const aHour = parseInt(a.startTime.split(":")[0], 10);
      const bHour = parseInt(b.startTime.split(":")[0], 10);
      const aPeak = (aHour >= 6 && aHour <= 9) || (aHour >= 17 && aHour <= 20) ? 1 : 0;
      const bPeak = (bHour >= 6 && bHour <= 9) || (bHour >= 17 && bHour <= 20) ? 1 : 0;
      return bPeak - aPeak || aHour - bHour;
    });

    for (const cls of sortedClasses) {
      let baseOccupancy = 0.5;
      const hour = parseInt(cls.startTime.split(":")[0], 10);

      // Horarios pico tienen más demanda
      if (hour >= 6 && hour <= 9) baseOccupancy = 0.85;
      if (hour >= 17 && hour <= 20) baseOccupancy = 0.92;
      if (hour >= 10 && hour <= 16) baseOccupancy = 0.45;
      if (dow === "SATURDAY" || dow === "SUNDAY") baseOccupancy *= 0.6;
      if (dow === "FRIDAY" && hour >= 18) baseOccupancy *= 0.75;

      const targetBookings = Math.max(0, Math.round(cls.maxCapacity * baseOccupancy * (0.8 + Math.random() * 0.4)));

      // Alumnos elegibles: activos, que no reservaron hoy, y que no están excluidos aleatoriamente
      const eligibleStudents = activeStudents.filter((s) => {
        if (studentsBookedToday.has(s.id)) return false; // YA reservó hoy
        if (Math.random() > 0.82) return false; // 18% no van este día
        return true;
      });

      const shuffled = [...eligibleStudents].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(targetBookings, shuffled.length, cls.maxCapacity + 2));

      for (let i = 0; i < selected.length; i++) {
        const student = selected[i];
        studentsBookedToday.add(student.id); // Marcar como reservado hoy

        const isWaitlist = i >= cls.maxCapacity;

        // Fechas futuras: casi sin cancelaciones (todavía no pasaron)
        const cancelWeight = isFuture ? 2 : 18;
        const status: BookingStatus = isWaitlist ? "WAITLISTED" : pickWeighted([
          { value: "CONFIRMED" as BookingStatus, weight: 100 - cancelWeight },
          { value: "CANCELLED" as BookingStatus, weight: cancelWeight },
        ]);

        let cancelledAt: Date | undefined;
        if (status === "CANCELLED") {
          cancelledAt = new Date(date);
          cancelledAt.setHours(randInt(0, 23), randInt(0, 59), 0, 0);
        }

        bookingsData.push({
          id: cuid("booking", bookingIdCounter++),
          userId: student.id,
          classId: cls.id,
          classDate: new Date(date),
          status,
          cancelledAt,
        });
      }
    }
  }

  // Insertar bookings en batches para performance
  const BATCH = 500;
  for (let i = 0; i < bookingsData.length; i += BATCH) {
    const chunk = bookingsData.slice(i, i + BATCH);
    await prisma.booking.createMany({ data: chunk as any, skipDuplicates: true });
  }
  console.log(`✓ ${bookingsData.length} bookings insertados`);

  // ─── 10. TRANSACCIONES DE CRÉDITO (CONSUME / REFUND) ─────────────────────
  console.log("\n📊 Generando transacciones de consumo...");
  const confirmedBookings = bookingsData.filter((b) => b.status === "CONFIRMED");
  const cancelledBookings = bookingsData.filter((b) => b.status === "CANCELLED");

  let consumeCount = 0;
  let refundCount = 0;

  for (const b of confirmedBookings) {
    // Solo crear CONSUME para alumnos que tuvieron un pago
    const hasPayment = payments.some((p) => p.student.id === b.userId);
    if (hasPayment && Math.random() > 0.05) { // 95% de los confirmed tienen consume
      await prisma.creditTransaction.create({
        data: {
          userId: b.userId,
          gymId: GYM_ID,
          type: "CONSUME",
          amount: -1,
          bookingId: b.id,
        },
      });
      consumeCount++;
    }
  }

  for (const b of cancelledBookings) {
    const hasPayment = payments.some((p) => p.student.id === b.userId);
    if (hasPayment && Math.random() > 0.3) { // 70% de cancelaciones tienen refund
      await prisma.creditTransaction.create({
        data: {
          userId: b.userId,
          gymId: GYM_ID,
          type: "REFUND",
          amount: 1,
          bookingId: b.id,
        },
      });
      refundCount++;
    }
  }
  console.log(`✓ ${consumeCount} consumes, ${refundCount} refunds`);

  // ─── 11. EGRESOS DEL GYM ─────────────────────────────────────────────────
  console.log("\n📉 Generando egresos del gym...");
  const expenseCount = 40;
  for (let i = 0; i < expenseCount; i++) {
    const daysAgo = randInt(0, DAYS_OF_HISTORY);
    const date = dateDaysAgo(daysAgo);
    date.setHours(randInt(9, 18), randInt(0, 59), 0, 0);

    const category = pick(EXPENSE_CATS);
    const amount = category === "Sueldos"
      ? randInt(300000, 800000)
      : category === "Alquiler"
        ? randInt(400000, 900000)
        : category === "Servicios"
          ? randInt(25000, 120000)
          : randInt(15000, 80000);

    await prisma.gymTransaction.create({
      data: {
        gymId: GYM_ID,
        type: "EXPENSE",
        category,
        amount,
        description: `${category} — ${toISODate(date)}`,
        method: pick(METHODS),
        registeredBy: ADMIN_ID,
        date,
      },
    });
  }
  console.log(`✓ ${expenseCount} egresos`);

  // ─── 12. ALGUNOS ALUMNOS "EN RIESGO" ─────────────────────────────────────
  // Forzamos que ~6 alumnos activos no tengan bookings en los últimos 30 días
  const recentDate = new Date();
  recentDate.setDate(recentDate.getDate() - 30);

  const activeWithRecentBookings = await prisma.user.findMany({
    where: {
      gymId: GYM_ID,
      role: "STUDENT",
      isActive: true,
      bookings: {
        some: {
          classDate: { gte: recentDate },
          status: "CONFIRMED",
          deletedAt: null,
        },
      },
    },
    take: 6,
  });

  for (const student of activeWithRecentBookings) {
    await prisma.booking.deleteMany({
      where: {
        userId: student.id,
        classDate: { gte: recentDate },
        status: "CONFIRMED",
      },
    });
  }

  const atRiskCount = await prisma.user.count({
    where: {
      gymId: GYM_ID,
      role: "STUDENT",
      isActive: true,
      bookings: {
        none: {
          classDate: { gte: recentDate },
          status: "CONFIRMED",
          deletedAt: null,
        },
      },
    },
  });
  console.log(`\n⚠️ Alumnos en riesgo forzados: ${activeWithRecentBookings.length} → detectados: ${atRiskCount}`);

  // ─── RESUMEN ─────────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(50));
  console.log("🎉 SEED DE MÉTRICAS COMPLETADO");
  console.log("=".repeat(50));
  console.log(`Gym:           ${gym.name}`);
  console.log(`Disciplinas:   ${DISCIPLINES.length}`);
  console.log(`Coaches:       ${COACHES_DATA.length}`);
  console.log(`Alumnos:       ${createdStudents.length} (${createdStudents.filter((s) => !s.isActive).length} inactivos)`);
  console.log(`Clases:        ${classes.length} semanales`);
  console.log(`Pagos:         ${payments.length}`);
  console.log(`Bookings:      ${bookingsData.length}`);
  console.log(`  └─ Confirmed: ${bookingsData.filter((b) => b.status === "CONFIRMED").length}`);
  console.log(`  └─ Cancelled: ${bookingsData.filter((b) => b.status === "CANCELLED").length}`);
  console.log(`  └─ Waitlist:  ${bookingsData.filter((b) => b.status === "WAITLISTED").length}`);
  console.log(`Credit txs:    ${payments.length} PURCHASE + ${consumeCount} CONSUME + ${refundCount} REFUND`);
  console.log(`Finanzas:      ${payments.length} ingresos + ${expenseCount} egresos`);
  console.log(`Alumnos riesgo: ${atRiskCount}`);
  console.log("=".repeat(50));
  console.log("\n📊 Abrí http://localhost:3000/dashboard/admin/metrics para ver los datos.");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
