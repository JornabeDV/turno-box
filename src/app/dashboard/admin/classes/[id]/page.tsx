// Vista de detalle de una clase: asistentes confirmados + lista de espera
// Accesible desde la tabla del dashboard o desde /dashboard/admin/classes
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toClassDate, formatTime, formatDate } from "@/lib/utils";
import { AttendeesList } from "@/components/admin/AttendeesList";
import { OccupancyBar } from "@/components/admin/OccupancyBar";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ date?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const gymClass = await prisma.gymClass.findUnique({ where: { id }, select: { name: true } });
  return { title: gymClass?.name ?? "Detalle de clase" };
}

export default async function ClassDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { date } = await searchParams;

  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || !["ADMIN", "COACH"].includes(user.role ?? "")) redirect("/");
  if (!user.gymId) redirect("/");

  // Fecha del turno — si no viene en query params, usar hoy
  const targetDate = date ? new Date(date) : new Date();
  const classDate = toClassDate(targetDate);

  const gymClass = await prisma.gymClass.findFirst({
    where: { id, gymId: user.gymId, deletedAt: null },
    select: {
      id: true,
      name: true,
      startTime: true,
      endTime: true,
      maxCapacity: true,
      color: true,
      description: true,
      coach: { select: { name: true } },
    },
  });

  if (!gymClass) notFound();

  const bookings = await prisma.booking.findMany({
    where: { classId: id, classDate, deletedAt: null, status: { in: ["CONFIRMED", "WAITLISTED"] } },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      status: true,
      waitlistPos: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  const confirmed = bookings.filter((b) => b.status === "CONFIRMED");
  const waitlisted = bookings.filter((b) => b.status === "WAITLISTED");

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/admin"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft size={13} />
        Dashboard
      </Link>

      {/* Header de la clase */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <span
            className="size-3 rounded-full mt-1.5 shrink-0"
            style={{ backgroundColor: gymClass.color ?? "#f97316" }}
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-zinc-100 tracking-tight">{gymClass.name}</h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              {formatDate(targetDate)} · {formatTime(gymClass.startTime)} – {formatTime(gymClass.endTime)}
              {gymClass.coach?.name && ` · ${gymClass.coach.name}`}
            </p>
            {gymClass.description && (
              <p className="text-xs text-zinc-600 mt-1.5">{gymClass.description}</p>
            )}
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
