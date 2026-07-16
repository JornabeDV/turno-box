import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toClassDate } from "@/lib/utils";
import { AddCoachButton } from "@/components/admin/AddCoachButton";
import { MetricCard } from "@/components/admin/MetricCard";
import { CoachesListClient } from "./CoachesListClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Profesores" };

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lun",
  TUESDAY: "Mar",
  WEDNESDAY: "Mié",
  THURSDAY: "Jue",
  FRIDAY: "Vie",
  SATURDAY: "Sáb",
  SUNDAY: "Dom",
};
const DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export default async function CoachesPage() {
  const session = await auth();
  const user = session?.user as
    | { id?: string; role?: string; gymId?: string }
    | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const today = toClassDate(new Date());
  const dayOfWeek = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ][new Date().getDay()];

  const coaches = await prisma.user.findMany({
    where: { gymId: user.gymId, role: { in: ["COACH", "ADMIN"] } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      taughtClasses: {
        where: { deletedAt: null, isActive: true },
        select: {
          id: true,
          dayOfWeek: true,
          bookings: {
            where: { classDate: today, deletedAt: null, status: "CONFIRMED" },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Clases puntuales (overrides) futuras asignadas a cada coach
  const upcomingOverrides = await prisma.classOverride.findMany({
    where: {
      date: { gte: today },
      isCancelled: false,
      coachId: { in: coaches.map((c) => c.id) },
    },
    select: { coachId: true, date: true },
  });

  const overridesByCoach = upcomingOverrides.reduce<Record<string, number>>(
    (acc, o) => {
      if (!o.coachId) return acc;
      acc[o.coachId] = (acc[o.coachId] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const todayOverrideCoachIds = new Set(
    upcomingOverrides
      .filter((o) => o.coachId && o.date.getTime() === today.getTime())
      .map((o) => o.coachId as string),
  );

  const active = coaches.filter((c) => c.isActive).length;
  const teachingToday = coaches.filter(
    (c) =>
      c.taughtClasses.some((cls) => cls.dayOfWeek === dayOfWeek) ||
      todayOverrideCoachIds.has(c.id),
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs md:text-sm text-secondary uppercase tracking-wider mb-0.5">
            Admin
          </p>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary tracking-tight">
            Profesores
          </h2>
        </div>
        <AddCoachButton />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Total" value={coaches.length} icon="users" />
        <MetricCard
          label="Activos"
          value={active}
          icon="check"
          accent="emerald"
        />
        <MetricCard
          label="Dan clases hoy"
          value={teachingToday}
          icon="calendar"
          accent="orange"
        />
      </div>

      {coaches.length === 0 ? (
        <div className="bg-card border border-border px-4 py-16 text-center">
          <p className="text-sm md:text-base text-secondary">No hay profesores registrados.</p>
        </div>
      ) : (
        <CoachesListClient
          dayOfWeek={dayOfWeek}
          coaches={coaches.map((coach) => ({
            id: coach.id,
            name: coach.name,
            email: coach.email,
            role: coach.role,
            isActive: coach.isActive,
            classCount: coach.taughtClasses.length,
            overrideCount: overridesByCoach[coach.id] ?? 0,
            todayAttendees: coach.taughtClasses
              .filter((cls) => cls.dayOfWeek === dayOfWeek)
              .reduce((acc, cls) => acc + cls.bookings.length, 0),
            teachingDays: [
              ...new Set(coach.taughtClasses.map((c) => c.dayOfWeek)),
            ].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)),
          }))}
        />
      )}
    </div>
  );
}
