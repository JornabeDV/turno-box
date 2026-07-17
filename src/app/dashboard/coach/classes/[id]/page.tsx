import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toClassDate } from "@/lib/utils";
import { CoachClassDetailView } from "@/components/coach/CoachClassDetailView";
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
        disciplineId: true,
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
        attendedAt: true,
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

  const isCancelled = classOverride?.isCancelled ?? false;

  const effectiveCoachName =
    effectiveCoachId === gymClass.coachId
      ? gymClass.coach?.name ?? null
      : null;

  const effectiveDisciplineId = classOverride?.disciplineId ?? gymClass.disciplineId;
  const effectiveDiscipline = await prisma.discipline.findUnique({
    where: { id: effectiveDisciplineId },
    select: { name: true },
  });
  const effectiveDisciplineName = effectiveDiscipline?.name ?? gymClass.discipline?.name ?? "Sin disciplina";

  const userIds = [...new Set(bookings.map((b) => b.user.id))];
  const creditBalances = await prisma.userCreditBalance.findMany({
    where: { userId: { in: userIds }, gymId: user.gymId },
    select: { userId: true, availableCredits: true },
  });
  const creditsByUser = new Map(
    creditBalances.map((c) => [c.userId, c.availableCredits]),
  );

  const bookingsWithCredits = bookings.map((b) => ({
    ...b,
    credits: creditsByUser.get(b.user.id) ?? 0,
  }));

  return (
    <CoachClassDetailView
      gymClass={gymClass}
      classOverride={classOverride}
      bookings={bookingsWithCredits}
      targetDate={targetDate}
      classDate={classDate}
      effectiveCoachName={effectiveCoachName}
      effectiveDisciplineName={effectiveDisciplineName}
      isCancelled={isCancelled}
      backHref="/dashboard/coach"
    />
  );
}
