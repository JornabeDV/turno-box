import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toClassDate } from "@/lib/utils";
import { StudentsList } from "@/components/admin/StudentsList";
import { MetricCard } from "@/components/admin/MetricCard";
import { ImportStudentsButton } from "@/components/admin/ImportStudentsButton";
import { CreateStudentButton } from "@/components/admin/CreateStudentButton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Alumnos" };

const PAGE_SIZE = 20;

type Props = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

export default async function StudentsPage({ searchParams }: Props) {
  const session = await auth();
  const user = session?.user as
    | { id?: string; role?: string; gymId?: string }
    | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const skip = (page - 1) * PAGE_SIZE;
  const search = q?.trim();

  const today = toClassDate(new Date());

  const baseWhere = {
    gymId: user.gymId,
    role: "STUDENT" as const,
  };

  const listWhere = search
    ? {
        ...baseWhere,
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : baseWhere;

  const [students, total, allForMetrics] = await Promise.all([
    prisma.user.findMany({
      where: listWhere,
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
      skip,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where: listWhere }),
    prisma.user.findMany({
      where: baseWhere,
      select: {
        isActive: true,
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
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const active = allForMetrics.filter((s) => s.isActive).length;
  const inactive = allForMetrics.length - active;
  const withBookings = allForMetrics.filter(
    (s) => s._count.bookings > 0
  ).length;

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs md:text-sm text-[#6B8A99] uppercase tracking-wider mb-0.5">
            Admin
          </p>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#EAEAEA] tracking-tight">
            Alumnos
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <CreateStudentButton />
          <ImportStudentsButton />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MetricCard
          label="Total"
          value={allForMetrics.length}
          icon="users"
        />
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
        <p className="text-xs md:text-sm text-[#4A6B7A] px-1">
          {inactive} {inactive === 1 ? "alumno inactivo" : "alumnos inactivos"}{" "}
          — no aparecen en reservas
        </p>
      )}

      <StudentsList
        students={rows}
        totalPages={totalPages}
        currentPage={page}
        query={search || ""}
        total={total}
      />
    </div>
  );
}
