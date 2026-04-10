import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toClassDate } from "@/lib/utils";
import { ToggleCoachButton } from "@/components/admin/ToggleCoachButton";
import { AddCoachButton } from "@/components/admin/AddCoachButton";
import { MetricCard } from "@/components/admin/MetricCard";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Coaches" };

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lun", TUESDAY: "Mar", WEDNESDAY: "Mié",
  THURSDAY: "Jue", FRIDAY: "Vie", SATURDAY: "Sáb", SUNDAY: "Dom",
};
const DAY_ORDER = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];

export default async function CoachesPage() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const today = toClassDate(new Date());
  const dayOfWeek = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"][new Date().getDay()];

  const coaches = await prisma.user.findMany({
    where: { gymId: user.gymId, role: "COACH" },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      taughtClasses: {
        where: { deletedAt: null, isActive: true },
        select: {
          id: true,
          dayOfWeek: true,
          bookings: {
            where: { classDate: today, deletedAt: null, status: "CONFIRMED" },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const active = coaches.filter((c) => c.isActive).length;
  const teachingToday = coaches.filter((c) =>
    c.taughtClasses.some((cls) => cls.dayOfWeek === dayOfWeek)
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Admin</p>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Coaches</h2>
        </div>
        <AddCoachButton />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Total"         value={coaches.length}  icon="users"    />
        <MetricCard label="Activos"        value={active}          icon="check"    accent="emerald" />
        <MetricCard label="Dan clases hoy" value={teachingToday}   icon="calendar" accent="orange" />
      </div>

      {coaches.length === 0 ? (
        <div className="glass-card rounded-2xl px-4 py-16 text-center">
          <p className="text-sm text-zinc-500">No hay coaches registrados.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="divide-y divide-white/[0.04]">
            {coaches.map((coach, i) => {
              const initials = coach.name
                ? coach.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                : coach.email[0].toUpperCase();

              const classCount = coach.taughtClasses.length;
              const todayAttendees = coach.taughtClasses
                .filter((cls) => cls.dayOfWeek === dayOfWeek)
                .reduce((acc, cls) => acc + cls.bookings.length, 0);

              // Días únicos en los que da clases
              const teachingDays = [...new Set(coach.taughtClasses.map((c) => c.dayOfWeek))]
                .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));

              return (
                <div
                  key={coach.id}
                  className={cn("flex items-center gap-3 px-4 py-3.5 animate-in", `stagger-${Math.min(i + 1, 6)}`)}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "size-10 rounded-xl border flex items-center justify-center text-sm font-bold shrink-0",
                    coach.isActive
                      ? "bg-orange-500/10 border-orange-500/20 text-orange-400"
                      : "bg-zinc-900 border-white/[0.04] text-zinc-600"
                  )}>
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium truncate leading-tight", coach.isActive ? "text-zinc-100" : "text-zinc-500")}>
                      {coach.name ?? "Sin nombre"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-zinc-600 truncate">{coach.email}</p>
                    </div>
                  </div>

                  {/* Días que enseña */}
                  <div className="hidden md:flex items-center gap-1 shrink-0">
                    {teachingDays.length === 0 ? (
                      <span className="text-xs text-zinc-700">Sin clases</span>
                    ) : (
                      teachingDays.map((d) => (
                        <span
                          key={d}
                          className={cn(
                            "text-[10px] font-medium px-1.5 py-0.5 rounded-md",
                            d === dayOfWeek
                              ? "bg-orange-500/15 text-orange-400"
                              : "bg-zinc-800 text-zinc-500"
                          )}
                        >
                          {DAY_LABELS[d]}
                        </span>
                      ))
                    )}
                  </div>

                  {/* Clases totales + asistentes hoy */}
                  <div className="hidden sm:flex flex-col items-end shrink-0 min-w-[60px]">
                    <span className="text-xs font-mono text-zinc-400 tabular-nums">
                      {classCount} {classCount === 1 ? "clase" : "clases"}
                    </span>
                    {todayAttendees > 0 && (
                      <span className="text-[10px] text-emerald-500 tabular-nums">
                        {todayAttendees} hoy
                      </span>
                    )}
                  </div>

                  {/* Acciones */}
                  <ToggleCoachButton coachId={coach.id} initialIsActive={coach.isActive} />

                  <Link
                    href={`/dashboard/admin/coaches/${coach.id}`}
                    className="size-7 rounded-lg flex items-center justify-center text-zinc-700 hover:text-zinc-400 hover:bg-white/[0.04] transition-all shrink-0"
                  >
                    <ArrowRightIcon size={13} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
