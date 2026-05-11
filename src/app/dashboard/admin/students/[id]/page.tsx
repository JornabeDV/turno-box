import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toClassDate, formatDate, formatTime } from "@/lib/utils";
import { ToggleStudentButton } from "@/components/admin/ToggleStudentButton";
import { AdjustCreditsForm } from "@/components/admin/AdjustCreditsForm";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const student = await prisma.user.findUnique({
    where: { id },
    select: { name: true, email: true },
  });
  return { title: student?.name ?? student?.email ?? "Alumno" };
}

export default async function StudentDetailPage({ params }: Props) {
  const { id } = await params;

  const session = await auth();
  const user = session?.user as
    | { id?: string; role?: string; gymId?: string }
    | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const student = await prisma.user.findFirst({
    where: { id, gymId: user.gymId, role: "STUDENT" },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!student) notFound();

  const today = toClassDate(new Date());

  const [upcoming, creditBalance] = await Promise.all([
    prisma.booking.findMany({
      where: {
        userId: id,
        classDate: { gte: today },
        deletedAt: null,
        status: { in: ["CONFIRMED", "WAITLISTED"] },
      },
      select: {
        id: true,
        status: true,
        classDate: true,
        waitlistPos: true,
        class: {
          select: {
            id: true,
            startTime: true,
            color: true,
            discipline: { select: { name: true } },
          },
        },
      },
      orderBy: { classDate: "asc" },
      take: 20,
    }),
    prisma.userCreditBalance.findUnique({
      where: { userId_gymId: { userId: id, gymId: user.gymId } },
      select: { availableCredits: true },
    }),
  ]);

  const initials = student.name
    ? student.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : student.email[0].toUpperCase();

  const confirmedCount = upcoming.filter(
    (b) => b.status === "CONFIRMED",
  ).length;

  return (
    <div className="max-w-5xl space-y-6">
      <Link
        href="/dashboard/admin/students"
        className="inline-flex items-center gap-1.5 text-xs text-[#6B8A99] hover:text-[#EAEAEA] transition-colors"
      >
        <ArrowLeftIcon size={13} />
        Alumnos
      </Link>

      {/* Header del alumno */}
      <div className="bg-[#0E2A38] border border-[#1A4A63] p-5">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "size-14 border flex items-center justify-center text-xl font-bold shrink-0",
              student.isActive
                ? "bg-[#F78837]/10 border-[#F78837]/20 text-[#F78837]"
                : "bg-[#0E2A38] border-[#1A4A63] text-[#4A6B7A]",
            )}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-[#EAEAEA] tracking-tight truncate">
                  {student.name ?? "Sin nombre"}
                </h2>
                <p className="text-sm text-[#6B8A99] truncate">
                  {student.email}
                </p>
              </div>
              <ToggleStudentButton
                studentId={student.id}
                initialIsActive={student.isActive}
              />
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#1A4A63]">
              <div>
                <p className="text-[10px] text-[#4A6B7A] uppercase tracking-wider">
                  Desde
                </p>
                <p className="text-xs text-[#EAEAEA] font-medium mt-0.5">
                  {new Date(student.createdAt).toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#4A6B7A] uppercase tracking-wider">
                  Próximos turnos
                </p>
                <p
                  className={cn(
                    "text-xs font-bold mt-0.5",
                    confirmedCount > 0 ? "text-[#27C7B8]" : "text-[#4A6B7A]",
                  )}
                >
                  {confirmedCount}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#4A6B7A] uppercase tracking-wider">
                  Estado
                </p>
                <p
                  className={cn(
                    "text-xs font-medium mt-0.5",
                    student.isActive ? "text-[#27C7B8]" : "text-[#6B8A99]",
                  )}
                >
                  {student.isActive ? "Activo" : "Inactivo"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Créditos */}
      <AdjustCreditsForm
        studentId={student.id}
        currentBalance={creditBalance?.availableCredits ?? 0}
      />

      {/* Próximos turnos */}
      <div>
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="size-1.5 rounded-full bg-[#27C7B8]" />
          <h3 className="text-xs font-semibold text-[#6B8A99] uppercase tracking-wider flex-1">
            Próximos turnos
          </h3>
          <span className="text-xs font-mono font-bold tabular-nums text-[#27C7B8]">
            {upcoming.length}
          </span>
        </div>
        <div className="bg-[#0E2A38] border border-[#1A4A63] overflow-hidden">
          {upcoming.length === 0 ? (
            <p className="text-xs text-[#4A6B7A] text-center py-8">
              Sin reservas próximas.
            </p>
          ) : (
            <div className="divide-y divide-[#1A4A63]">
              {upcoming.map((b) => (
                <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className="size-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: b.class.color ?? "#f97316" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#EAEAEA] truncate">
                      {b.class.discipline?.name ?? "Sin disciplina"}
                    </p>
                    <p className="text-xs text-[#4A6B7A]">
                      {formatDate(b.classDate)} ·{" "}
                      {formatTime(b.class.startTime)}
                    </p>
                  </div>
                  {b.status === "WAITLISTED" && (
                    <span className="text-[10px] text-[#F78837] font-medium shrink-0">
                      #{b.waitlistPos} espera
                    </span>
                  )}
                  {b.status === "CONFIRMED" && (
                    <span className="text-[10px] text-[#27C7B8] font-medium shrink-0">
                      Confirmado
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Acceso a historiales */}
      <div className="bg-[#0E2A38] border border-[#1A4A63] p-5">
        <h3 className="text-xs font-semibold text-[#6B8A99] uppercase tracking-wider mb-3">
          Historiales
        </h3>
        <div className="flex gap-3">
          <Link
            href={`/dashboard/admin/students/${id}/history/bookings`}
            className="flex-1 h-10 flex items-center justify-center gap-2 border border-[#1A4A63] text-xs text-[#6B8A99] hover:text-[#EAEAEA] hover:border-[#6B8A99] transition-colors"
          >
            <span className="size-1.5 rounded-full bg-[#27C7B8]" />
            Turnos
          </Link>
          <Link
            href={`/dashboard/admin/students/${id}/history/credits`}
            className="flex-1 h-10 flex items-center justify-center gap-2 border border-[#1A4A63] text-xs text-[#6B8A99] hover:text-[#EAEAEA] hover:border-[#6B8A99] transition-colors"
          >
            <span className="size-1.5 rounded-full bg-[#F78837]" />
            Créditos
          </Link>
        </div>
      </div>
    </div>
  );
}
