import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toClassDate, formatTime, formatDate } from "@/lib/utils";
import { AttendeesList } from "@/components/admin/AttendeesList";
import { OccupancyBar } from "@/components/admin/OccupancyBar";
import { ClassDetailActions } from "./ClassDetailActions";
import { BackButton } from "@/components/ui/BackButton";
import type { Metadata } from "next";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lunes",
  TUESDAY: "Martes",
  WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves",
  FRIDAY: "Viernes",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const gymClass = await prisma.gymClass.findUnique({
    where: { id },
    select: { discipline: { select: { name: true } } },
  });
  return { title: gymClass?.discipline?.name ?? "Detalle de clase" };
}

export default async function ClassDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { date } = await searchParams;

  const session = await auth();
  const user = session?.user as
    | { id?: string; role?: string; gymId?: string }
    | undefined;
  if (!user?.id || !["ADMIN", "COACH"].includes(user.role ?? "")) redirect("/");
  if (!user.gymId) redirect("/");

  const targetDate = date ? new Date(date) : new Date();
  const classDate = toClassDate(targetDate);

  const [gymClass, bookings, coaches, disciplines, classOverride, gymClosure] = await Promise.all([
    prisma.gymClass.findFirst({
      where: { id, gymId: user.gymId, deletedAt: null },
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        maxCapacity: true,
        color: true,
        description: true,
        coachId: true,
        disciplineId: true,
        coach: { select: { name: true } },
        discipline: { select: { name: true } },
      },
    }),
    prisma.booking.findMany({
      where: {
        classId: id,
        classDate,
        deletedAt: null,
        status: { in: ["CONFIRMED", "WAITLISTED"] },
      },
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        status: true,
        waitlistPos: true,
        attendedAt: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
    // Solo el admin necesita los selectores de edición
    user.role === "ADMIN"
      ? prisma.user.findMany({
          where: {
            gymId: user.gymId,
            role: { in: ["COACH", "ADMIN"] },
            isActive: true,
          },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    user.role === "ADMIN"
      ? prisma.discipline.findMany({
          where: { gymId: user.gymId, isActive: true },
          select: { id: true, name: true, color: true, description: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    prisma.classOverride.findUnique({
      where: { gymClassId_date: { gymClassId: id, date: classDate } },
    }),
    prisma.gymClosure.findUnique({
      where: { gymId_date: { gymId: user.gymId, date: classDate } },
    }),
  ]);

  if (!gymClass) notFound();

  const confirmed = bookings.filter((b) => b.status === "CONFIRMED");
  const waitlisted = bookings.filter((b) => b.status === "WAITLISTED");
  const attendedCount = confirmed.filter((b) => b.attendedAt).length;
  const allAttended = confirmed.length > 0 && attendedCount === confirmed.length;
  const isAdmin = user.role === "ADMIN";

  // Valores efectivos: override puntual o template base
  const effectiveMaxCapacity = classOverride?.maxCapacity ?? gymClass.maxCapacity;
  const effectiveStartTime = classOverride?.startTime ?? gymClass.startTime;
  const effectiveEndTime = classOverride?.endTime ?? gymClass.endTime;
  const effectiveCoachId = classOverride?.coachId ?? gymClass.coachId;
  const effectiveDescription = classOverride?.description ?? gymClass.description;
  const effectiveColor = classOverride?.color ?? gymClass.color;
  const effectiveCoachName = coaches.find((c) => c.id === effectiveCoachId)?.name ?? gymClass.coach?.name ?? null;

  return (
    <div className="max-w-5xl space-y-6">
      {/* Back */}
      <BackButton href="/dashboard/admin/classes" />

      {/* Alertas de override o cierre */}
      {gymClosure && (
        <div className="rounded-[2px] bg-danger/10 border border-danger/20 px-4 py-3">
          <p className="text-sm font-semibold text-danger">
            Gimnasio cerrado el {formatDate(targetDate)}
            {gymClosure.reason ? ` — ${gymClosure.reason}` : ""}
          </p>
        </div>
      )}
      {classOverride?.isCancelled && (
        <div className="rounded-[2px] bg-danger/10 border border-danger/20 px-4 py-3">
          <p className="text-sm font-semibold text-danger">
            Esta clase está cancelada para el {formatDate(targetDate)}
          </p>
        </div>
      )}

      {/* Header de la clase */}
      <div className="bg-card border border-border p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span
              className="size-3 rounded-full mt-1.5 shrink-0"
              style={{ backgroundColor: gymClass.color ?? "#f97316" }}
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary tracking-tight">
                {gymClass.discipline?.name ?? "Sin disciplina"}
              </h2>
              <p className="text-sm md:text-base text-secondary mt-0.5">
                {DAY_LABELS[gymClass.dayOfWeek]} · {formatDate(targetDate)} ·{" "}
                {formatTime(effectiveStartTime)} –{" "}
                {formatTime(effectiveEndTime)}
                {effectiveCoachName && ` · ${effectiveCoachName}`}
              </p>
              {effectiveDescription && (
                <p className="text-xs md:text-sm text-muted mt-1.5">
                  {effectiveDescription}
                </p>
              )}
            </div>
          </div>

          {/* Acciones editar/eliminar — solo admin */}
          {isAdmin && (
            <div className="self-end sm:self-auto">
              <ClassDetailActions
                classData={{
                  id: gymClass.id,
                  description: effectiveDescription,
                  dayOfWeek: gymClass.dayOfWeek,
                  startTime: effectiveStartTime,
                  endTime: effectiveEndTime,
                  maxCapacity: effectiveMaxCapacity,
                  color: effectiveColor,
                  coachId: effectiveCoachId,
                  disciplineId: classOverride?.disciplineId ?? gymClass.disciplineId,
                }}
                coaches={coaches}
                disciplines={disciplines}
                date={date}
              />
            </div>
          )}
        </div>

        {/* Stats rápidos */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 mb-4 pt-3 border-t border-border">
          <div>
            <p className="text-[10px] md:text-xs text-muted uppercase tracking-wider">
              Capacidad
            </p>
            <p className="text-xs md:text-sm font-bold text-primary mt-0.5">
              {effectiveMaxCapacity} cupos
            </p>
          </div>
          <div>
            <p className="text-[10px] md:text-xs text-muted uppercase tracking-wider">
              Confirmados
            </p>
            <p className="text-xs md:text-sm font-bold text-success mt-0.5">
              {confirmed.length}
            </p>
          </div>
          <div>
            <p className="text-[10px] md:text-xs text-muted uppercase tracking-wider">
              Presentes
            </p>
            <p className="text-xs md:text-sm font-bold text-success mt-0.5">
              {attendedCount}
            </p>
          </div>
          {waitlisted.length > 0 && (
            <div>
              <p className="text-[10px] md:text-xs text-muted uppercase tracking-wider">
                En espera
              </p>
              <p className="text-xs md:text-sm font-bold text-brand mt-0.5">
                {waitlisted.length}
              </p>
            </div>
          )}
          <div>
            <p className="text-[10px] md:text-xs text-muted uppercase tracking-wider">
              Disponibles
            </p>
            <p className="text-xs md:text-sm font-bold text-primary mt-0.5">
              {Math.max(0, effectiveMaxCapacity - confirmed.length)}
            </p>
          </div>
        </div>

        {/* Barra de ocupación */}
        <OccupancyBar
          confirmed={confirmed.length}
          waitlisted={waitlisted.length}
          max={effectiveMaxCapacity}
          large
        />
      </div>

      {/* Confirmados */}
      <AttendeesList
        title="Confirmados"
        bookings={confirmed.map((b) => ({
          id: b.id,
          status: "CONFIRMED" as const,
          waitlistPos: null,
          createdAt: b.createdAt,
          user: b.user,
        }))}
        emptyMessage="Nadie reservó esta clase todavía."
        accent="emerald"
        allowRemove={isAdmin}
      />

      {/* Lista de espera */}
      {waitlisted.length > 0 && (
        <AttendeesList
          title="Lista de espera"
          bookings={waitlisted.map((b) => ({
            id: b.id,
            status: "WAITLISTED" as const,
            waitlistPos: b.waitlistPos,
            createdAt: b.createdAt,
            user: b.user,
          }))}
          accent="orange"
          allowRemove={isAdmin}
        />
      )}
    </div>
  );
}
