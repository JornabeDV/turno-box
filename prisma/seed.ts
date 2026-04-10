// Seed inicial — crea un gym demo con admin, coaches y clases
// Ejecutar: npx tsx prisma/seed.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL!;
const adapter = new PrismaPg(url);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Gym
  const gym = await prisma.gym.upsert({
    where: { slug: "crossfit-demo" },
    update: {},
    create: {
      name: "CrossFit Demo",
      slug: "crossfit-demo",
      address: "Av. Siempreviva 742, Buenos Aires",
      phone: "+54 11 1234-5678",
      timezone: "America/Argentina/Buenos_Aires",
    },
  });
  console.log("✓ Gym:", gym.name);

  // Disciplinas
  const disciplines = await Promise.all([
    prisma.discipline.upsert({
      where: { id: `disc-crossfit-${gym.id}` },
      update: {},
      create: { id: `disc-crossfit-${gym.id}`, name: "CrossFit", color: "#f97316", gymId: gym.id },
    }),
    prisma.discipline.upsert({
      where: { id: `disc-weightlifting-${gym.id}` },
      update: {},
      create: { id: `disc-weightlifting-${gym.id}`, name: "Weightlifting", color: "#10b981", gymId: gym.id },
    }),
    prisma.discipline.upsert({
      where: { id: `disc-openbox-${gym.id}` },
      update: {},
      create: { id: `disc-openbox-${gym.id}`, name: "Open Box", color: "#3b82f6", gymId: gym.id },
    }),
    prisma.discipline.upsert({
      where: { id: `disc-mobility-${gym.id}` },
      update: {},
      create: { id: `disc-mobility-${gym.id}`, name: "Mobility", color: "#8b5cf6", gymId: gym.id },
    }),
  ]);
  console.log("✓ Disciplines:", disciplines.map(d => d.name).join(", "));

  // Admin
  const adminHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@crossfit.demo" },
    update: {},
    create: {
      name: "Admin Demo",
      email: "admin@crossfit.demo",
      passwordHash: adminHash,
      role: "ADMIN",
      gymId: gym.id,
      emailVerified: new Date(),
    },
  });
  console.log("✓ Admin:", admin.email);

  // Coach
  const coachHash = await bcrypt.hash("coach123", 12);
  const coach = await prisma.user.upsert({
    where: { email: "coach@crossfit.demo" },
    update: {},
    create: {
      name: "Lucas Pérez",
      email: "coach@crossfit.demo",
      passwordHash: coachHash,
      role: "COACH",
      gymId: gym.id,
      emailVerified: new Date(),
    },
  });
  console.log("✓ Coach:", coach.email);

  // Alumno
  const studentHash = await bcrypt.hash("alumno123", 12);
  const student = await prisma.user.upsert({
    where: { email: "alumno@crossfit.demo" },
    update: {},
    create: {
      name: "María González",
      email: "alumno@crossfit.demo",
      passwordHash: studentHash,
      role: "STUDENT",
      gymId: gym.id,
      emailVerified: new Date(),
    },
  });
  console.log("✓ Student:", student.email);

  // Clases de la semana
  const classes = [
    { disciplineId: disciplines[0].id, dayOfWeek: "MONDAY",    startTime: "07:00", endTime: "08:00", maxCapacity: 12, color: "#f97316" },
    { disciplineId: disciplines[0].id, dayOfWeek: "MONDAY",    startTime: "18:00", endTime: "19:00", maxCapacity: 15, color: "#f97316" },
    { disciplineId: disciplines[1].id, dayOfWeek: "MONDAY",    startTime: "19:30", endTime: "21:00", maxCapacity: 8,  color: "#10b981" },
    { disciplineId: disciplines[0].id, dayOfWeek: "TUESDAY",   startTime: "07:00", endTime: "08:00", maxCapacity: 12, color: "#f97316" },
    { disciplineId: disciplines[2].id, dayOfWeek: "TUESDAY",   startTime: "10:00", endTime: "12:00", maxCapacity: 20, color: "#3b82f6" },
    { disciplineId: disciplines[0].id, dayOfWeek: "WEDNESDAY", startTime: "07:00", endTime: "08:00", maxCapacity: 12, color: "#f97316" },
    { disciplineId: disciplines[0].id, dayOfWeek: "WEDNESDAY", startTime: "18:00", endTime: "19:00", maxCapacity: 15, color: "#f97316" },
    { disciplineId: disciplines[0].id, dayOfWeek: "THURSDAY",  startTime: "07:00", endTime: "08:00", maxCapacity: 12, color: "#f97316" },
    { disciplineId: disciplines[3].id, dayOfWeek: "THURSDAY",  startTime: "19:30", endTime: "20:30", maxCapacity: 10, color: "#8b5cf6" },
    { disciplineId: disciplines[0].id, dayOfWeek: "FRIDAY",    startTime: "07:00", endTime: "08:00", maxCapacity: 12, color: "#f97316" },
    { disciplineId: disciplines[0].id, dayOfWeek: "FRIDAY",    startTime: "18:00", endTime: "19:00", maxCapacity: 15, color: "#f97316" },
    { disciplineId: disciplines[2].id, dayOfWeek: "SATURDAY",  startTime: "09:00", endTime: "11:00", maxCapacity: 25, color: "#3b82f6" },
  ] as const;

  for (const c of classes) {
    await prisma.gymClass.create({
      data: { ...c, gymId: gym.id, coachId: coach.id },
    });
  }
  console.log(`✓ ${classes.length} classes created`);

  // Packs
  const packDefs = [
    { name: "Pack 8 clases",  credits: 8,  price: 14000, sortOrder: 0, validityDays: 30 },
    { name: "Pack 12 clases", credits: 12, price: 19000, sortOrder: 1, validityDays: 45 },
    { name: "Pack 16 clases", credits: 16, price: 24000, sortOrder: 2, validityDays: 60 },
  ];

  for (const p of packDefs) {
    await prisma.pack.upsert({
      where: { id: `pack-${p.credits}-${gym.id}` },
      update: { price: p.price, validityDays: p.validityDays },
      create: { id: `pack-${p.credits}-${gym.id}`, gymId: gym.id, ...p },
    });
  }
  console.log("✓ Packs created");

  // Créditos demo para el alumno
  await prisma.userCreditBalance.upsert({
    where: { userId_gymId: { userId: student.id, gymId: gym.id } },
    update: { availableCredits: 10 },
    create: { userId: student.id, gymId: gym.id, availableCredits: 10 },
  });
  console.log("✓ Demo credits: 10");

  console.log("\n✓ Seed completado!");
  console.log("  Admin:   admin@crossfit.demo / admin123");
  console.log("  Coach:   coach@crossfit.demo / coach123");
  console.log("  Alumno:  alumno@crossfit.demo / alumno123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());