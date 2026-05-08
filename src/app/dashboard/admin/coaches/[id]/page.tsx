import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toClassDate, formatTime } from "@/lib/utils";
import { ToggleCoachButton } from "@/components/admin/ToggleCoachButton";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const coach = await prisma.user.findUnique({
    where: { id },
    select: { name: true, email: true },
  });
  return { title: coach?.name ?? coach?.email ?? "Coach" };
}

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lunes",
  TUESDAY: "Martes",
  WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves",
  FRIDAY: "Viernes",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
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

export default async function CoachDetailPage({ params }: Props) {
  const { id } = await params;

  const session = await auth();
  const user = session?.user as
    | { id?: string; role?: string; gymId?: string }
    | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const coach = await prisma.user.findFirst({
    where: { id, gymId: user.gymId, role: "COACH" },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!coach) notFound();

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

  const classes = await prisma.gymClass.findMany({
    where: { coachId: id, gymId: user.gymId, isActive: true, deletedAt: null },
    select: {
      id: true,
      discipline: { select: { name: true } },
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      maxCapacity: true,
      color: true,
      bookings: {
        where: {
          classDate: today,
          deletedAt: null,
          status: { in: ["CONFIRMED", "WAITLISTED"] },
        },
        select: { status: true },
      },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  const grouped = DAY_ORDER.reduce<Record<string, typeof classes>>(
    (acc, day) => {
      const dayClasses = classes.filter((c) => c.dayOfWeek === day);
      if (dayClasses.length > 0) acc[day] = dayClasses;
      return acc;
    },
    {},
  );

  const initials = coach.name
    ? coach.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : coach.email[0].toUpperCase();

  const totalTodayConfirmed = classes
    .filter((c) => c.dayOfWeek === dayOfWeek)
    .reduce(
      (acc, c) =>
        acc + c.bookings.filter((b) => b.status === "CONFIRMED").length,
      0,
    );

  return (
    <div className="max-w-5xl space-y-6">
      <Link
        href="/dashboard/admin/coaches"
        className="inline-flex items-center gap-1.5 text-xs text-[#6B8A99] hover:text-[#EAEAEA] transition-colors"
      >
        <ArrowLeftIcon size={13} />
        Coaches
      </Link>

      {/* Header */}
      <div className="bg-[#0E2A38] border border-[#1A4A63] p-5">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "size-14 border flex items-center justify-center text-xl font-bold shrink-0",
              coach.isActive
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
                  {coach.name ?? "Sin nombre"}
                </h2>
                <p className="text-sm text-[#6B8A99] truncate">{coach.email}</p>
              </div>
              <ToggleCoachButton
                coachId={coach.id}
                initialIsActive={coach.isActive}
              />
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#1A4A63]">
              <div>
                <p className="text-[10px] text-[#4A6B7A] uppercase tracking-wider">
                  Coach desde
                </p>
                <p className="text-xs text-[#EAEAEA] font-medium mt-0.5">
                  {new Date(coach.createdAt).toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#4A6B7A] uppercase tracking-wider">
                  Clases
                </p>
                <p className="text-xs font-bold text-[#EAEAEA] mt-0.5">
                  {classes.length}
                </p>
              </div>
              {totalTodayConfirmed > 0 && (
                <div>
                  <p className="text-[10px] text-[#4A6B7A] uppercase tracking-wider">
                    Alumnos hoy
                  </p>
                  <p className="text-xs font-bold text-[#27C7B8] mt-0.5">
                    {totalTodayConfirmed}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[10px] text-[#4A6B7A] uppercase tracking-wider">
                  Estado
                </p>
                <p
                  className={cn(
                    "text-xs font-medium mt-0.5",
                    coach.isActive ? "text-[#27C7B8]" : "text-[#6B8A99]",
                  )}
                >
                  {coach.isActive ? "Activo" : "Inactivo"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Horario semanal */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="size-1.5 rounded-full bg-[#F78837]" />
          <h3 className="text-xs font-semibold text-[#6B8A99] uppercase tracking-wider flex-1">
            Horario semanal
          </h3>
          <span className="text-xs font-mono font-bold tabular-nums text-[#F78837]">
            {classes.length}
          </span>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="bg-[#0E2A38] border border-[#1A4A63] px-4 py-10 text-center">
            <p className="text-sm text-[#4A6B7A]">
              Este coach no tiene clases asignadas.
            </p>
            <p className="text-xs text-[#4A6B7A] mt-1">
              Podés asignarle clases desde{" "}
              <Link
                href="/dashboard/admin/classes"
                className="text-[#F78837] hover:text-[#F78837]"
              >
                Gestión de clases
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([day, dayClasses]) => {
              const isToday = day === dayOfWeek;
              return (
                <div key={day}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <h4
                      className={cn(
                        "text-xs font-semibold uppercase tracking-wider",
                        isToday ? "text-[#F78837]" : "text-[#6B8A99]",
                      )}
                    >
                      {DAY_LABELS[day]}
                    </h4>
                    {isToday && (
                      <span className="text-[10px] bg-[#F78837]/10 text-[#F78837] px-1.5 py-0.5 rounded-full font-medium">
                        hoy
                      </span>
                    )}
                  </div>
                  <div className="bg-[#0E2A38] border border-[#1A4A63] overflow-hidden divide-y divide-[#1A4A63]">
                    {dayClasses.map((c) => {
                      const confirmed = c.bookings.filter(
                        (b) => b.status === "CONFIRMED",
                      ).length;
                      const waitlisted = c.bookings.filter(
                        (b) => b.status === "WAITLISTED",
                      ).length;
                      const pct = Math.round((confirmed / c.maxCapacity) * 100);
                      return (
                        <div
                          key={c.id}
                          className="flex items-center gap-3 px-4 py-3"
                        >
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: c.color ?? "#f97316" }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#EAEAEA] truncate">
                              {c.discipline?.name ?? "Sin disciplina"}
                            </p>
                            <p className="text-xs text-[#6B8A99] font-mono tabular-nums">
                              {formatTime(c.startTime)} –{" "}
                              {formatTime(c.endTime)}
                            </p>
                          </div>
                          {isToday ? (
                            <div className="text-right shrink-0">
                              <p
                                className={cn(
                                  "text-xs font-mono font-bold tabular-nums",
                                  pct >= 100
                                    ? "text-[#E61919]"
                                    : pct >= 75
                                      ? "text-[#F78837]"
                                      : "text-[#27C7B8]",
                                )}
                              >
                                {confirmed}/{c.maxCapacity}
                              </p>
                              {waitlisted > 0 && (
                                <p className="text-[10px] text-[#F78837]">
                                  +{waitlisted} espera
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-[#4A6B7A] font-mono shrink-0">
                              {c.maxCapacity} cupos
                            </span>
                          )}
                          <Link
                            href={`/dashboard/admin/classes/${c.id}`}
                            className="size-6 rounded-md flex items-center justify-center text-[#4A6B7A] hover:text-[#6B8A99] hover:bg-white/[0.04] transition-all shrink-0"
                          >
                            <PencilSimpleIcon size={12} />
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
