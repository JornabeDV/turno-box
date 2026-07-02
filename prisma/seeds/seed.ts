// Seed completo de desarrollo — CrossFit Turnos
// Ejecutar: npx prisma db seed   o   npx tsx prisma/seed.ts
//
// Credenciales de demo:
//   admin@crossfit.demo   / admin123
//   coach@crossfit.demo   / coach123
//   alumno1@crossfit.demo / alumno123
//   ... alumno12@crossfit.demo / alumno123

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL!;
const adapter = new PrismaPg(url);
const prisma = new PrismaClient({ adapter });

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const hash = (pwd: string) => bcrypt.hash(pwd, 12);

const DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

type DayOfWeek = (typeof DAY_ORDER)[number];

function getDayIndex(day: DayOfWeek) {
  return DAY_ORDER.indexOf(day);
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  result.setHours(0, 0, 0, 0);
  return result;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getClassDate(weekStart: Date, dayOfWeek: DayOfWeek, weekOffset = 0) {
  return addDays(weekStart, getDayIndex(dayOfWeek) + weekOffset * 7);
}

function futureDate(daysFromNow: number) {
  return addDays(new Date(), daysFromNow);
}

function toMidnightUTC(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database...\n");

  // ─── GYM ───────────────────────────────────────────────────────────────────
  const gym = await prisma.gym.upsert({
    where: { slug: "crossfit-demo" },
    update: {},
    create: {
      id: "gym-demo-001",
      name: "CrossFit Demo Box",
      slug: "crossfit-demo",
      address: "Av. Siempreviva 742, Buenos Aires",
      phone: "+54 11 1234-5678",
      timezone: "America/Argentina/Buenos_Aires",
      cancelWindowHours: 2,
      waitlistEnabled: true,
    },
  });
  console.log("✅ Gym:", gym.name);

  // ─── DISCIPLINAS ───────────────────────────────────────────────────────────
  const disciplineData = [
    { key: "crossfit", name: "CrossFit", color: "#f97316" },
    { key: "weightlifting", name: "Weightlifting", color: "#10b981" },
    { key: "openbox", name: "Open Box", color: "#3b82f6" },
    { key: "mobility", name: "Mobility", color: "#8b5cf6" },
    { key: "gymnastics", name: "Gymnastics", color: "#ec4899" },
  ];

  const disciplines: Record<string, { id: string; name: string; color: string | null }> = {};
  for (const d of disciplineData) {
    const id = `disc-${d.key}-${gym.id}`;
    const disc = await prisma.discipline.upsert({
      where: { id },
      update: {},
      create: { id, name: d.name, color: d.color, gymId: gym.id },
    });
    disciplines[d.key] = disc;
  }
  console.log("✅ Disciplines:", Object.values(disciplines).map((d) => d.name).join(", "));

  // ─── USUARIOS ──────────────────────────────────────────────────────────────
  const adminPwd = await hash("admin123");
  const coachPwd = await hash("coach123");
  const studentPwd = await hash("alumno123");

  const admin = await prisma.user.upsert({
    where: { email: "admin@crossfit.demo" },
    update: {},
    create: {
      id: "user-admin-001",
      name: "Admin Demo",
      email: "admin@crossfit.demo",
      passwordHash: adminPwd,
      role: "ADMIN",
      gymId: gym.id,
      emailVerified: new Date(),
      isActive: true,
      phone: "+54 11 1111-2222",
      gender: "MALE",
    },
  });

  const coach1 = await prisma.user.upsert({
    where: { email: "coach@crossfit.demo" },
    update: {},
    create: {
      id: "user-coach-001",
      name: "Lucas Pérez",
      email: "coach@crossfit.demo",
      passwordHash: coachPwd,
      role: "COACH",
      gymId: gym.id,
      emailVerified: new Date(),
      isActive: true,
      phone: "+54 11 3333-4444",
      gender: "MALE",
    },
  });

  const coach2 = await prisma.user.upsert({
    where: { email: "coach2@crossfit.demo" },
    update: {},
    create: {
      id: "user-coach-002",
      name: "Sofía Martínez",
      email: "coach2@crossfit.demo",
      passwordHash: coachPwd,
      role: "COACH",
      gymId: gym.id,
      emailVerified: new Date(),
      isActive: true,
      phone: "+54 11 5555-6666",
      gender: "FEMALE",
    },
  });

  const studentNames = [
    { n: 1, name: "María González", gender: "FEMALE" },
    { n: 2, name: "Juan Rodríguez", gender: "MALE" },
    { n: 3, name: "Ana López", gender: "FEMALE" },
    { n: 4, name: "Carlos Fernández", gender: "MALE" },
    { n: 5, name: "Valentina Torres", gender: "FEMALE" },
    { n: 6, name: "Martín Silva", gender: "MALE" },
    { n: 7, name: "Camila Ruiz", gender: "FEMALE" },
    { n: 8, name: "Diego Vargas", gender: "MALE" },
    { n: 9, name: "Florencia Soto", gender: "FEMALE" },
    { n: 10, name: "Andrés Castro", gender: "MALE" },
    { n: 11, name: "Julieta Morales", gender: "FEMALE" },
    { n: 12, name: "Nicolás Herrera", gender: "MALE" },
  ] as const;

  const students: { id: string; name: string; email: string }[] = [];
  for (const s of studentNames) {
    const email = `alumno${s.n}@crossfit.demo`;
    const id = `user-student-${String(s.n).padStart(3, "0")}`;
    const student = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id,
        name: s.name,
        email,
        passwordHash: studentPwd,
        role: "STUDENT",
        gymId: gym.id,
        emailVerified: new Date(),
        isActive: true,
        phone: `+54 11 7000-${String(s.n).padStart(4, "0")}`,
        gender: s.gender as any,
        birthDate: new Date(1990 + (s.n % 15), (s.n + 2) % 12, 10 + (s.n % 15)),
      },
    });
    students.push(student);
  }
  console.log("✅ Users:", 1, "admin +", 2, "coaches +", students.length, "students");

  // ─── CLASES TEMPLATE ───────────────────────────────────────────────────────
  const classTemplates = [
    { dayOfWeek: "MONDAY" as DayOfWeek, startTime: "07:00", endTime: "08:00", discipline: "crossfit", maxCapacity: 12, coachId: coach1.id },
    { dayOfWeek: "MONDAY", startTime: "09:00", endTime: "10:00", discipline: "crossfit", maxCapacity: 12, coachId: coach2.id },
    { dayOfWeek: "MONDAY", startTime: "18:00", endTime: "19:00", discipline: "crossfit", maxCapacity: 15, coachId: coach1.id },
    { dayOfWeek: "MONDAY", startTime: "19:30", endTime: "21:00", discipline: "weightlifting", maxCapacity: 8, coachId: coach1.id },

    { dayOfWeek: "TUESDAY", startTime: "07:00", endTime: "08:00", discipline: "crossfit", maxCapacity: 12, coachId: coach1.id },
    { dayOfWeek: "TUESDAY", startTime: "10:00", endTime: "12:00", discipline: "openbox", maxCapacity: 20, coachId: coach2.id },
    { dayOfWeek: "TUESDAY", startTime: "18:00", endTime: "19:00", discipline: "gymnastics", maxCapacity: 10, coachId: coach2.id },
    { dayOfWeek: "TUESDAY", startTime: "20:00", endTime: "21:00", discipline: "mobility", maxCapacity: 15, coachId: coach2.id },

    { dayOfWeek: "WEDNESDAY", startTime: "07:00", endTime: "08:00", discipline: "crossfit", maxCapacity: 12, coachId: coach1.id },
    { dayOfWeek: "WEDNESDAY", startTime: "18:00", endTime: "19:00", discipline: "crossfit", maxCapacity: 15, coachId: coach1.id },
    { dayOfWeek: "WEDNESDAY", startTime: "19:30", endTime: "21:00", discipline: "weightlifting", maxCapacity: 8, coachId: coach1.id },

    { dayOfWeek: "THURSDAY", startTime: "07:00", endTime: "08:00", discipline: "crossfit", maxCapacity: 12, coachId: coach2.id },
    { dayOfWeek: "THURSDAY", startTime: "10:00", endTime: "12:00", discipline: "openbox", maxCapacity: 20, coachId: coach2.id },
    { dayOfWeek: "THURSDAY", startTime: "19:30", endTime: "20:30", discipline: "mobility", maxCapacity: 10, coachId: coach2.id },

    { dayOfWeek: "FRIDAY", startTime: "07:00", endTime: "08:00", discipline: "crossfit", maxCapacity: 12, coachId: coach1.id },
    { dayOfWeek: "FRIDAY", startTime: "09:00", endTime: "10:00", discipline: "crossfit", maxCapacity: 12, coachId: coach2.id },
    { dayOfWeek: "FRIDAY", startTime: "18:00", endTime: "19:00", discipline: "crossfit", maxCapacity: 15, coachId: coach1.id },

    { dayOfWeek: "SATURDAY", startTime: "09:00", endTime: "11:00", discipline: "openbox", maxCapacity: 25, coachId: coach2.id },
    { dayOfWeek: "SATURDAY", startTime: "11:30", endTime: "12:30", discipline: "crossfit", maxCapacity: 20, coachId: coach1.id },
  ] as const;

  const createdClasses: { id: string; dayOfWeek: DayOfWeek; startTime: string; maxCapacity: number }[] = [];
  for (let i = 0; i < classTemplates.length; i++) {
    const ct = classTemplates[i];
    const id = `gymclass-${String(i + 1).padStart(3, "0")}-${gym.id}`;
    const cls = await prisma.gymClass.upsert({
      where: { id },
      update: {},
      create: {
        id,
        description: `${disciplines[ct.discipline].name} — ${ct.startTime} hs`,
        dayOfWeek: ct.dayOfWeek as any,
        startTime: ct.startTime,
        endTime: ct.endTime,
        maxCapacity: ct.maxCapacity,
        color: disciplines[ct.discipline].color,
        isActive: true,
        gymId: gym.id,
        coachId: ct.coachId,
        disciplineId: disciplines[ct.discipline].id,
      },
    });
    createdClasses.push({ id: cls.id, dayOfWeek: ct.dayOfWeek, startTime: ct.startTime, maxCapacity: ct.maxCapacity });
  }
  console.log("✅ Classes:", createdClasses.length, "templates");

  // ─── PACKS ─────────────────────────────────────────────────────────────────
  const packDefs = [
    { key: "pack-8", name: "Pack 8 clases", credits: 8, price: 14000, validityDays: 30, sortOrder: 0 },
    { key: "pack-12", name: "Pack 12 clases", credits: 12, price: 19000, validityDays: 45, sortOrder: 1 },
    { key: "pack-16", name: "Pack 16 clases", credits: 16, price: 24000, validityDays: 60, sortOrder: 2 },
    { key: "pack-20", name: "Pack 20 clases", credits: 20, price: 28000, validityDays: 90, sortOrder: 3 },
  ];

  const packs: { id: string; credits: number; price: number }[] = [];
  for (const p of packDefs) {
    const id = `${p.key}-${gym.id}`;
    const pack = await prisma.pack.upsert({
      where: { id },
      update: {},
      create: {
        id,
        gymId: gym.id,
        name: p.name,
        credits: p.credits,
        price: p.price,
        currency: "ARS",
        validityDays: p.validityDays,
        isActive: true,
        sortOrder: p.sortOrder,
      },
    });
    packs.push({ id: pack.id, credits: pack.credits, price: Number(pack.price) });
  }
  console.log("✅ Packs:", packs.length);

  // ─── PAGOS + CRÉDITOS ──────────────────────────────────────────────────────
  // Alumnos 1-8 tienen packs comprados y aprobados con créditos activos
  const creditUsers = students.slice(0, 8);
  for (let i = 0; i < creditUsers.length; i++) {
    const student = creditUsers[i];
    const pack = packs[i % packs.length];
    const paymentId = `payment-${student.id}-${pack.id}`;
    const expiresAt = futureDate(pack.credits * 3 + 5);

    await prisma.payment.upsert({
      where: { id: paymentId },
      update: {},
      create: {
        id: paymentId,
        gymId: gym.id,
        userId: student.id,
        packId: pack.id,
        creditsGranted: pack.credits,
        amountPaid: pack.price,
        currency: "ARS",
        provider: "MERCADOPAGO",
        method: "TARJETA",
        providerPaymentId: `mp-payment-${i + 1000}`,
        providerOrderId: `mp-order-${i + 1000}`,
        status: "APPROVED",
        expiresAt,
        paidAt: new Date(),
      },
    });

    // Balance materializado
    await prisma.userCreditBalance.upsert({
      where: { userId_gymId: { userId: student.id, gymId: gym.id } },
      update: { availableCredits: pack.credits },
      create: { userId: student.id, gymId: gym.id, availableCredits: pack.credits },
    });

    // Transacción de compra
    await prisma.creditTransaction.upsert({
      where: { id: `ctx-purchase-${paymentId}` },
      update: {},
      create: {
        id: `ctx-purchase-${paymentId}`,
        userId: student.id,
        gymId: gym.id,
        type: "PURCHASE",
        amount: pack.credits,
        paymentId,
        expiresAt,
      },
    });

    // Movimiento contable del gym
    await prisma.gymTransaction.upsert({
      where: { id: `gtx-${paymentId}` },
      update: {},
      create: {
        id: `gtx-${paymentId}`,
        gymId: gym.id,
        type: "INCOME",
        category: "PACK_SALE",
        amount: pack.price,
        description: `Venta ${pack.name} — ${student.name}`,
        method: "TARJETA",
        userId: student.id,
        paymentId,
        registeredBy: admin.id,
        date: new Date(),
      },
    });
  }
  console.log("✅ Payments + credits + gym transactions for", creditUsers.length, "students");

  // ─── RESERVAS ──────────────────────────────────────────────────────────────
  // Fechas base: esta semana y próxima semana
  const thisWeekStart = startOfWeek(new Date());
  const nextWeekStart = addDays(thisWeekStart, 7);

  const bookingPlan: { studentIdx: number; classIdx: number; weekOffset: number; status: "CONFIRMED" | "CANCELLED" | "WAITLISTED"; waitlistPos?: number }[] = [];

  // Alumnos 1-5: reservas confirmadas esta semana
  for (let s = 0; s < 5; s++) {
    for (let c = 0; c < 4; c++) {
      bookingPlan.push({ studentIdx: s, classIdx: (s + c) % createdClasses.length, weekOffset: 0, status: "CONFIRMED" });
    }
  }

  // Alumnos 6-8: algunas canceladas y en lista de espera
  for (let s = 5; s < 8; s++) {
    for (let c = 0; c < 3; c++) {
      const status = c === 0 ? "CANCELLED" : c === 1 ? "WAITLISTED" : "CONFIRMED";
      bookingPlan.push({
        studentIdx: s,
        classIdx: (s * 3 + c) % createdClasses.length,
        weekOffset: 0,
        status,
        waitlistPos: status === "WAITLISTED" ? 1 : undefined,
      });
    }
  }

  // Alumnos 9-12: reservas para la próxima semana
  for (let s = 8; s < 12; s++) {
    for (let c = 0; c < 3; c++) {
      bookingPlan.push({ studentIdx: s, classIdx: (s + c * 2) % createdClasses.length, weekOffset: 1, status: "CONFIRMED" });
    }
  }

  let confirmedCount = 0;
  let cancelledCount = 0;
  let waitlistedCount = 0;

  for (const b of bookingPlan) {
    const student = students[b.studentIdx];
    const cls = createdClasses[b.classIdx];
    const classDateRaw = getClassDate(b.weekOffset === 0 ? thisWeekStart : nextWeekStart, cls.dayOfWeek);
    const classDate = toMidnightUTC(classDateRaw);
    const bookingId = `booking-${student.id}-${cls.id}-${classDate.toISOString().split("T")[0]}`;

    const booking = await prisma.booking.upsert({
      where: { id: bookingId },
      update: {},
      create: {
        id: bookingId,
        status: b.status,
        classDate,
        waitlistPos: b.waitlistPos ?? null,
        cancelledAt: b.status === "CANCELLED" ? new Date() : null,
        userId: student.id,
        classId: cls.id,
      },
    });

    if (b.status === "CONFIRMED") {
      confirmedCount++;
      // Consumir 1 crédito si el alumno tiene balance
      const balance = await prisma.userCreditBalance.findUnique({
        where: { userId_gymId: { userId: student.id, gymId: gym.id } },
      });
      if (balance && balance.availableCredits > 0) {
        await prisma.userCreditBalance.update({
          where: { id: balance.id },
          data: { availableCredits: { decrement: 1 }, version: { increment: 1 } },
        });
        await prisma.creditTransaction.create({
          data: {
            userId: student.id,
            gymId: gym.id,
            type: "CONSUME",
            amount: -1,
            bookingId: booking.id,
          },
        });
      }
    } else if (b.status === "CANCELLED") {
      cancelledCount++;
      // Reembolsar crédito
      await prisma.userCreditBalance.upsert({
        where: { userId_gymId: { userId: student.id, gymId: gym.id } },
        update: { availableCredits: { increment: 1 }, version: { increment: 1 } },
        create: { userId: student.id, gymId: gym.id, availableCredits: 1 },
      });
      await prisma.creditTransaction.create({
        data: {
          userId: student.id,
          gymId: gym.id,
          type: "REFUND",
          amount: 1,
          bookingId: booking.id,
        },
      });
    } else {
      waitlistedCount++;
    }
  }
  console.log(
    "✅ Bookings:",
    confirmedCount,
    "confirmed +",
    cancelledCount,
    "cancelled +",
    waitlistedCount,
    "waitlisted"
  );

  // ─── ANUNCIOS ──────────────────────────────────────────────────────────────
  const announcements = [
    {
      id: "ann-001",
      title: "Nuevos horarios de verano",
      body: "A partir del lunes 15/01 sumamos clases a las 9:00 y 20:00. Reservá tu lugar.",
      pinned: true,
    },
    {
      id: "ann-002",
      title: "Recordatorio: ventana de cancelación",
      body: "Recordá que podés cancelar tu turno hasta 2 horas antes para recuperar tu crédito.",
      pinned: false,
    },
    {
      id: "ann-003",
      title: "Pack promocional de verano",
      body: "Aprovechá el Pack 20 clases con 15% de descuento durante todo enero.",
      pinned: false,
      expiresAt: futureDate(30),
    },
  ];

  for (const a of announcements) {
    await prisma.announcement.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        gymId: gym.id,
        title: a.title,
        body: a.body,
        pinned: a.pinned,
        expiresAt: a.expiresAt ?? null,
      },
    });
  }
  console.log("✅ Announcements:", announcements.length);

  // ─── CIERRES DEL GYM ───────────────────────────────────────────────────────
  const closureDate = toMidnightUTC(futureDate(14)); // dentro de 2 semanas
  await prisma.gymClosure.upsert({
    where: { id: "closure-001" },
    update: {},
    create: {
      id: "closure-001",
      gymId: gym.id,
      date: closureDate,
      reason: "Feriado nacional — El box permanecerá cerrado.",
    },
  });
  console.log("✅ Gym closure:", closureDate.toISOString().split("T")[0]);

  // ─── OVERRIDE DE CLASE ─────────────────────────────────────────────────────
  const overrideClass = createdClasses.find((c) => c.dayOfWeek === "FRIDAY" && c.startTime === "18:00")!;
  const overrideDate = toMidnightUTC(getClassDate(thisWeekStart, "FRIDAY"));
  await prisma.classOverride.upsert({
    where: { id: "override-001" },
    update: {},
    create: {
      id: "override-001",
      gymClassId: overrideClass.id,
      date: overrideDate,
      isCancelled: false,
      startTime: "17:30",
      endTime: "18:30",
      maxCapacity: 20,
      description: "Clase especial de despedida de año — horario extendido.",
      coachId: coach2.id,
      disciplineId: disciplines["crossfit"].id,
    },
  });
  console.log("✅ Class override:", overrideDate.toISOString().split("T")[0]);

  // ─── CREDIT FREEZE ─────────────────────────────────────────────────────────
  await prisma.creditFreeze.upsert({
    where: { id: "freeze-001" },
    update: {},
    create: {
      id: "freeze-001",
      gymId: gym.id,
      userId: students[0].id,
      startedAt: new Date(),
      endedAt: null,
      reason: "Pausa por lesión — se congelan vencimientos de créditos.",
      createdBy: admin.id,
      paymentSnapshots: {},
    },
  });
  console.log("✅ Credit freeze for", students[0].name);

  // ─── RESUMEN FINAL ─────────────────────────────────────────────────────────
  console.log("\n🎉 Seed completado!");
  console.log("──────────────────────────────────────────");
  console.log("Gym:      ", gym.name, `(slug: ${gym.slug})`);
  console.log("Admin:    admin@crossfit.demo / admin123");
  console.log("Coach 1:  coach@crossfit.demo / coach123");
  console.log("Coach 2:  coach2@crossfit.demo / coach123");
  console.log("Alumnos:  alumno1@crossfit.demo ... alumno12@crossfit.demo / alumno123");
  console.log("──────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
