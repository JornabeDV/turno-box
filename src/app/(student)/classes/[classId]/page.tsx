import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cn, formatTime, toClassDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { BackButton } from "@/components/ui/BackButton";
import { BookingActions } from "@/components/booking/BookingActions";
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  UsersIcon,
  InfoIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Detalle de clase" };
export const dynamic = "force-dynamic";

export default async function ClassDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { classId } = await params;
  const { date } = await searchParams;
  if (!date) redirect("/");

  const userId = session.user.id;
  const gymId = (session.user as { gymId?: string }).gymId;
  if (!gymId) redirect("/");

  const classDate = toClassDate(new Date(date));
  // Fecha para mostrar al usuario (con offset ARG, no UTC)
  const displayDate = new Date(`${date}T00:00:00-03:00`);

  const gymClass = await prisma.gymClass.findFirst({
    where: { id: classId, gymId, isActive: true, deletedAt: null },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      maxCapacity: true,
      color: true,
      description: true,
      discipline: { select: { name: true } },
      coach: { select: { name: true } },
      gym: { select: { cancelWindowHours: true } },
      bookings: {
        where: { classDate, deletedAt: null },
        select: { id: true, status: true, userId: true, waitlistPos: true },
      },
    },
  });

  if (!gymClass) redirect("/");

  const confirmed = gymClass.bookings.filter((b) => b.status === "CONFIRMED");
  const confirmedCount = confirmed.length;
  const availableSpots = Math.max(0, gymClass.maxCapacity - confirmedCount);
  const isFull = availableSpots === 0;
  const raw = gymClass.bookings.find((b) => b.userId === userId) ?? null;
  const userBooking = raw
    ? {
        id: raw.id,
        status: raw.status as "CONFIRMED" | "WAITLISTED",
        waitlistPos: raw.waitlistPos,
      }
    : null;

  const cancelWindowHours = gymClass.gym?.cancelWindowHours ?? 2;
  // startTime está en hora de Argentina (UTC-3)
  const classStart = new Date(
    `${date}T${gymClass.startTime}:00-03:00`,
  );
  const cancelDeadline = new Date(
    classStart.getTime() - cancelWindowHours * 3_600_000,
  );

  const occupancyPct = Math.round(
    (confirmedCount / gymClass.maxCapacity) * 100,
  );
  const spotsColor = isFull
    ? "bg-danger"
    : availableSpots <= Math.ceil(gymClass.maxCapacity * 0.25)
      ? "bg-brand"
      : "bg-success";

  const badgeVariant =
    userBooking?.status === "CONFIRMED"
      ? "confirmed"
      : userBooking?.status === "WAITLISTED"
        ? "waitlist"
        : isFull
          ? "full"
          : "available";

  return (
    <section className="pt-4 md:pt-8 pb-8 md:pb-12 space-y-4 md:space-y-6">
      <BackButton href="/" />

      {/* Título */}
      <div className="flex items-center justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-2.5 md:gap-3">
          <span
            className="size-3 md:size-4 shrink-0"
            style={{ backgroundColor: gymClass.color ?? "#F78837" }}
          />
          <h2 className="text-xl md:text-3xl font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight">
            {gymClass.discipline?.name ?? "Clase"}
          </h2>
        </div>
        <Badge variant={badgeVariant} />
      </div>

      {/* Info de la clase */}
      <div className="bg-card border border-border p-5 md:p-8 space-y-4 md:space-y-6">
        {/* Fecha */}
        <div className="flex items-center gap-2.5 md:gap-3 text-sm md:text-base text-primary">
          <CalendarIcon size={16} className="text-secondary shrink-0 md:size-5" />
          <span className="capitalize font-[family-name:var(--font-oswald)]">
            {displayDate.toLocaleDateString("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone: "America/Argentina/Buenos_Aires",
            })}
          </span>
        </div>

        {/* Horario */}
        <div className="flex items-center gap-2.5 md:gap-3 text-sm md:text-base text-primary">
          <ClockIcon size={16} className="text-secondary shrink-0 md:size-5" />
          <span className="font-[family-name:var(--font-jetbrains)] tabular-nums uppercase">
            {formatTime(gymClass.startTime)}
          </span>
          <span className="text-muted">—</span>
          <span className="font-[family-name:var(--font-jetbrains)] tabular-nums text-secondary uppercase">
            {formatTime(gymClass.endTime)}
          </span>
        </div>

        {/* Coach */}
        {gymClass.coach?.name && (
          <div className="flex items-center gap-2.5 md:gap-3 text-sm md:text-base text-primary">
            <UserIcon size={16} className="text-secondary shrink-0 md:size-5" />
            <span className="font-[family-name:var(--font-oswald)]">{gymClass.coach.name}</span>
          </div>
        )}

        {/* Cupos */}
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-center gap-2.5 md:gap-3">
            <UsersIcon size={16} className="text-secondary shrink-0 md:size-5" />
            <span
              className={cn(
                "text-sm md:text-base tabular-nums font-medium font-[family-name:var(--font-jetbrains)] uppercase",
                isFull
                  ? "text-danger"
                  : availableSpots <= Math.ceil(gymClass.maxCapacity * 0.25)
                    ? "text-brand"
                    : "text-primary",
              )}
            >
              {confirmedCount} / {gymClass.maxCapacity} cupos
            </span>
            {!isFull && (
              <span className="text-xs md:text-sm text-muted font-[family-name:var(--font-oswald)]">
                · {availableSpots}{" "}
                {availableSpots === 1 ? "lugar libre" : "lugares libres"}
              </span>
            )}
          </div>
          <div className="h-1.5 md:h-2 w-full bg-page overflow-hidden">
            <div
              className={cn("h-full transition-all", spotsColor)}
              style={{ width: `${occupancyPct}%` }}
            />
          </div>
        </div>

        {/* Descripción */}
        {gymClass.description && (
          <p className="text-sm md:text-base text-secondary leading-relaxed border-t border-border pt-4 md:pt-6 font-[family-name:var(--font-oswald)]">
            {gymClass.description}
          </p>
        )}
      </div>

      {/* Ventana de cancelación */}
      <div className="bg-card border border-border px-4 py-3.5 md:px-6 md:py-5 flex items-start gap-3 md:gap-4">
        <InfoIcon size={16} className="text-secondary shrink-0 mt-0.5 md:size-5" />
        <p className="text-sm md:text-base text-secondary leading-relaxed font-[family-name:var(--font-oswald)]">
          Cancelá antes de las{" "}
          <span className="text-primary font-bold">
            {cancelDeadline.toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "America/Argentina/Buenos_Aires",
            })}
            {" del "}
            {cancelDeadline.toLocaleDateString("es-AR", {
              day: "numeric",
              month: "short",
              timeZone: "America/Argentina/Buenos_Aires",
            })}
          </span>{" "}
          para recuperar el crédito.
        </p>
      </div>

      {/* Acción */}
      <BookingActions
        classId={classId}
        dateStr={date}
        userBooking={userBooking}
        isFull={isFull}
      />
    </section>
  );
}
