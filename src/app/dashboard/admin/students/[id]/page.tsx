import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toClassDate, formatDate, formatTime } from "@/lib/utils";
import { ToggleStudentButton } from "@/components/admin/ToggleStudentButton";
import { ResendInvitationButton } from "@/components/admin/ResendInvitationButton";
import { AdjustCreditsForm } from "@/components/admin/AdjustCreditsForm";
import { FreezeCreditsButton } from "@/components/admin/FreezeCreditsButton";
import { getStudentFreezeStatus } from "@/actions/freezes";
import { BackButton } from "@/components/ui/BackButton";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";

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
      invitedAt: true,
    },
  });

  if (!student) notFound();

  const today = toClassDate(new Date());

  const [upcoming, creditBalance, freezeStatus] = await Promise.all([
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
    getStudentFreezeStatus(id),
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
      <BackButton href="/dashboard/admin/students" />

      {/* Header del alumno */}
      <div className="bg-card border border-border p-5">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "size-12 md:size-14 border flex items-center justify-center text-lg md:text-xl font-bold shrink-0",
              student.isActive
                ? "bg-brand/10 border-brand/20 text-brand"
                : "bg-card border-border text-muted",
            )}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-primary tracking-tight truncate">
                  {student.name ?? "Sin nombre"}
                </h2>
                <p className="text-sm md:text-base text-secondary truncate">
                  {student.email}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row md:items-center gap-2 w-full md:w-auto">
                <ResendInvitationButton
                  studentId={student.id}
                  className="w-full sm:w-auto"
                />
                <FreezeCreditsButton
                  studentId={student.id}
                  initialIsPaused={freezeStatus.isPaused}
                  className="w-full sm:w-auto"
                />
                <ToggleStudentButton
                  studentId={student.id}
                  initialIsActive={student.isActive}
                  className="w-full sm:w-auto"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:flex gap-y-3 gap-x-4 sm:items-start sm:gap-4 md:gap-6 mt-3 pt-3 border-t border-border">
              <div>
                <p className="text-[10px] md:text-xs text-muted uppercase tracking-wider">
                  Desde
                </p>
                <p className="text-xs md:text-sm text-primary font-medium mt-0.5">
                  {new Date(student.createdAt).toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-muted uppercase tracking-wider">
                  Próximos turnos
                </p>
                <p
                  className={cn(
                    "text-xs md:text-sm font-bold mt-0.5",
                    confirmedCount > 0 ? "text-success" : "text-muted",
                  )}
                >
                  {confirmedCount}
                </p>
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-muted uppercase tracking-wider">
                  Estado
                </p>
                <p
                  className={cn(
                    "text-xs md:text-sm font-medium mt-0.5",
                    student.isActive ? "text-success" : "text-secondary",
                  )}
                >
                  {student.isActive ? "Activo" : "Inactivo"}
                </p>
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-muted uppercase tracking-wider">
                  Invitación
                </p>
                <p
                  className={cn(
                    "text-xs md:text-sm font-medium mt-0.5",
                    student.invitedAt ? "text-secondary" : "text-brand",
                  )}
                >
                  {student.invitedAt
                    ? `Enviada el ${new Date(student.invitedAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}`
                    : "Pendiente"}
                </p>
              </div>
              {freezeStatus.isPaused && (
                <div>
                  <p className="text-[10px] md:text-xs text-muted uppercase tracking-wider">
                    Abono
                  </p>
                  <p className="text-xs md:text-sm font-medium mt-0.5 text-brand">
                    Pausado
                  </p>
                </div>
              )}
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
          <span className="size-1.5 rounded-full bg-success" />
          <h3 className="text-xs md:text-base font-semibold text-secondary uppercase tracking-wider flex-1">
            Próximos turnos
          </h3>
          <span className="text-xs md:text-sm font-mono font-bold tabular-nums text-success">
            {upcoming.length}
          </span>
        </div>
        <div className="bg-card border border-border overflow-hidden">
          {upcoming.length === 0 ? (
            <p className="text-xs md:text-sm text-muted text-center py-8">
              Sin reservas próximas.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {upcoming.map((b) => (
                <div key={b.id} className="flex items-center gap-3 px-4 md:px-5 py-3 md:py-4">
                  <span
                    className="size-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: b.class.color ?? "#f97316" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm md:text-base font-medium text-primary truncate">
                      {b.class.discipline?.name ?? "Sin disciplina"}
                    </p>
                    <p className="text-xs md:text-sm text-muted">
                      {formatDate(b.classDate)} ·{" "}
                      {formatTime(b.class.startTime)}
                    </p>
                  </div>
                  {b.status === "WAITLISTED" && (
                    <span className="text-xs md:text-sm text-brand font-medium shrink-0">
                      #{b.waitlistPos} espera
                    </span>
                  )}
                  {b.status === "CONFIRMED" && (
                    <span className="text-xs md:text-sm text-success font-medium shrink-0">
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
      <div className="bg-card border border-border p-5">
        <h3 className="text-xs md:text-sm font-semibold text-secondary uppercase tracking-wider mb-3">
          Historiales
        </h3>
        <div className="flex gap-3">
          <Link
            href={`/dashboard/admin/students/${id}/history/bookings`}
            className="flex-1 h-12 flex items-center justify-center gap-2 border border-border text-xs md:text-base text-secondary hover:text-primary hover:border-secondary transition-colors"
          >
            <span className="size-1.5 rounded-full bg-success" />
            Turnos
          </Link>
          <Link
            href={`/dashboard/admin/students/${id}/history/credits`}
            className="flex-1 h-12 flex items-center justify-center gap-2 border border-border text-xs md:text-base text-secondary hover:text-primary hover:border-secondary transition-colors"
          >
            <span className="size-1.5 rounded-full bg-brand" />
            Créditos
          </Link>
        </div>
      </div>
    </div>
  );
}
