import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cn, formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { BookingActions } from "@/components/booking/BookingActions";
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  UsersIcon,
  InfoIcon,
  CaretLeftIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Detalle de clase" };

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

  const classDate = new Date(date + "T00:00:00.000Z");

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
  const [h, m] = gymClass.startTime.split(":").map(Number);
  const classStart = new Date(classDate);
  classStart.setUTCHours(h, m, 0, 0);
  const cancelDeadline = new Date(
    classStart.getTime() - cancelWindowHours * 3_600_000,
  );

  const occupancyPct = Math.round(
    (confirmedCount / gymClass.maxCapacity) * 100,
  );
  const spotsColor = isFull
    ? "bg-[#E61919]"
    : availableSpots <= Math.ceil(gymClass.maxCapacity * 0.25)
      ? "bg-[#F78837]"
      : "bg-[#27C7B8]";

  const badgeVariant =
    userBooking?.status === "CONFIRMED"
      ? "confirmed"
      : userBooking?.status === "WAITLISTED"
        ? "waitlist"
        : isFull
          ? "full"
          : "available";

  return (
    <section className="pt-4 pb-8 space-y-4">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-[#6B8A99] hover:text-[#EAEAEA] transition-colors font-[family-name:var(--font-oswald)] uppercase tracking-wide"
      >
        <CaretLeftIcon size={14} />
        Volver
      </Link>

      {/* Título */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="size-3 shrink-0"
            style={{ backgroundColor: gymClass.color ?? "#F78837" }}
          />
          <h2 className="text-xl font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight">
            {gymClass.discipline?.name ?? "Clase"}
          </h2>
        </div>
        <Badge variant={badgeVariant} />
      </div>

      {/* Info de la clase */}
      <div className="bg-[#0E2A38] border border-[#1A4A63] p-5 space-y-4">
        {/* Fecha */}
        <div className="flex items-center gap-2.5 text-sm text-[#EAEAEA]">
          <CalendarIcon size={16} className="text-[#6B8A99] shrink-0" />
          <span className="capitalize font-[family-name:var(--font-oswald)]">
            {classDate.toLocaleDateString("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone: "America/Argentina/Buenos_Aires",
            })}
          </span>
        </div>

        {/* Horario */}
        <div className="flex items-center gap-2.5 text-sm text-[#EAEAEA]">
          <ClockIcon size={16} className="text-[#6B8A99] shrink-0" />
          <span className="font-[family-name:var(--font-jetbrains)] tabular-nums uppercase">
            {formatTime(gymClass.startTime)}
          </span>
          <span className="text-[#4A6B7A]">—</span>
          <span className="font-[family-name:var(--font-jetbrains)] tabular-nums text-[#6B8A99] uppercase">
            {formatTime(gymClass.endTime)}
          </span>
        </div>

        {/* Coach */}
        {gymClass.coach?.name && (
          <div className="flex items-center gap-2.5 text-sm text-[#EAEAEA]">
            <UserIcon size={16} className="text-[#6B8A99] shrink-0" />
            <span className="font-[family-name:var(--font-oswald)]">{gymClass.coach.name}</span>
          </div>
        )}

        {/* Cupos */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <UsersIcon size={16} className="text-[#6B8A99] shrink-0" />
            <span
              className={cn(
                "text-sm tabular-nums font-medium font-[family-name:var(--font-jetbrains)] uppercase",
                isFull
                  ? "text-[#E61919]"
                  : availableSpots <= Math.ceil(gymClass.maxCapacity * 0.25)
                    ? "text-[#F78837]"
                    : "text-[#EAEAEA]",
              )}
            >
              {confirmedCount} / {gymClass.maxCapacity} cupos
            </span>
            {!isFull && (
              <span className="text-xs text-[#4A6B7A] font-[family-name:var(--font-oswald)]">
                · {availableSpots}{" "}
                {availableSpots === 1 ? "lugar libre" : "lugares libres"}
              </span>
            )}
          </div>
          <div className="h-1.5 w-full bg-[#0A1F2A] overflow-hidden">
            <div
              className={cn("h-full transition-all", spotsColor)}
              style={{ width: `${occupancyPct}%` }}
            />
          </div>
        </div>

        {/* Descripción */}
        {gymClass.description && (
          <p className="text-sm text-[#6B8A99] leading-relaxed border-t border-[#1A4A63] pt-4 font-[family-name:var(--font-oswald)]">
            {gymClass.description}
          </p>
        )}
      </div>

      {/* Ventana de cancelación */}
      <div className="bg-[#0E2A38] border border-[#1A4A63] px-4 py-3.5 flex items-start gap-3">
        <InfoIcon size={15} className="text-[#4A6B7A] mt-0.5 shrink-0" />
        <p className="text-xs text-[#6B8A99] leading-relaxed font-[family-name:var(--font-oswald)]">
          Cancelá antes de las{" "}
          <span className="text-[#EAEAEA] font-bold">
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
