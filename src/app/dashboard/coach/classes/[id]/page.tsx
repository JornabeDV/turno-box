import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toClassDate, formatTime, formatDate } from "@/lib/utils";
import { AttendeesList } from "@/components/admin/AttendeesList";
import { OccupancyBar } from "@/components/admin/OccupancyBar";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

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

export default async function CoachClassDetailPage({
  params,
  searchParams,
}: Props) {
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

  const [gymClass, classOverride, bookings] = await Promise.all([
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
        coach: { select: { name: true } },
        discipline: { select: { name: true } },
      },
    }),
    prisma.classOverride.findUnique({
      where: { gymClassId_date: { gymClassId: id, date: classDate } },
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
        createdAt: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
  ]);

  if (!gymClass) notFound();

  // Un coach solo puede ver la clase si es su coach base o si tiene un override
  // asignado para esta fecha. Un admin puede ver cualquier clase de su gym.
  const effectiveCoachId = classOverride?.coachId ?? gymClass.coachId;
  if (
    user.role === "COACH" &&
    gymClass.coachId !== user.id &&
    classOverride?.coachId !== user.id
  ) {
    notFound();
  }

  // Si el override cancela la clase, mostramos el mensaje igual que el admin.
  const isCancelled = classOverride?.isCancelled ?? false;

  const confirmed = bookings.filter((b) => b.status === "CONFIRMED");
  const waitlisted = bookings.filter((b) => b.status === "WAITLISTED");

  const effectiveStartTime = classOverride?.startTime ?? gymClass.startTime;
  const effectiveEndTime = classOverride?.endTime ?? gymClass.endTime;
  const effectiveMaxCapacity = classOverride?.maxCapacity ?? gymClass.maxCapacity;
  const effectiveColor = classOverride?.color ?? gymClass.color;
  const effectiveDescription = classOverride?.description ?? gymClass.description;
  const effectiveCoachName =
    effectiveCoachId === gymClass.coachId
      ? gymClass.coach?.name ?? null
      : null; // coach puntual: no mostramos nombre a menos que esté en la relación

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/coach"
        className="inline-flex items-center gap-1.5 text-sm text-[#6B8A99] hover:text-[#EAEAEA] transition-colors"
      >
        <ArrowLeftIcon size={13} />
        Mis clases
      </Link>

      {/* Header de la clase */}
      <div className="bg-[#0E2A38] border border-[#1A4A63] p-5">
        <div className="flex items-start gap-3 mb-4">
          <span
            className="size-3 rounded-full mt-1.5 shrink-0"
            style={{ backgroundColor: effectiveColor ?? "#f97316" }}
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-[#EAEAEA] tracking-tight">
              {gymClass.discipline?.name ?? "Sin disciplina"}
            </h2>
            <p className="text-sm text-[#6B8A99] mt-0.5">
              {formatDate(targetDate)} · {formatTime(effectiveStartTime)} –{" "}
              {formatTime(effectiveEndTime)}
              {effectiveCoachName && ` · ${effectiveCoachName}`}
            </p>
            {effectiveDescription && (
              <p className="text-xs text-[#4A6B7A] mt-1.5">
                {effectiveDescription}
              </p>
            )}
          </div>
        </div>

        {isCancelled ? (
          <div className="rounded-[2px] bg-[#E61919]/10 border border-[#E61919]/20 px-4 py-3">
            <p className="text-sm font-semibold text-[#E61919]">
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
            allowRemove={false}
          />

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
              allowRemove={false}
            />
          )}
        </>
      )}
    </div>
  );
}
