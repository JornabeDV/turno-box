import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getClassSlotsForDay } from "@/lib/queries/classes";
import { getTodayInGymTimezone } from "@/lib/utils";
import { CoachWeeklyClient } from "@/app/dashboard/coach/CoachWeeklyClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mis clases" };

const DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

function getWeekStart(dateStr?: string): Date {
  let base: Date;
  if (dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    base = new Date(y, m - 1, d);
  } else {
    base = getTodayInGymTimezone();
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

export default async function AdminMyClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; discipline?: string }>;
}) {
  const session = await auth();
  const user = session?.user as
    | { id?: string; role?: string; gymId?: string }
    | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const coach = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      gym: { select: { logoUrl: true, phone: true } },
    },
  });

  const firstName = coach?.name?.split(" ")[0] ?? "Administrador";

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
        getClassSlotsForDay(user.gymId!, date, user.id!, user.id!),
      ),
    ),
  ]);

  const filteredSlotsPerDay = slotsPerDay.map((slots) =>
    discipline ? slots.filter((s) => s.disciplineName === discipline) : slots,
  );

  return (
    <div className="space-y-5">
      {/* Saludo */}
      <div className="pt-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {coach?.gym?.logoUrl && (
              <div className="shrink-0 w-20 h-20 rounded-xl border border-border bg-card overflow-hidden flex items-center justify-center p-1.5">
                <img
                  src={coach.gym.logoUrl}
                  alt="Logo del gimnasio"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div>
              <h1 className="font-[family-name:var(--font-oswald)] font-bold text-brand uppercase tracking-tight text-3xl md:text-4xl leading-none">
                Hola, {firstName}
              </h1>
              <p className="text-sm md:text-base text-secondary mt-1 font-[family-name:var(--font-oswald)]">
                Estas son tus clases de la semana.
              </p>
            </div>
          </div>
        </div>
      </div>

      <CoachWeeklyClient
        disciplines={disciplines}
        weekParam={weekParam}
        prevWeek={prevWeek}
        nextWeek={nextWeek}
        filteredSlotsPerDay={filteredSlotsPerDay}
        weekStartStr={weekParam}
        discipline={discipline}
        basePath="/dashboard/admin/my-classes"
      />
    </div>
  );
}
