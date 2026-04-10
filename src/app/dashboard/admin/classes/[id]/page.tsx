import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toClassDate, formatTime, formatDate } from "@/lib/utils";
import { AttendeesList } from "@/components/admin/AttendeesList";
import { OccupancyBar } from "@/components/admin/OccupancyBar";
import { ClassDetailActions } from "./ClassDetailActions";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lunes", TUESDAY: "Martes", WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves", FRIDAY: "Viernes", SATURDAY: "Sábado", SUNDAY: "Domingo",
};

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ date?: string }> };

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
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || !["ADMIN", "COACH"].includes(user.role ?? "")) redirect("/");
  if (!user.gymId) redirect("/");

  const targetDate = date ? new Date(date) : new Date();
  const classDate = toClassDate(targetDate);

  const [gymClass, bookings, coaches, disciplines] = await Promise.all([
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
      where: { classId: id, classDate, deletedAt: null, status: { in: ["CONFIRMED", "WAITLISTED"] } },
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        status: true,
        waitlistPos: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
    // Solo el admin necesita los selectores de edición
    user.role === "ADMIN"
      ? prisma.user.findMany({
          where: { gymId: user.gymId, role: { in: ["COACH", "ADMIN"] }, isActive: true },
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
  ]);

  if (!gymClass) notFound();

  const confirmed = bookings.filter((b) => b.status === "CONFIRMED");
  const waitlisted = bookings.filter((b) => b.status === "WAITLISTED");
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/admin/classes"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeftIcon size={13} />
        Clases
      </Link>

      {/* Header de la clase */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span
              className="size-3 rounded-full mt-1.5 shrink-0"
              style={{ backgroundColor: gymClass.color ?? "#f97316" }}
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
                {gymClass.discipline?.name ?? "Sin disciplina"}
              </h2>
              <p className="text-sm text-zinc-500 mt-0.5">
                {DAY_LABELS[gymClass.dayOfWeek]} · {formatDate(targetDate)} · {formatTime(gymClass.startTime)} – {formatTime(gymClass.endTime)}
                {gymClass.coach?.name && ` · ${gymClass.coach.name}`}
              </p>
              {gymClass.description && (
                <p className="text-xs text-zinc-600 mt-1.5">{gymClass.description}</p>
              )}
            </div>
          </div>

          {/* Acciones editar/eliminar — solo admin */}
          {isAdmin && (
            <ClassDetailActions
              classData={{
                id: gymClass.id,
                description: gymClass.description,
                dayOfWeek: gymClass.dayOfWeek,
                startTime: gymClass.startTime,
                endTime: gymClass.endTime,
                maxCapacity: gymClass.maxCapacity,
                color: gymClass.color,
                coachId: gymClass.coachId,
                disciplineId: gymClass.disciplineId,
              }}
              coaches={coaches}
              disciplines={disciplines}
            />
          )}
        </div>

        {/* Stats rápidos */}
        <div className="flex items-center gap-4 mb-4 pt-3 border-t border-white/[0.06]">
          <div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Capacidad</p>
            <p className="text-xs font-bold text-zinc-300 mt-0.5">{gymClass.maxCapacity} cupos</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Confirmados</p>
            <p className="text-xs font-bold text-emerald-400 mt-0.5">{confirmed.length}</p>
          </div>
          {waitlisted.length > 0 && (
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">En espera</p>
              <p className="text-xs font-bold text-orange-400 mt-0.5">{waitlisted.length}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Disponibles</p>
            <p className="text-xs font-bold text-zinc-300 mt-0.5">
              {Math.max(0, gymClass.maxCapacity - confirmed.length)}
            </p>
          </div>
        </div>

        {/* Barra de ocupación */}
        <OccupancyBar
          confirmed={confirmed.length}
          waitlisted={waitlisted.length}
          max={gymClass.maxCapacity}
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
        />
      )}
    </div>
  );
}
