"use client";

import { CoachAttendeesList } from "@/components/coach/CoachAttendeesList";
import { AddStudentToClassButton } from "@/components/coach/AddStudentToClassButton";
import { OccupancyBar } from "@/components/admin/OccupancyBar";
import { BackButton } from "@/components/ui/BackButton";
import { formatTime, formatDate } from "@/lib/utils";
import type { BookingStatus, Prisma } from "@prisma/client";

type GymClassForDetail = {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  color: string | null;
  description: string | null;
  coachId: string | null;
  coach: { name: string | null } | null;
  discipline: { name: string | null } | null;
};

type BookingForDetail = {
  id: string;
  status: BookingStatus;
  waitlistPos: number | null;
  attendedAt: Date | null;
  createdAt: Date;
  credits: number;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

interface Props {
  gymClass: GymClassForDetail;
  classOverride: Prisma.ClassOverrideGetPayload<{ select: {
    coachId: true;
    startTime: true;
    endTime: true;
    maxCapacity: true;
    color: true;
    description: true;
    isCancelled: true;
  } }> | null;
  bookings: BookingForDetail[];
  targetDate: Date;
  classDate: Date;
  effectiveCoachName: string | null;
  effectiveDisciplineName: string | null;
  isCancelled: boolean;
  backHref: string;
}

export function CoachClassDetailView({
  gymClass,
  classOverride,
  bookings,
  targetDate,
  classDate,
  effectiveCoachName,
  effectiveDisciplineName,
  isCancelled,
  backHref,
}: Props) {
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED");
  const waitlisted = bookings.filter((b) => b.status === "WAITLISTED");
  const attendedCount = confirmed.filter((b) => b.attendedAt).length;

  const effectiveStartTime = classOverride?.startTime ?? gymClass.startTime;
  const effectiveEndTime = classOverride?.endTime ?? gymClass.endTime;
  const effectiveMaxCapacity = classOverride?.maxCapacity ?? gymClass.maxCapacity;
  const effectiveColor = classOverride?.color ?? gymClass.color;
  const effectiveDescription = classOverride?.description ?? gymClass.description;

  const dateStr = targetDate.toISOString().slice(0, 10);

  return (
    <div className="space-y-6 md:space-y-8">
      <BackButton href={backHref} />

      {/* Header de la clase */}
      <div className="bg-card border border-border p-5 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 md:gap-6 mb-4 md:mb-6">
          <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
            <span
              className="size-3 md:size-4 rounded-full mt-1.5 shrink-0"
              style={{ backgroundColor: effectiveColor ?? "#f97316" }}
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-3xl font-bold text-primary tracking-tight">
                {effectiveDisciplineName ?? gymClass.discipline?.name ?? "Sin disciplina"}
              </h2>
              <p className="text-sm md:text-lg text-secondary mt-0.5 md:mt-1.5">
                {formatDate(targetDate)} · {formatTime(effectiveStartTime)} –{" "}
                {formatTime(effectiveEndTime)}
                {effectiveCoachName && ` · ${effectiveCoachName}`}
              </p>
              {effectiveDescription && (
                <p className="text-xs md:text-sm text-muted mt-1.5 md:mt-2">
                  {effectiveDescription}
                </p>
              )}
            </div>
          </div>
          {!isCancelled && (
            <div className="flex items-center gap-2 shrink-0">
              <AddStudentToClassButton
                classId={gymClass.id}
                dateStr={dateStr}
              />
            </div>
          )}
        </div>

        {/* Resumen */}
        {!isCancelled && (
          <div className="grid grid-cols-3 gap-3 md:gap-5 mb-4 md:mb-6 pt-3 md:pt-5 border-t border-border">
            <div>
              <p className="text-[10px] md:text-sm text-muted uppercase tracking-wider">
                Confirmados
              </p>
              <p className="text-sm md:text-lg font-bold text-primary mt-0.5 md:mt-1">{confirmed.length}</p>
            </div>
            <div>
              <p className="text-[10px] md:text-sm text-muted uppercase tracking-wider">
                Presentes
              </p>
              <p className="text-sm md:text-lg font-bold text-success mt-0.5 md:mt-1">{attendedCount}</p>
            </div>
            <div>
              <p className="text-[10px] md:text-sm text-muted uppercase tracking-wider">
                Capacidad
              </p>
              <p className="text-sm md:text-lg font-bold text-primary mt-0.5 md:mt-1">
                {effectiveMaxCapacity}
              </p>
            </div>
          </div>
        )}

        {isCancelled ? (
          <div className="rounded-[2px] bg-danger/10 border border-danger/20 px-4 py-3 md:px-6 md:py-4">
            <p className="text-sm md:text-base font-semibold text-danger">
              Esta clase está cancelada para el {formatDate(targetDate)}
            </p>
          </div>
        ) : (
          <OccupancyBar
            confirmed={confirmed.length}
            waitlisted={waitlisted.length}
            max={effectiveMaxCapacity}
            large
          />
        )}
      </div>

      {!isCancelled && (
        <>
          <CoachAttendeesList
            title="Confirmados"
            bookings={confirmed.map((b) => ({
              id: b.id,
              status: "CONFIRMED" as const,
              waitlistPos: null,
              attendedAt: b.attendedAt,
              createdAt: b.createdAt,
              credits: b.credits,
              user: b.user,
            }))}
            emptyMessage="Nadie reservó esta clase todavía."
            accent="emerald"
          />

          {waitlisted.length > 0 && (
            <CoachAttendeesList
              title="Lista de espera"
              bookings={waitlisted.map((b) => ({
                id: b.id,
                status: "WAITLISTED" as const,
                waitlistPos: b.waitlistPos,
                attendedAt: b.attendedAt,
                createdAt: b.createdAt,
                credits: b.credits,
                user: b.user,
              }))}
              accent="orange"
            />
          )}
        </>
      )}
    </div>
  );
}
