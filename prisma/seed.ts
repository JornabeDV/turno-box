// Seed inicial — crea un gym demo con admin, coaches y clases
// Ejecutar: npm run db:seed
// Prisma v7: requiere adapter Neon para conectar
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
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

  // Alumno
  const studentHash = await bcrypt.hash("alumno123", 12);
  await prisma.user.upsert({
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

  // Clases de la semana
  const classes = [
    { name: "CrossFit WOD", dayOfWeek: "MONDAY",    startTime: "07:00", endTime: "08:00", maxCapacity: 12, color: "#f97316" },
    { name: "CrossFit WOD", dayOfWeek: "MONDAY",    startTime: "18:00", endTime: "19:00", maxCapacity: 15, color: "#f97316" },
    { name: "Weightlifting", dayOfWeek: "MONDAY",   startTime: "19:30", endTime: "21:00", maxCapacity: 8,  color: "#10b981" },
    { name: "CrossFit WOD", dayOfWeek: "TUESDAY",   startTime: "07:00", endTime: "08:00", maxCapacity: 12, color: "#f97316" },
    { name: "Open Box",     dayOfWeek: "TUESDAY",   startTime: "10:00", endTime: "12:00", maxCapacity: 20, color: "#3b82f6" },
    { name: "CrossFit WOD", dayOfWeek: "WEDNESDAY", startTime: "07:00", endTime: "08:00", maxCapacity: 12, color: "#f97316" },
    { name: "CrossFit WOD", dayOfWeek: "WEDNESDAY", startTime: "18:00", endTime: "19:00", maxCapacity: 15, color: "#f97316" },
    { name: "CrossFit WOD", dayOfWeek: "THURSDAY",  startTime: "07:00", endTime: "08:00", maxCapacity: 12, color: "#f97316" },
    { name: "Mobility",     dayOfWeek: "THURSDAY",  startTime: "19:30", endTime: "20:30", maxCapacity: 10, color: "#8b5cf6" },
    { name: "CrossFit WOD", dayOfWeek: "FRIDAY",    startTime: "07:00", endTime: "08:00", maxCapacity: 12, color: "#f97316" },
    { name: "CrossFit WOD", dayOfWeek: "FRIDAY",    startTime: "18:00", endTime: "19:00", maxCapacity: 15, color: "#f97316" },
    { name: "Open Box",     dayOfWeek: "SATURDAY",  startTime: "09:00", endTime: "11:00", maxCapacity: 25, color: "#3b82f6" },
  ] as const;

  for (const c of classes) {
    await prisma.gymClass.create({
      data: { ...c, gymId: gym.id, coachId: coach.id },
    });
  }

  console.log("✓ Seed completado");
  console.log(`  Admin:   admin@crossfit.demo / admin123`);
  console.log(`  Coach:   coach@crossfit.demo / coach123`);
  console.log(`  Alumno:  alumno@crossfit.demo / alumno123`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
