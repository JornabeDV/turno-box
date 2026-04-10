import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatTime } from "@/lib/utils";
import { deleteClassAction } from "@/actions/classes";
import { PlusIcon, CopySimpleIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { getClassSlotsForDay } from "@/lib/queries/classes";
import { DisciplinesManager } from "@/components/admin/DisciplinesManager";
import { prisma } from "@/lib/prisma";
import { ClassesPageClient } from "./ClassesPageClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestión de Clases" };

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lunes", TUESDAY: "Martes", WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves", FRIDAY: "Viernes", SATURDAY: "Sábado", SUNDAY: "Domingo",
};
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
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; discipline?: string }>;
}) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const { week, discipline } = await searchParams;
  const weekStart = getWeekStart(week);
  const weekParam = toWeekParam(weekStart);
  const prevWeek = toWeekParam(addDays(weekStart, -7));
  const nextWeek = toWeekParam(addDays(weekStart, 7));

  // Disciplinas del gym
  const disciplines = await prisma.discipline.findMany({
    where: { gymId: user.gymId, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true, description: true },
  });

  // Coaches
  const coaches = await prisma.user.findMany({
    where: { gymId: user.gymId, role: { in: ["COACH", "ADMIN"] }, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const weekDays = DAY_ORDER.map((dayKey, i) => ({
    dayKey,
    date: addDays(weekStart, i),
  }));

  const slotsPerDay = await Promise.all(
    weekDays.map(({ date }) => getClassSlotsForDay(user.gymId!, date, user.id!))
  );

  // Filtrar por disciplina seleccionada (por nombre de disciplina en el slot)
  const filteredSlotsPerDay = slotsPerDay.map((slots) =>
    discipline ? slots.filter((s) => s.disciplineName === discipline) : slots
  );

  const totalClasses = filteredSlotsPerDay.reduce((sum, slots) => sum + slots.length, 0);

  return (
    <ClassesPageClient
      disciplines={disciplines}
      coaches={coaches}
      weekParam={weekParam}
      prevWeek={prevWeek}
      nextWeek={nextWeek}
      filteredSlotsPerDay={filteredSlotsPerDay}
      totalClasses={totalClasses}
      weekStart={weekStart}
      discipline={discipline}
    />
  );
}
