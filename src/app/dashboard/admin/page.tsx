import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MetricCard } from "@/components/admin/MetricCard";
import { TodayClassesTable } from "@/components/admin/TodayClassesTable";
import { toClassDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard Admin" };

export default async function AdminDashboardPage() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;

  if (!user?.id || user.role !== "ADMIN") redirect("/");

  const gymId = user.gymId;
  if (!gymId) redirect("/");

  const today = new Date();
  const classDate = toClassDate(today);
  const dayOfWeek = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"][today.getDay()];

  // Clases de hoy con sus bookings
  const classesToday = await prisma.gymClass.findMany({
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
  });

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
  const totalCancelled = await prisma.booking.count({
    where: {
      class: { gymId },
      classDate,
      status: "CANCELLED",
    },
  });
  const activeStudents = await prisma.user.count({
    where: { gymId, role: "STUDENT", isActive: true },
  });

  const occupancyRate = totalCapacity > 0
    ? Math.round((totalConfirmed / totalCapacity) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Hoy</p>
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Dashboard</h2>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Clases hoy"
          value={classesToday.length}
          icon="calendar"
        />
        <MetricCard
          label="Confirmados"
          value={totalConfirmed}
          icon="check"
          accent="emerald"
        />
        <MetricCard
          label="Ocupación"
          value={`${occupancyRate}%`}
          icon="chart"
          accent={occupancyRate > 80 ? "orange" : "zinc"}
        />
        <MetricCard
          label="Cancelaciones"
          value={totalCancelled}
          icon="x"
          accent="rose"
        />
      </div>

      <MetricCard
        label="Alumnos activos"
        value={activeStudents}
        icon="users"
        large
      />

      {/* Tabla de clases de hoy */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Clases de hoy
        </h3>
        <TodayClassesTable classes={classesTodayWithName} classDate={classDate} gymId={gymId} />
      </div>
    </div>
  );
}
