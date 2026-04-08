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
  const student = await prisma.user.findUnique({ where: { id }, select: { name: true, email: true } });
  return { title: student?.name ?? student?.email ?? "Alumno" };
}

export default async function StudentDetailPage({ params }: Props) {
  const { id } = await params;

  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const student = await prisma.user.findFirst({
    where: { id, gymId: user.gymId, role: "STUDENT" },
    select: { id: true, name: true, email: true, isActive: true, createdAt: true },
  });

  if (!student) notFound();

  const today = toClassDate(new Date());
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [upcoming, recent, creditBalance] = await Promise.all([
    prisma.booking.findMany({
      where: {
        userId: id,
        classDate: { gte: today },
        deletedAt: null,
        status: { in: ["CONFIRMED", "WAITLISTED"] },
      },
      select: {
        id: true, status: true, classDate: true, waitlistPos: true,
        class: { select: { id: true, name: true, startTime: true, color: true } },
      },
      orderBy: { classDate: "asc" },
      take: 20,
    }),
    prisma.booking.findMany({
      where: {
        userId: id,
        classDate: { gte: thirtyDaysAgo, lt: today },
        deletedAt: null,
      },
      select: {
        id: true, status: true, classDate: true,
        class: { select: { name: true, startTime: true, color: true } },
      },
      orderBy: { classDate: "desc" },
      take: 30,
    }),
    prisma.userCreditBalance.findUnique({
      where: { userId_gymId: { userId: id, gymId: user.gymId } },
      select: { availableCredits: true },
    }),
  ]);

  const initials = student.name
    ? student.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : student.email[0].toUpperCase();

  const confirmedCount = upcoming.filter((b) => b.status === "CONFIRMED").length;

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/dashboard/admin/students"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeftIcon size={13} />
        Alumnos
      </Link>

      {/* Header del alumno */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className={cn(
            "size-14 rounded-2xl border flex items-center justify-center text-xl font-bold shrink-0",
            student.isActive
              ? "bg-orange-500/10 border-orange-500/20 text-orange-500"
              : "bg-zinc-800 border-white/[0.06] text-zinc-600"
          )}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-zinc-100 tracking-tight truncate">
                  {student.name ?? "Sin nombre"}
                </h2>
                <p className="text-sm text-zinc-500 truncate">{student.email}</p>
              </div>
              <ToggleStudentButton studentId={student.id} initialIsActive={student.isActive} />
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.06]">
              <div>
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Desde</p>
                <p className="text-xs text-zinc-300 font-medium mt-0.5">
                  {new Date(student.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Próximos turnos</p>
                <p className={cn("text-xs font-bold mt-0.5", confirmedCount > 0 ? "text-emerald-400" : "text-zinc-600")}>
                  {confirmedCount}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Estado</p>
                <p className={cn("text-xs font-medium mt-0.5", student.isActive ? "text-emerald-400" : "text-zinc-500")}>
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
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex-1">
            Próximos turnos
          </h3>
          <span className="text-xs font-mono font-bold tabular-nums text-emerald-500">
            {upcoming.length}
          </span>
        </div>
        <div className="glass-card rounded-2xl overflow-hidden">
          {upcoming.length === 0 ? (
            <p className="text-xs text-zinc-600 text-center py-8">Sin reservas próximas.</p>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {upcoming.map((b) => (
                <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className="size-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: b.class.color ?? "#f97316" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-100 truncate">{b.class.name}</p>
                    <p className="text-xs text-zinc-600">
                      {formatDate(b.classDate)} · {formatTime(b.class.startTime)}
                    </p>
                  </div>
                  {b.status === "WAITLISTED" && (
                    <span className="text-[10px] text-orange-500 font-medium shrink-0">
                      #{b.waitlistPos} espera
                    </span>
                  )}
                  {b.status === "CONFIRMED" && (
                    <span className="text-[10px] text-emerald-500 font-medium shrink-0">
                      Confirmado
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Historial reciente */}
      {recent.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="size-1.5 rounded-full bg-zinc-600" />
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex-1">
              Últimos 30 días
            </h3>
            <span className="text-xs font-mono font-bold tabular-nums text-zinc-500">
              {recent.length}
            </span>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="divide-y divide-white/[0.04]">
              {recent.map((b) => (
                <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className="size-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: b.class.color ?? "#f97316" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm truncate", b.status === "CANCELLED" ? "text-zinc-600 line-through" : "text-zinc-300")}>
                      {b.class.name}
                    </p>
                    <p className="text-xs text-zinc-700">
                      {formatDate(b.classDate)} · {formatTime(b.class.startTime)}
                    </p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium shrink-0",
                    b.status === "CONFIRMED"  && "text-emerald-600",
                    b.status === "CANCELLED"  && "text-zinc-600",
                    b.status === "WAITLISTED" && "text-orange-600",
                  )}>
                    {b.status === "CONFIRMED"  && "Asistió"}
                    {b.status === "CANCELLED"  && "Canceló"}
                    {b.status === "WAITLISTED" && "En espera"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
