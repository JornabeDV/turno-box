import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toClassDate, formatDate } from "@/lib/utils";
import { TodayClassesTable } from "@/components/admin/TodayClassesTable";
import { MetricCard } from "@/components/admin/MetricCard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Coach — Mis clases" };

export default async function CoachDashboardPage() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;

  if (!user?.id || !["ADMIN", "COACH"].includes(user.role ?? "")) redirect("/");
  if (!user.gymId) redirect("/");

  const today = new Date();
  const classDate = toClassDate(today);
  const dayOfWeek = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"][today.getDay()];

  const classes = await prisma.gymClass.findMany({
    where: {
      gymId: user.gymId,
      coachId: user.id,
      isActive: true,
      deletedAt: null,
      dayOfWeek: dayOfWeek as never,
    },
    select: {
      id: true,
      name: true,
      startTime: true,
      maxCapacity: true,
      color: true,
      coach: { select: { name: true } },
      bookings: {
        where: { classDate, deletedAt: null },
        select: { status: true },
      },
    },
    orderBy: { startTime: "asc" },
  });

  const totalConfirmed = classes.reduce(
    (acc: number, c) => acc + c.bookings.filter((b: { status: string }) => b.status === "CONFIRMED").length,
    0
  );
  const totalWaitlisted = classes.reduce(
    (acc: number, c) => acc + c.bookings.filter((b: { status: string }) => b.status === "WAITLISTED").length,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">
          {formatDate(today)}
        </p>
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Mis clases hoy</h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Clases" value={classes.length} icon="calendar" />
        <MetricCard label="Confirmados" value={totalConfirmed} icon="check" accent="emerald" />
        <MetricCard label="En espera" value={totalWaitlisted} icon="x" accent="orange" />
      </div>

      <TodayClassesTable
        classes={classes}
        classDate={classDate}
        gymId={user.gymId}
        basePath="/dashboard/coach/classes"
      />
    </div>
  );
}
