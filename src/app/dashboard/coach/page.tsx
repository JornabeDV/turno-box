import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getClassSlotsForDay } from "@/lib/queries/classes";
import { CoachWeeklyClient } from "./CoachWeeklyClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mis clases" };

const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

function getWeekStart(dateStr?: string): Date {
  let base: Date;
  if (dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    base = new Date(y, m - 1, d);
  } else {
    const now = new Date();
    base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  const day = base.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  base.setDate(base.getDate() + diff);
  return base;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toWeekParam(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default async function CoachDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; discipline?: string }>;
}) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || !["ADMIN", "COACH"].includes(user.role ?? "")) redirect("/");
  if (!user.gymId) redirect("/");

  const { week, discipline } = await searchParams;
  const weekStart = getWeekStart(week);
  const weekParam = toWeekParam(weekStart);
  const prevWeek = toWeekParam(addDays(weekStart, -7));
  const nextWeek = toWeekParam(addDays(weekStart, 7));

  const weekDays = DAY_ORDER.map((_, i) => addDays(weekStart, i));

  const [disciplines, slotsPerDay] = await Promise.all([
    prisma.discipline.findMany({
      where: { gymId: user.gymId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true },
    }),
    Promise.all(
      weekDays.map((date) =>
        getClassSlotsForDay(user.gymId!, date, user.id!, user.id!)
      )
    ),
  ]);

  const filteredSlotsPerDay = slotsPerDay.map((slots) =>
    discipline ? slots.filter((s) => s.disciplineName === discipline) : slots
  );

  return (
    <CoachWeeklyClient
      disciplines={disciplines}
      weekParam={weekParam}
      prevWeek={prevWeek}
      nextWeek={nextWeek}
      filteredSlotsPerDay={filteredSlotsPerDay}
      weekStart={weekStart}
      discipline={discipline}
    />
  );
}
