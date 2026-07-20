import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toClassDate, formatTime, formatDate, getTodayInGymTimezone } from "@/lib/utils";
import { ToggleCoachButton } from "@/components/admin/ToggleCoachButton";
import { EditCoachButton } from "@/components/admin/EditCoachButton";
import { BackButton } from "@/components/ui/BackButton";
import {
  PencilSimpleIcon,
  CalendarIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const coach = await prisma.user.findUnique({
    where: { id },
    select: { name: true, email: true },
  });
  return { title: coach?.name ?? coach?.email ?? "Profesor" };
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

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function nextDateForDayOfWeek(dayOfWeek: string, from: Date): Date {
  const dayIndex = DAY_ORDER.indexOf(dayOfWeek);
  if (dayIndex === -1) return from;
  const fromDay = from.getDay();
  // Convertir JS getDay() (Domingo=0) a índice de DAY_ORDER (Lunes=0)
  const jsDayIndex = (fromDay + 6) % 7;
  const diff = (dayIndex - jsDayIndex + 7) % 7;
  const result = new Date(from);
  result.setDate(result.getDate() + diff);
  return result;
}

export default async function CoachDetailPage({ params }: Props) {
  const { id } = await params;

  const session = await auth();
  const user = session?.user as
    | { id?: string; role?: string; gymId?: string }
    | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const coach = await prisma.user.findFirst({
    where: { id, gymId: user.gymId, role: { in: ["COACH", "ADMIN"] } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!coach) notFound();

  const backHref = `/dashboard/admin/coaches/${id}`;

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

  // Clases puntuales (overrides) futuras asignadas a este coach
  const upcomingOverrides = await prisma.classOverride.findMany({
    where: {
      coachId: id,
      date: { gte: today },
      isCancelled: false,
      gymClass: { gymId: user.gymId, deletedAt: null },
    },
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
      maxCapacity: true,
      color: true,
      description: true,
      gymClass: {
        select: {
          id: true,
          discipline: { select: { name: true, color: true } },
          startTime: true,
          endTime: true,
          maxCapacity: true,
          color: true,
        },
      },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
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
      <BackButton href="/dashboard/admin/coaches" />

      {/* Header */}
      <div className="bg-card border border-border p-5">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "size-14 border flex items-center justify-center text-xl font-bold shrink-0",
              coach.isActive
                ? "bg-brand/10 border-brand/20 text-brand"
                : "bg-card border-border text-muted",
            )}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-primary tracking-tight truncate">
                  {coach.name ?? "Sin nombre"}
                </h2>
                <p className="text-sm md:text-base text-secondary truncate">{coach.email}</p>
                {coach.role === "ADMIN" && (
                  <p className="text-[10px] md:text-xs text-brand uppercase tracking-wider">
                    Administrador
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <EditCoachButton coach={coach} />
                <ToggleCoachButton
                  coachId={coach.id}
                  initialIsActive={coach.isActive}
                />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
              <div>
                <p className="text-[10px] md:text-sm text-muted uppercase tracking-wider">
                  Profesor desde
                </p>
                <p className="text-xs md:text-base text-primary font-medium mt-0.5">
                  {new Date(coach.createdAt).toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-[10px] md:text-sm text-muted uppercase tracking-wider">
                  Clases
                </p>
                <p className="text-xs md:text-base font-bold text-primary mt-0.5">
                  {classes.length}
                  {upcomingOverrides.length > 0 && (
                    <span className="text-brand ml-1">
                      +{upcomingOverrides.length}
                    </span>
                  )}
                </p>
              </div>
              {totalTodayConfirmed > 0 && (
                <div>
                  <p className="text-[10px] md:text-sm text-muted uppercase tracking-wider">
                    Alumnos hoy
                  </p>
                  <p className="text-xs md:text-sm font-bold text-success mt-0.5">
                    {totalTodayConfirmed}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[10px] md:text-sm text-muted uppercase tracking-wider">
                  Estado
                </p>
                <p
                  className={cn(
                    "text-xs md:text-base font-medium mt-0.5",
                    coach.isActive ? "text-success" : "text-secondary",
                  )}
                >
                  {coach.isActive ? "Activo" : "Inactivo"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clases únicas */}
      {upcomingOverrides.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="size-1.5 rounded-full bg-brand" />
            <h3 className="text-xs md:text-base font-semibold text-secondary uppercase tracking-wider flex-1">
              Clases únicas asignadas
            </h3>
            <span className="text-xs md:text-base font-mono font-bold tabular-nums text-brand">
              {upcomingOverrides.length}
            </span>
          </div>
          <div className="bg-card border border-border overflow-hidden divide-y divide-border">
            {upcomingOverrides.map((o) => {
              const start = o.startTime ?? o.gymClass.startTime;
              const end = o.endTime ?? o.gymClass.endTime;
              const maxCapacity = o.maxCapacity ?? o.gymClass.maxCapacity;
              const color = o.color ?? o.gymClass.color;
              const disciplineName = o.gymClass.discipline?.name ?? "Sin disciplina";
              return (
                <Link
                  key={o.id}
                  href={`/dashboard/admin/classes/${o.gymClass.id}?date=${o.date.toISOString().slice(0, 10)}&back=${encodeURIComponent(backHref)}`}
                  className="flex items-center gap-3 px-4 md:px-5 py-3 md:py-4 group hover:bg-white/[0.02] transition-colors"
                >
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: color ?? "#f97316" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm md:text-lg font-medium text-primary truncate">
                      {disciplineName}
                    </p>
                    <p className="text-xs md:text-base text-secondary font-mono tabular-nums">
                      {formatDate(o.date)} · {formatTime(start)} – {formatTime(end)}
                    </p>
                    {o.description && (
                      <p className="text-xs md:text-sm text-muted mt-0.5">{o.description}</p>
                    )}
                  </div>
                  <span className="size-8 rounded-md flex items-center justify-center text-muted group-hover:text-secondary group-hover:bg-white/[0.04] transition-all shrink-0">
                    <PencilSimpleIcon size={16} />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Horario semanal */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="size-1.5 rounded-full bg-brand" />
          <h3 className="text-xs md:text-base font-semibold text-secondary uppercase tracking-wider flex-1">
            Horario semanal
          </h3>
          <span className="text-xs md:text-base font-mono font-bold tabular-nums text-brand">
            {classes.length}
          </span>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="bg-card border border-border px-4 py-10 text-center">
            <p className="text-sm md:text-base text-muted">
              Este profesor no tiene clases asignadas.
            </p>
            <p className="text-xs md:text-sm text-muted mt-1">
              Podés asignarle clases desde{" "}
              <Link
                href="/dashboard/admin/classes"
                className="text-brand hover:text-brand"
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
                        "text-xs md:text-sm font-semibold uppercase tracking-wider",
                        isToday ? "text-brand" : "text-secondary",
                      )}
                    >
                      {DAY_LABELS[day]}
                    </h4>
                    {isToday && (
                      <span className="text-[10px] md:text-xs bg-brand/10 text-brand px-1.5 py-0.5 rounded-full font-medium">
                        hoy
                      </span>
                    )}
                  </div>
                  <div className="bg-card border border-border overflow-hidden divide-y divide-border">
                    {dayClasses.map((c) => {
                      const confirmed = c.bookings.filter(
                        (b) => b.status === "CONFIRMED",
                      ).length;
                      const waitlisted = c.bookings.filter(
                        (b) => b.status === "WAITLISTED",
                      ).length;
                      const pct = Math.round((confirmed / c.maxCapacity) * 100);
                      return (
                        <Link
                          key={c.id}
                          href={`/dashboard/admin/classes/${c.id}?date=${isoDate(nextDateForDayOfWeek(c.dayOfWeek, getTodayInGymTimezone()))}&back=${encodeURIComponent(backHref)}`}
                          className="flex items-center gap-3 px-4 md:px-5 py-3 md:py-4 group hover:bg-white/[0.02] transition-colors"
                        >
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: c.color ?? "#f97316" }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm md:text-base font-medium text-primary truncate">
                              {c.discipline?.name ?? "Sin disciplina"}
                            </p>
                            <p className="text-xs md:text-sm text-secondary font-mono tabular-nums">
                              {formatTime(c.startTime)} –{" "}
                              {formatTime(c.endTime)}
                            </p>
                          </div>
                          {isToday ? (
                            <div className="text-right shrink-0">
                              <p
                                className={cn(
                                  "text-xs md:text-sm font-mono font-bold tabular-nums",
                                  pct >= 100
                                    ? "text-danger"
                                    : pct >= 75
                                      ? "text-brand"
                                      : "text-success",
                                )}
                              >
                                {confirmed}/{c.maxCapacity}
                              </p>
                              {waitlisted > 0 && (
                                <p className="text-[10px] md:text-xs text-brand">
                                  +{waitlisted} espera
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs md:text-sm text-muted font-mono shrink-0">
                              {c.maxCapacity} cupos
                            </span>
                          )}
                          <span className="size-8 rounded-md flex items-center justify-center text-muted group-hover:text-secondary group-hover:bg-white/[0.04] transition-all shrink-0">
                            <PencilSimpleIcon size={16} />
                          </span>
                        </Link>
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
