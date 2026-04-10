import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MetricCard } from "@/components/admin/MetricCard";
import { TodayClassesTable } from "@/components/admin/TodayClassesTable";
import { TodayPaymentsTable } from "@/components/admin/TodayPaymentsTable";
import { UpcomingBirthdays } from "@/components/admin/UpcomingBirthdays";
import { toClassDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard Admin" };

/** Días hasta el próximo cumpleaños (0 = hoy, ≤30). */
function daysUntilBirthday(birthDate: Date, today: Date): number {
  const thisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
  return Math.round((thisYear.getTime() - today.getTime()) / 86_400_000);
}

export default async function AdminDashboardPage() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;

  if (!user?.id || user.role !== "ADMIN") redirect("/");

  const gymId = user.gymId;
  if (!gymId) redirect("/");

  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tomorrowMidnight = new Date(todayMidnight.getTime() + 86_400_000);
  const classDate = toClassDate(today);
  const dayOfWeek = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"][today.getDay()];

  const [classesToday, paymentsToday, usersWithBirthday] = await Promise.all([
    // Clases de hoy con sus bookings
    prisma.gymClass.findMany({
      where: { gymId, isActive: true, deletedAt: null, dayOfWeek: dayOfWeek as never },
      select: {
        id: true,
        startTime: true,
        maxCapacity: true,
        color: true,
        coach: { select: { name: true } },
        discipline: { select: { name: true } },
        bookings: {
          where: { classDate, deletedAt: null },
          select: { status: true },
        },
      },
      orderBy: { startTime: "asc" },
    }),

    // Pagos aprobados hoy
    prisma.payment.findMany({
      where: {
        gymId,
        status: "APPROVED",
        paidAt: { gte: todayMidnight, lt: tomorrowMidnight },
      },
      select: {
        id: true,
        expiresAt: true,
        user: { select: { name: true, email: true } },
        pack: { select: { name: true } },
      },
      orderBy: { paidAt: "desc" },
    }),

    // Alumnos activos con fecha de nacimiento
    prisma.user.findMany({
      where: { gymId, role: "STUDENT", isActive: true, birthDate: { not: null } },
      select: { id: true, name: true, email: true, birthDate: true },
    }),
  ]);

  const classesTodayWithName = classesToday.map((c) => ({
    ...c,
    name: c.discipline?.name ?? "Sin disciplina",
  }));

  // Métricas
  const totalConfirmed = classesTodayWithName.reduce(
    (acc: number, c) => acc + c.bookings.filter((b: { status: string }) => b.status === "CONFIRMED").length,
    0
  );
  const totalCapacity = classesToday.reduce((acc: number, c) => acc + c.maxCapacity, 0);
  const [totalCancelled, activeStudents] = await Promise.all([
    prisma.booking.count({
      where: { class: { gymId }, classDate, status: "CANCELLED" },
    }),
    prisma.user.count({
      where: { gymId, role: "STUDENT", isActive: true },
    }),
  ]);

  const occupancyRate = totalCapacity > 0
    ? Math.round((totalConfirmed / totalCapacity) * 100)
    : 0;

  // Próximos cumpleaños (30 días)
  const upcomingBirthdays = usersWithBirthday
    .map((u) => ({ ...u, birthDate: u.birthDate!, daysUntil: daysUntilBirthday(u.birthDate!, todayMidnight) }))
    .filter((u) => u.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Hoy</p>
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Dashboard</h2>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Clases hoy" value={classesToday.length} icon="calendar" />
        <MetricCard label="Confirmados" value={totalConfirmed} icon="check" accent="emerald" />
        <MetricCard
          label="Ocupación"
          value={`${occupancyRate}%`}
          icon="chart"
          accent={occupancyRate > 80 ? "orange" : "zinc"}
        />
        <MetricCard label="Cancelaciones" value={totalCancelled} icon="x" accent="rose" />
      </div>

      <MetricCard label="Alumnos activos" value={activeStudents} icon="users" large />

      {/* Clases de hoy */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Clases de hoy
        </h3>
        <TodayClassesTable classes={classesTodayWithName} classDate={classDate} gymId={gymId} />
      </div>

      {/* Abonos pagados hoy */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Abonos pagados hoy
        </h3>
        <TodayPaymentsTable payments={paymentsToday} />
      </div>

      {/* Próximos cumpleaños */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Próximos cumpleaños
        </h3>
        <UpcomingBirthdays birthdays={upcomingBirthdays} />
      </div>
    </div>
  );
}
