import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toClassDate } from "@/lib/utils";
import { StudentsList } from "@/components/admin/StudentsList";
import { MetricCard } from "@/components/admin/MetricCard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Alumnos" };

export default async function StudentsPage() {
  const session = await auth();
  const user = session?.user as
    | { id?: string; role?: string; gymId?: string }
    | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const today = toClassDate(new Date());

  const students = await prisma.user.findMany({
    where: { gymId: user.gymId, role: "STUDENT" },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          bookings: {
            where: {
              status: "CONFIRMED",
              classDate: { gte: today },
              deletedAt: null,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const active = students.filter((s) => s.isActive).length;
  const inactive = students.length - active;
  const withBookings = students.filter((s) => s._count.bookings > 0).length;

  const rows = students.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    isActive: s.isActive,
    createdAt: s.createdAt,
    upcomingCount: s._count.bookings,
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">
          Admin
        </p>
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
          Alumnos
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Total" value={students.length} icon="users" />
        <MetricCard
          label="Activos"
          value={active}
          icon="check"
          accent="emerald"
        />
        <MetricCard
          label="Con turno hoy"
          value={withBookings}
          icon="calendar"
          accent="orange"
        />
      </div>

      {inactive > 0 && (
        <p className="text-xs text-zinc-600 px-1">
          {inactive} {inactive === 1 ? "alumno inactivo" : "alumnos inactivos"}{" "}
          — no aparecen en reservas
        </p>
      )}

      <StudentsList students={rows} />
    </div>
  );
}
